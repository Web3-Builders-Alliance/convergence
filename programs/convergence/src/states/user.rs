use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct User {
    pub score: f32,
    pub bump: u8,
}

impl User {
    pub const SEED_PREFIX: &'static str = "user";

    pub const LEN: usize = 8 + U16_L + U8_L;

    pub fn new(bump: u8) -> Self {
        Self { score: 100.0, bump }
    }
}
