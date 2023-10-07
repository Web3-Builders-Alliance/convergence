use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserPrediction {
    pub lower_prediction: u16,
    pub upper_prediction: u16,
    pub weight: f32,
    pub bump: u8,
}

impl UserPrediction {
    pub const SEED_PREFIX: &'static str = "user_prediction";

    pub const LEN: usize = 8 + U16_L + U16_L + F32_L + U8_L;

    pub fn new(lower_prediction: u16, upper_prediction: u16, weight: f32, bump: u8) -> Self {
        Self {
            lower_prediction,
            upper_prediction,
            weight,
            bump,
        }
    }

    pub fn get_prediction(&self) -> u16 {
        (self.lower_prediction + self.upper_prediction) / 2
    }
}
