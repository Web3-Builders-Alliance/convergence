use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserPrediction {
    pub prediction: u16,
    pub bump: u8,
}

impl UserPrediction {
    pub const SEED_PREFIX: &'static str = "user_prediction";

    pub const LEN: usize = 8 + U16_L + U8_L;

    pub fn new(prediction: u16, bump: u8) -> Self {
        Self { prediction, bump }
    }
}
