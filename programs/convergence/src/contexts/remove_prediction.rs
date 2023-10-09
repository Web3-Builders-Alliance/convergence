use std::collections::BTreeMap;

use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RemovePrediction<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), poll.question.as_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      mut,
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      bump = user_prediction.bump,
      close = forecaster
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    #[account(
        init,
        payer = forecaster,
        seeds=[PredictionUpdate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), &poll.num_prediction_updates.to_le_bytes()],
        space= PredictionUpdate::LEN,
        bump,
    )]
    pub prediction_update: Account<'info, PredictionUpdate>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    #[account(
        mut,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        bump = user_score.bump,
        close = forecaster
      )]
    pub user_score: Account<'info, UserScore>,
    pub system_program: Program<'info, System>,
}

impl<'info> RemovePrediction<'info> {
    pub fn remove_prediction(&mut self, bumps: &BTreeMap<String, u8>) -> Result<()> {
        if !self.poll.open {
            return err!(CustomErrorCode::PollClosed);
        }
        match self.poll.crowd_prediction {
            Some(crowd_prediction) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_prediction_updates > 0);
                self.poll.num_prediction_updates += 1;

                let old_prediction = self.user_prediction.get_prediction();
                let old_uncertainty = (self.user_prediction.upper_prediction
                    - self.user_prediction.lower_prediction)
                    as f32
                    / 100.0;

                let op_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                );
                let cp_f = convert_to_float(crowd_prediction);

                if self.poll.num_forecasters == 1 {
                    self.poll.crowd_prediction = None;
                } else {
                    let new_cp_f = (self.poll.accumulated_weights * cp_f
                        - (1.0 - old_uncertainty) * self.user_prediction.weight * op_f)
                        / (self.poll.accumulated_weights
                            - (1.0 - old_uncertainty) * self.user_prediction.weight);
                    let new_crowd_prediction = convert_from_float(new_cp_f);
                    self.poll.crowd_prediction = Some(new_crowd_prediction);
                }

                self.poll.num_forecasters -= 1;
                self.poll.accumulated_weights -=
                    (1.0 - old_uncertainty) * self.user_prediction.weight;

                let current_slot = Clock::get().unwrap().slot;
                let last_slot = self.scoring_list.last_slot;

                for num in self
                    .scoring_list
                    .options
                    .iter_mut()
                    .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
                {
                    *num -= (current_slot - last_slot) as i64;
                }

                for cost in self
                    .scoring_list
                    .cost
                    .iter_mut()
                    .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
                {
                    *cost -= (current_slot - last_slot) as f32 * cp_f / 100.0;
                }

                for num in self
                    .scoring_list
                    .options
                    .iter_mut()
                    .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
                {
                    *num += (current_slot - last_slot) as i64;
                }

                for cost in self
                    .scoring_list
                    .cost
                    .iter_mut()
                    .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
                {
                    *cost += (current_slot - last_slot) as f32 * cp_f / 100.0;
                }

                self.scoring_list.last_slot = current_slot;
                msg!("Updated crowd prediction");
            }
            None => {
                assert!(false);
            }
        }

        self.prediction_update.set_inner(PredictionUpdate::new(
            self.poll.crowd_prediction,
            *bumps
                .get("prediction_update")
                .expect("Failed to fetch bump for 'prediction_update'"),
        ));

        Ok(())
    }
}
