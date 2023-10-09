use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
pub struct StartPoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one=creator,
        seeds=[Poll::SEED_PREFIX.as_bytes(), poll.question.as_bytes()],
        bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        realloc = ScoringList::LEN,
        realloc::zero = true,
        realloc::payer = creator,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartPoll<'info> {
    pub fn start_poll(&mut self) -> Result<()> {
        assert!(self.poll.start_slot == 0);
        let current_slot = Clock::get().unwrap().slot;
        self.poll.start_slot = current_slot;
        self.poll.open = true;
        self.scoring_list.initialize_scoring_list(current_slot);
        msg!("Started poll");
        Ok(())
    }
}
