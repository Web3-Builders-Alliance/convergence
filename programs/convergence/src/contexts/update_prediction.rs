use std::collections::BTreeMap;

use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdatePrediction<'info> {
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

impl<'info> UpdatePrediction<'info> {
    pub fn update_crowd_prediction(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        new_prediction: u16,
        new_uncertainty: f32,
    ) -> Result<()> {
        assert!(new_prediction <= 1000);
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_prediction_updates > 0);
                assert!(self.poll.accumulated_weights > 0.0);
                self.poll.num_prediction_updates += 1;

                let old_prediction = self.user_prediction.get_prediction();
                let old_uncertainty = (self.user_prediction.upper_prediction
                    - self.user_prediction.lower_prediction)
                    as f32
                    / 1000.0;
                let op_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                );
                let cp_f = convert_to_float(crow_prediction);
                let np_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * new_prediction as u32,
                );

                let new_cp_f = (self.poll.accumulated_weights * cp_f
                    + ((1.0 - new_uncertainty) * np_f - (1.0 - old_uncertainty) * op_f)
                        * self.user_prediction.weight)
                    / (self.poll.accumulated_weights
                        + (old_uncertainty - new_uncertainty) * self.user_prediction.weight);

                // let new_cp_f = cp_f
                //     + self.user_prediction.weight * (np_f - op_f) / self.poll.accumulated_weights;
                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);
                self.poll.accumulated_weights +=
                    (old_uncertainty - new_uncertainty) * self.user_prediction.weight;

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
        assert!(lower_prediction <= 1000);
        assert!(upper_prediction <= 1000);
        assert!(lower_prediction <= upper_prediction);
        self.user_prediction.lower_prediction = lower_prediction;
        self.user_prediction.upper_prediction = upper_prediction;
        msg!("Updated user prediction");
        Ok(())
    }
}
