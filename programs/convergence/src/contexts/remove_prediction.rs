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
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
      bump = user_prediction.bump,
      close = forecaster
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    pub system_program: Program<'info, System>,
}

impl<'info> RemovePrediction<'info> {
    pub fn remove_prediction(&mut self) -> Result<()> {
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                let n = self.poll.num_predictions as f32;
                assert!(n > 0.0);
                let old_prediction = self.user_prediction.prediction;
                let op_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                );
                let cp_f = convert_to_float(crow_prediction);

                let new_cp_f = (n * cp_f - op_f) / (n - 1.0);
                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);
                self.poll.num_predictions -= 1;

                msg!("Updated crowd prediction");
            }
            None => {
                assert!(false);
            }
        }
        Ok(())
    }
}
