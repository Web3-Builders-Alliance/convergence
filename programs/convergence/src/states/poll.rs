use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct Poll {
    pub creator: Pubkey,
    pub question: String,
    pub description: String,
    pub start_slot: u64,
    pub end_time: Option<u64>,
    pub crowd_prediction: Option<u32>,
    pub num_forecasters: u64,
    pub num_prediction_updates: u64,
    pub accumulated_weights: f32,
    pub bump: u8,
}

impl Poll {
    pub const SEED_PREFIX: &'static str = "poll";

    pub fn len(question: &str, description: &str) -> usize {
        8 + PUBKEY_L
            + 2 * STRING_L
            + question.len()
            + description.len()
            + 2 * OPTION_L
            + 4 * U64_L
            + U32_L
            + F32_L
            + U8_L
    }

    pub fn new(
        creator: Pubkey,
        question: String,
        description: String,
        end_time: Option<u64>,
        bump: u8,
    ) -> Self {
        Self {
            creator,
            question,
            description,
            start_slot: 0,
            end_time,
            crowd_prediction: None,
            num_forecasters: 0,
            num_prediction_updates: 0,
            accumulated_weights: 0.0,
            bump,
        }
    }
}
