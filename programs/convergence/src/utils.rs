use std::ops::{Div, Mul};

pub const PREDICTION_PRECISION: usize = 4;

pub fn convert_to_float(value: u32) -> f32 {
    (value as f32).div(f32::powf(10.0, PREDICTION_PRECISION as f32))
}

pub fn convert_from_float(value: f32) -> u32 {
    value.mul(f32::powf(10.0, PREDICTION_PRECISION as f32)) as u32
}
