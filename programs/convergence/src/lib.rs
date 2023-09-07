use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod states;
mod utils;

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

    pub fn predict(ctx: Context<Predict>, prediction: u16) -> Result<()> {
        ctx.accounts
            .init_prediction_account(&ctx.bumps, prediction)?;
        ctx.accounts.update_crowd_prediction(prediction)
    }

    pub fn update_prediction(ctx: Context<UpdatePrediction>, new_prediction: u16) -> Result<()> {
        ctx.accounts.update_crowd_prediction(new_prediction)?;
        ctx.accounts.update_user_prediction(new_prediction)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
