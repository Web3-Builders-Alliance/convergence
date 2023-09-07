use std::ops::{Div, Mul};

pub fn convert_to_float(value: u32) -> f32 {
    (value as f32).div(f32::powf(10.0, 8.0))
}

pub fn convert_from_float(value: f32) -> u32 {
    value.mul(f32::powf(10.0, 8.0)) as u32
}
