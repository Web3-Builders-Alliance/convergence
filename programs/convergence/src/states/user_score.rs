use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserScore {
    pub options: i64,
    pub last_lower_option: i64,
    pub last_upper_option: i64,
    pub cost: f32,
    pub last_lower_cost: f32,
    pub last_upper_cost: f32,
    pub ln_a: f32,
    pub ln_b: f32,
    pub last_slot: u64,
    pub bump: u8,
}

impl UserScore {
    pub const SEED_PREFIX: &'static str = "user_score";

    pub const LEN: usize = 8 + 3 * I64_L + 5 * F32_L + U64_L + U8_L;

    pub fn new(
        last_lower_option: i64,
        last_upper_option: i64,
        last_lower_cost: f32,
        last_upper_cost: f32,
        bump: u8,
    ) -> Self {
        Self {
            options: 0,
            last_lower_option,
            last_upper_option,
            cost: 0.0,
            last_lower_cost,
            last_upper_cost,
            ln_a: 0.0,
            ln_b: 0.0,
            last_slot: Clock::get().unwrap().slot,
            bump,
        }
    }
}
