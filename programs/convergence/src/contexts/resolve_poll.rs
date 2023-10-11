use anchor_lang::prelude::*;

use crate::{errors::*, states::*, utils::convert_to_float};

#[derive(Accounts)]
pub struct ResolvePoll<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(
        mut,
        has_one = resolver,
        seeds=[Poll::SEED_PREFIX.as_bytes(), &anchor_lang::solana_program::hash::hash(poll.question.as_bytes()).to_bytes()],
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
    pub fn resolve_poll(&mut self, result: bool) -> Result<()> {
        if !self.poll.open {
            return err!(CustomErrorCode::PollClosed);
        }
        let current_slot = Clock::get().unwrap().slot;
        let last_scoring_list_slot = self.scoring_list.last_slot;

        if let Some(crowd_prediction) = self.poll.crowd_prediction {
            let cp_f = convert_to_float(crowd_prediction);

            // Update score list

            for num in self
                .scoring_list
                .options
                .iter_mut()
                .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
            {
                *num -= (current_slot - last_scoring_list_slot) as i64;
            }

            for cost in self
                .scoring_list
                .cost
                .iter_mut()
                .take(((cp_f * 100.0).round() / 100.0).ceil() as usize)
            {
                *cost -= (current_slot - last_scoring_list_slot) as f32 * cp_f / 100.0;
            }

            for num in self
                .scoring_list
                .options
                .iter_mut()
                .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
            {
                *num += (current_slot - last_scoring_list_slot) as i64;
            }

            for cost in self
                .scoring_list
                .cost
                .iter_mut()
                .skip(1 + ((cp_f * 100.0).round() / 100.0).floor() as usize)
            {
                *cost += (current_slot - last_scoring_list_slot) as f32 * cp_f / 100.0;
            }

            self.scoring_list.last_slot = current_slot;
        }

        self.poll.open = false;
        self.poll.result = Some(result);
        self.poll.end_slot = current_slot;
        msg!("Resolved poll");
        Ok(())
    }
}
