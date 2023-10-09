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
    #[account(
        init,
        payer = creator,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        space=10240 as usize,
        bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreatePoll<'info> {
    pub fn create_poll(
        &mut self,
        bumps: &BTreeMap<String, u8>,
        question: String,
        description: String,
        end_time: Option<u64>,
    ) -> Result<()> {
        self.poll.set_inner(Poll::new(
            *self.creator.key,
            *self.creator.key,
            question,
            description,
            end_time,
            *bumps.get("poll").expect("Failed to fetch bump for 'poll'"),
        ));
        self.scoring_list.set_inner(ScoringList::new(
            *bumps
                .get("scoring_list")
                .expect("Failed to fetch bump for 'scoring_list'"),
        ));
        msg!("Created poll");
        Ok(())
    }
}
