use crate::constants::EPSILON;
use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CollectPoints<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
      mut,
      seeds=[User::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
      bump=user.bump,
    )]
    pub user: Account<'info, User>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), &anchor_lang::solana_program::hash::hash(poll.question.as_bytes()).to_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      mut,
      seeds=[UserPrediction::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      bump = user_prediction.bump,
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    #[account(
        mut,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        bump=user_score.bump,
        close = forecaster
      )]
    pub user_score: Account<'info, UserScore>,
    pub system_program: Program<'info, System>,
}

impl<'info> CollectPoints<'info> {
    pub fn collect_points(&mut self) -> Result<()> {
        if self.poll.open {
            return err!(CustomErrorCode::PollNotResolved);
        }

        assert!(self.poll.num_forecasters > 0);
        assert!(self.poll.num_prediction_updates > 0);
        assert!(self.poll.accumulated_weights > 0.0);

        // update crowd prediction
        let old_prediction = self.user_prediction.get_prediction();
        let old_uncertainty = (self.user_prediction.upper_prediction
            - self.user_prediction.lower_prediction) as f32
            / 100.0;
        let op_f = convert_to_float(10u32.pow(PREDICTION_PRECISION as u32) * old_prediction as u32);

        // Update user score
        let last_poll_slot = self.poll.end_slot;
        let last_user_score_slot = self.user_score.last_slot;
        self.user_score.ln_a += (last_poll_slot - last_user_score_slot) as f32
            * (1.0 - old_uncertainty)
            * ((op_f / 100.0 + EPSILON).ln() + 2.0f32.ln());

        self.user_score.ln_b += (last_poll_slot - last_user_score_slot) as f32
            * (1.0 - old_uncertainty)
            * ((1.0 - op_f / 100.0 + EPSILON).ln() + 2.0f32.ln());

        let add_option = (self.scoring_list.options
            [self.user_prediction.upper_prediction as usize]
            - self.user_score.last_upper_option
            + self.scoring_list.options[self.user_prediction.lower_prediction as usize]
            - self.user_score.last_lower_option)
            / 2;

        let add_cost = (self.scoring_list.cost[self.user_prediction.upper_prediction as usize]
            - self.user_score.last_upper_cost
            + self.scoring_list.cost[self.user_prediction.lower_prediction as usize]
            - self.user_score.last_lower_cost)
            / 2.0;

        self.user_score.last_lower_option =
            self.scoring_list.options[self.user_prediction.lower_prediction as usize];
        self.user_score.last_upper_option =
            self.scoring_list.options[self.user_prediction.upper_prediction as usize];
        self.user_score.last_lower_cost =
            self.scoring_list.cost[self.user_prediction.lower_prediction as usize];
        self.user_score.last_upper_cost =
            self.scoring_list.cost[self.user_prediction.upper_prediction as usize];

        self.user_score.options += add_option;
        self.user_score.cost += add_cost;
        self.user_score.last_slot = last_poll_slot;

        msg!("Collected points");

        Ok(())
    }

    pub fn transfer_points_to_user(&mut self) -> Result<()> {
        if let Some(result) = self.poll.result {
            let duration = self.poll.end_slot - self.poll.start_slot;
            if result {
                let score = (self.user_score.options as f32 - self.user_score.cost
                    + self.user_score.ln_a)
                    / duration as f32;
                self.user.score += score;
            } else {
                let score = (self.user_score.ln_b - self.user_score.cost) / duration as f32;
                self.user.score += score;
            }
        }
        Ok(())
    }
}
