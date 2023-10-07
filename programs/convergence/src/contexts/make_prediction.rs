use std::collections::BTreeMap;

use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct MakePrediction<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
        seeds=[User::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
        bump=user.bump,
      )]
    pub user: Account<'info, User>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), poll.question.as_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      init,
      payer = forecaster,
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      space = UserPrediction::LEN,
      bump,
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    pub system_program: Program<'info, System>,
}

impl<'info> MakePrediction<'info> {
    pub fn init_prediction_account(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        lower_prediction: u16,
        upper_prediction: u16,
        weight: f32,
    ) -> Result<()> {
        assert!(lower_prediction <= 1000);
        assert!(upper_prediction <= 1000);
        assert!(lower_prediction <= upper_prediction);
        self.user_prediction.set_inner(UserPrediction::new(
            lower_prediction,
            upper_prediction,
            weight,
            *bumps
                .get("user_prediction")
                .expect("Failed to fetch bump for 'user_prediction'"),
        ));
        msg!("Created user prediction");
        Ok(())
    }

    pub fn update_crowd_prediction(&mut self, prediction: u16) -> Result<()> {
        assert!(prediction <= 1000);
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_prediction_updates > 0);
                self.poll.num_forecasters += 1;
                self.poll.num_prediction_updates += 1;
                self.poll.accumulated_weights += self.user_prediction.weight;

                let cp_f = convert_to_float(crow_prediction);
                let p_f =
                    convert_to_float(10u32.pow(PREDICTION_PRECISION as u32) * prediction as u32);
                let new_cp_f = cp_f
                    + self.user_prediction.weight * (p_f - cp_f) / self.poll.accumulated_weights;
                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);

                msg!("Updated crowd prediction");
            }
            None => {
                assert!(self.poll.num_forecasters == 0);
                assert!(self.poll.accumulated_weights == 0.0);
                self.poll.crowd_prediction =
                    Some(10u32.pow(PREDICTION_PRECISION as u32) * prediction as u32);
                self.poll.num_forecasters = 1;
                self.poll.accumulated_weights = self.user_prediction.weight;
                self.poll.num_prediction_updates += 1;
            }
        }
        Ok(())
    }
}
