use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("Poll is closed.")]
    PollClosed,
}
