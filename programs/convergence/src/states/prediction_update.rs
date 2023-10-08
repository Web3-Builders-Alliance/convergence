use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct PredictionUpdate {
    pub prediction: Option<u32>,
    pub slot: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl PredictionUpdate {
    pub const SEED_PREFIX: &'static str = "prediction_update";

    pub const LEN: usize = 8 + OPTION_L + U32_L + U64_L + I64_L + U8_L;

    pub fn new(prediction: Option<u32>, bump: u8) -> Self {
        Self {
            prediction,
            slot: Clock::get().unwrap().slot,
            timestamp: Clock::get().unwrap().unix_timestamp,
            bump,
        }
    }
}
