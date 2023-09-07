use crate::states::*;
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
    pub predictions: Account<'info, UserPrediction>,
    pub system_program: Program<'info, System>,
}
