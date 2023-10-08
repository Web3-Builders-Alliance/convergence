use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct ScoringList {
    pub option_a: Vec<u64>,
    pub option_b: Vec<u64>,
    pub cost: f32,
    pub last_slot: u64,
    pub bump: u8,
}

impl ScoringList {
    pub const SEED_PREFIX: &'static str = "scoring_list";

    pub const LEN: usize = 8 + 4 + 1001 * U64_L + 4 + 1001 * U64_L + F32_L + U64_L + U8_L;

    pub fn new(bump: u8) -> Self {
        Self {
            option_a: vec![0; 1001],
            option_b: vec![],
            cost: 0.0,
            last_slot: 0,
            bump,
        }
    }

    pub fn initialize_scoring_list(&mut self, last_slot: u64) {
        self.option_b = vec![0; 1001];
        self.last_slot = last_slot;
    }
}
