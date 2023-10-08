use std::collections::BTreeMap;

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
    pub system_program: Program<'info, System>,
}

impl<'info> RemovePrediction<'info> {
    pub fn remove_prediction(&mut self, bumps: &BTreeMap<String, u8>) -> Result<()> {
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_prediction_updates > 0);
                self.poll.num_prediction_updates += 1;

                if self.poll.num_forecasters == 1 {
                    self.poll.crowd_prediction = None;
                } else {
                    let n = self.poll.num_forecasters as f32;
                    assert!(n > 0.0);
                    let old_prediction = self.user_prediction.get_prediction();
                    let op_f = convert_to_float(
                        10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                    );
                    let cp_f = convert_to_float(crow_prediction);

                    let new_cp_f = (self.poll.accumulated_weights * cp_f
                        - self.user_prediction.weight * op_f)
                        / (self.poll.accumulated_weights - self.user_prediction.weight);
                    let new_crowd_prediction = convert_from_float(new_cp_f);
                    self.poll.crowd_prediction = Some(new_crowd_prediction);
                }

                self.poll.num_forecasters -= 1;
                self.poll.accumulated_weights -= self.user_prediction.weight;
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
