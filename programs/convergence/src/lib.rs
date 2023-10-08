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

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.register_user(&ctx.bumps)
    }

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        question: String,
        description: String,
        end_time: Option<u64>,
    ) -> Result<()> {
        ctx.accounts
            .create_poll(&ctx.bumps, question, description, end_time)
    }

    pub fn start_poll(ctx: Context<StartPoll>) -> Result<()> {
        ctx.accounts.start_poll()
    }

    pub fn make_prediction(
        ctx: Context<MakePrediction>,
        lower_prediction: u16,
        upper_prediction: u16,
    ) -> Result<()> {
        let prediction = (lower_prediction + upper_prediction) / 2;
        let uncertainty = (upper_prediction - lower_prediction) as f32 / 100.0;
        ctx.accounts.init_prediction_account(
            &ctx.bumps,
            lower_prediction,
            upper_prediction,
            ctx.accounts.user.score,
        )?;
        ctx.accounts
            .update_crowd_prediction(&ctx.bumps, prediction, uncertainty)
    }

    pub fn update_prediction(
        ctx: Context<UpdatePrediction>,
        new_lower_prediction: u16,
        new_upper_prediction: u16,
    ) -> Result<()> {
        let new_prediction = (new_lower_prediction + new_upper_prediction) / 2;
        let new_uncertainty = (new_upper_prediction - new_lower_prediction) as f32 / 100.0;
        ctx.accounts
            .update_crowd_prediction(&ctx.bumps, new_prediction, new_uncertainty)?;
        ctx.accounts
            .update_user_prediction(new_lower_prediction, new_upper_prediction)
    }

    pub fn remove_prediction(ctx: Context<RemovePrediction>) -> Result<()> {
        ctx.accounts.remove_prediction(&ctx.bumps)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
