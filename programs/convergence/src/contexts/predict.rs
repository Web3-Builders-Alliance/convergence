use std::collections::BTreeMap;

use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), poll.question.as_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      init,
      payer = forecaster,
      seeds=[],
      space = 10,
      bump,
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    pub system_program: Program<'info, System>,
}

impl<'info> Predict<'info> {
    pub fn init_prediction_account(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        prediction: u16,
    ) -> Result<()> {
        self.user_prediction.set_inner(UserPrediction::new(
            prediction,
            *bumps
                .get("user_prediction")
                .expect("Failed to fetch bump for 'user_prediction'"),
        ));
        msg!("Created user_prediction");
        Ok(())
    }

    pub fn update_crowd_prediction(&mut self, prediction: u16) -> Result<()> {
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                assert!(self.poll.num_predictions > 0);
                let cp_f = convert_to_float(crow_prediction);
                let p_f = convert_to_float(prediction as u32);
                let new_cp_f = cp_f + (p_f - cp_f) / self.poll.num_predictions as f32;
                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);
            }
            None => {
                assert!(self.poll.num_predictions == 0);
                self.poll.crowd_prediction = Some(prediction as u32);
                self.poll.num_predictions = 1;
            }
        }
        Ok(())
    }
}
