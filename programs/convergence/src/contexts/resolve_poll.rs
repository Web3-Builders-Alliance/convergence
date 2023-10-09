use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
#[instruction(question: String, description: String)]
pub struct ResolvePoll<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(
        mut,
        has_one = resolver,
        seeds=[Poll::SEED_PREFIX.as_bytes(), question.as_bytes()],
        bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    pub system_program: Program<'info, System>,
}

impl<'info> ResolvePoll<'info> {
    pub fn create_poll(&mut self, result: bool) -> Result<()> {
        self.poll.open = false;
        self.poll.result = Some(result);
        self.poll.end_slot = Clock::get().unwrap().slot;
        // TODO: Need to update scoring list
        msg!("Resolved poll");
        Ok(())
    }
}
