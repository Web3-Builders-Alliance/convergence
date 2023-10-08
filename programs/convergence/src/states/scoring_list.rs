use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct ScoringList {
    pub option: Vec<i64>,
    pub cost: Vec<f32>,
    pub last_slot: u64,
    pub bump: u8,
}

impl ScoringList {
    pub const SEED_PREFIX: &'static str = "scoring_list";

    pub const LEN: usize = 8 + 4 + 1001 * I64_L + 4 + 1001 * F32_L + U64_L + U8_L;

    pub fn new(bump: u8) -> Self {
        Self {
            option: vec![0; 1001],
            cost: vec![],
            last_slot: 0,
            bump,
        }
    }

    pub fn initialize_scoring_list(&mut self, last_slot: u64) {
        self.last_slot = last_slot;
        self.cost = vec![0.0; 1001];
    }
}
