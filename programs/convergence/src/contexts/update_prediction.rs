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
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
      bump = user_prediction.bump,
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    pub system_program: Program<'info, System>,
}

impl<'info> UpdatePrediction<'info> {
    pub fn update_crowd_prediction(&mut self, new_prediction: u16) -> Result<()> {
        assert!(new_prediction <= 1000);
        match self.poll.crowd_prediction {
            Some(crow_prediction) => {
                assert!(self.poll.num_predictions > 0);
                let old_prediction = self.user_prediction.get_prediction();
                let op_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32,
                );
                let cp_f = convert_to_float(crow_prediction);
                let np_f = convert_to_float(
                    10u32.pow(PREDICTION_PRECISION as u32) * new_prediction as u32,
                );

                let new_cp_f = cp_f + (np_f - op_f) / (self.poll.num_predictions as f32);
                let new_crowd_prediction = convert_from_float(new_cp_f);
                self.poll.crowd_prediction = Some(new_crowd_prediction);

                msg!("Updated crowd prediction");
            }
            None => {
                assert!(false);
            }
        }
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
