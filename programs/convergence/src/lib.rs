use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod states;

use contexts::*;

declare_id!("4irSQbid9JUAkhUf5yhnx5o3EgaY3saAErK9oQtPURHo");

#[program]
pub mod convergence {
    use super::*;

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        question: String,
        description: String,
        start_time: u64,
        end_time: Option<u64>,
    ) -> Result<()> {
        ctx.accounts
            .create_poll(&ctx.bumps, question, description, start_time, end_time)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
