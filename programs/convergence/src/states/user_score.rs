use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserScore {
    pub options: i64,
    pub cost: f32,
    pub ln_a: f32,
    pub ln_b: f32,
    pub bump: u8,
}

impl UserScore {
    pub const SEED_PREFIX: &'static str = "user_score";

    pub const LEN: usize = 8 + I64_L + 3 * F32_L + U8_L;

    pub fn new(bump: u8) -> Self {
        Self {
            options: 0,
            cost: 0.0,
            ln_a: 0.0,
            ln_b: 0.0,
            bump,
        }
    }
}
