use std::collections::BTreeMap;

use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
#[instruction(question: String, description: String)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        seeds=[Poll::SEED_PREFIX.as_bytes(), question.as_bytes()],
        space=Poll::len(&question, &description),
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreatePoll<'info> {
    pub fn create_poll(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        question: String,
        description: String,
        start_time: u64,
        end_time: Option<u64>,
    ) -> Result<()> {
        self.poll.set_inner(Poll::new(
            *self.creator.key,
            question,
            description,
            start_time,
            end_time,
            *bumps.get("poll").expect("Failed to fetch bump for 'poll'"),
        ));
        msg!("Created poll");
        Ok(())
    }
}
