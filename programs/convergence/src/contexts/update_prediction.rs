use std::collections::BTreeMap;

use crate::constants::EPSILON;
use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdatePrediction<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), &anchor_lang::solana_program::hash::hash(poll.question.as_bytes()).to_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      mut,
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      bump = user_prediction.bump,
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
        bump=user_score.bump,
      )]
    pub user_score: Account<'info, UserScore>,
    pub system_program: Program<'info, System>,
}

impl<'info> UpdatePrediction<'info> {
    pub fn update_crowd_prediction(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        new_prediction: u16,
        new_uncertainty: f32,
    ) -> Result<()> {
        assert!(new_prediction <= 100);
        if !self.poll.open {
            return err!(CustomErrorCode::PollClosed);
        }
        match self.poll.crowd_prediction {
            Some(crowd_prediction) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_prediction_updates > 0);
                assert!(self.poll.accumulated_weights > 0.0);
                self.poll.num_prediction_updates += 1;

                // update crowd prediction
                let old_prediction = self.user_prediction.get_prediction();
                let old_uncertainty = (self.user_prediction.upper_prediction
                    - self.user_prediction.lower_prediction)
                    as f32
                    / 100.0;
                let op_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                );
                let cp_f = convert_to_float(crowd_prediction);
                let np_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * new_prediction as u32,
                );

                let new_cp_f = (self.poll.accumulated_weights * cp_f
                    + ((1.0 - new_uncertainty) * np_f - (1.0 - old_uncertainty) * op_f)
                        * self.user_prediction.weight)
                    / (self.poll.accumulated_weights
                        + (old_uncertainty - new_uncertainty) * self.user_prediction.weight);

                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);
                self.poll.accumulated_weights +=
                    (old_uncertainty - new_uncertainty) * self.user_prediction.weight;

                // Update score list
                let current_slot = Clock::get().unwrap().slot;
                let last_scoring_list_slot = self.scoring_list.last_slot;

                for num in self
                    .scoring_list
                    .options
                    .iter_mut()
                    .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
                {
                    *num -= (current_slot - last_scoring_list_slot) as i64;
                }

                for cost in self
                    .scoring_list
                    .cost
                    .iter_mut()
                    .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
                {
                    *cost -= (current_slot - last_scoring_list_slot) as f32 * cp_f / 100.0;
                }

                for num in self
                    .scoring_list
                    .options
                    .iter_mut()
                    .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
                {
                    *num += (current_slot - last_scoring_list_slot) as i64;
                }

                for cost in self
                    .scoring_list
                    .cost
                    .iter_mut()
                    .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
                {
                    *cost += (current_slot - last_scoring_list_slot) as f32 * cp_f / 100.0;
                }

                self.scoring_list.last_slot = current_slot;

                // Update user score
                let last_user_score_slot = self.user_score.last_slot;
                self.user_score.ln_a += (current_slot - last_user_score_slot) as f32
                    * (1.0 - old_uncertainty)
                    * ((op_f / 100.0 + EPSILON).ln() + 2.0f32.ln());

                self.user_score.ln_b += (current_slot - last_user_score_slot) as f32
                    * (1.0 - old_uncertainty)
                    * ((1.0 - op_f / 100.0 + EPSILON).ln() + 2.0f32.ln());

                let add_option = (self.scoring_list.options
                    [self.user_prediction.upper_prediction as usize]
                    - self.user_score.last_upper_option
                    + self.scoring_list.options[self.user_prediction.lower_prediction as usize]
                    - self.user_score.last_lower_option)
                    / 2;

                let add_cost = (self.scoring_list.cost
                    [self.user_prediction.upper_prediction as usize]
                    - self.user_score.last_upper_cost
                    + self.scoring_list.cost[self.user_prediction.lower_prediction as usize]
                    - self.user_score.last_lower_cost)
                    / 2.0;

                self.user_score.last_lower_option =
                    self.scoring_list.options[self.user_prediction.lower_prediction as usize];
                self.user_score.last_upper_option =
                    self.scoring_list.options[self.user_prediction.upper_prediction as usize];
                self.user_score.last_lower_cost =
                    self.scoring_list.cost[self.user_prediction.lower_prediction as usize];
                self.user_score.last_upper_cost =
                    self.scoring_list.cost[self.user_prediction.upper_prediction as usize];

                self.user_score.options += add_option;
                self.user_score.cost += add_cost;
                self.user_score.last_slot = current_slot;

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

    pub fn update_user_prediction(
        &mut self,
        lower_prediction: u16,
        upper_prediction: u16,
    ) -> Result<()> {
        assert!(lower_prediction <= 100);
        assert!(upper_prediction <= 100);
        assert!(lower_prediction <= upper_prediction);
        if !self.poll.open {
            return err!(CustomErrorCode::PollClosed);
        }
        self.user_prediction.lower_prediction = lower_prediction;
        self.user_prediction.upper_prediction = upper_prediction;
        msg!("Updated user prediction");
        Ok(())
    }
}
