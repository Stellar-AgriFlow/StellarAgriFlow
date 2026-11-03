#![no_std]

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol,
};
pub use types::{BulkProcurementProposal, CoopError, CoopMember, DataKey, ProposalStatus};

#[contract]
pub struct CooperativeVaultContract;

#[contractimpl]
impl CooperativeVaultContract {
    pub fn initialize(env: Env, admin: Address, quorum_percent: u32) -> Result<(), CoopError> {
        if storage::get_admin(&env).is_ok() {
            return Err(CoopError::AlreadyInitialized);
        }
        admin.require_auth();

        storage::set_admin(&env, &admin);
        storage::set_paused(&env, false);
        storage::set_quorum_percent(&env, quorum_percent);

        Ok(())
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), CoopError> {
        let stored_admin = storage::get_admin(&env)?;
        if admin != stored_admin {
            return Err(CoopError::Unauthorized);
        }
        admin.require_auth();

        storage::set_paused(&env, paused);
        Ok(())
    }

    pub fn register_member(
        env: Env,
        admin: Address,
        member: Address,
        initial_shares: u64,
    ) -> Result<(), CoopError> {
        let stored_admin = storage::get_admin(&env)?;
        if admin != stored_admin {
            return Err(CoopError::Unauthorized);
        }
        admin.require_auth();

        if storage::has_member(&env, &member) {
            return Err(CoopError::MemberAlreadyExists);
        }

        let new_member = CoopMember {
            shares: initial_shares,
            staked_amount: 0,
            joined_timestamp: env.ledger().timestamp(),
        };

        storage::set_member(&env, &member, &new_member);
        storage::add_shares(&env, initial_shares);
        storage::add_member_to_list(&env, &member);

        env.events().publish((symbol_short!("coop"), symbol_short!("mbr_add")), member);

        Ok(())
    }

    pub fn deposit_savings(env: Env, member: Address, amount: i128) -> Result<(), CoopError> {
        member.require_auth();

        if storage::is_paused(&env) {
            return Err(CoopError::ContractPaused);
        }

        if amount <= 0 {
            return Err(CoopError::InvalidAmount);
        }

        let mut member_data = storage::get_member(&env, &member)?;
        member_data.staked_amount += amount;
        storage::set_member(&env, &member, &member_data);
        storage::add_treasury(&env, amount);

        env.events().publish((symbol_short!("coop"), symbol_short!("deposit")), (member, amount));

        Ok(())
    }

    pub fn withdraw_savings(env: Env, member: Address, amount: i128) -> Result<(), CoopError> {
        member.require_auth();

        if amount <= 0 {
            return Err(CoopError::InvalidAmount);
        }

        let mut member_data = storage::get_member(&env, &member)?;
        if member_data.staked_amount < amount {
            return Err(CoopError::InsufficientBalance);
        }

        member_data.staked_amount -= amount;
        storage::set_member(&env, &member, &member_data);
        storage::deduct_treasury(&env, amount);

        env.events().publish((symbol_short!("coop"), symbol_short!("withdraw")), (member, amount));

        Ok(())
    }

    pub fn submit_proposal(
        env: Env,
        proposer: Address,
        title: Symbol,
        recipient: Address,
        amount: i128,
    ) -> Result<u64, CoopError> {
        proposer.require_auth();

        if storage::is_paused(&env) {
            return Err(CoopError::ContractPaused);
        }

        if !storage::has_member(&env, &proposer) {
            return Err(CoopError::Unauthorized);
        }

        let treasury = storage::get_treasury(&env);
        if amount <= 0 || amount > treasury {
            return Err(CoopError::InvalidAmount);
        }

        let total_shares = storage::get_total_shares(&env);
        let quorum_pct = storage::get_quorum_percent(&env);
        let quorum_required = ((total_shares as u128 * quorum_pct as u128) / 100) as u64;

        let next_id = storage::get_next_proposal_id(&env);

        let proposal = BulkProcurementProposal {
            id: next_id,
            proposer,
            title,
            recipient,
            amount,
            votes_for: 0,
            quorum_required,
            status: ProposalStatus::Pending,
        };

        storage::set_proposal(&env, next_id, &proposal);

        env.events().publish((symbol_short!("coop"), symbol_short!("prop_new")), next_id);

        Ok(next_id)
    }

    pub fn vote_proposal(env: Env, member: Address, proposal_id: u64) -> Result<(), CoopError> {
        member.require_auth();

        let member_data = storage::get_member(&env, &member)?;

        if storage::has_voted(&env, proposal_id, &member) {
            return Err(CoopError::AlreadyVoted);
        }

        let mut proposal = storage::get_proposal(&env, proposal_id)?;
        if proposal.status != ProposalStatus::Pending {
            return Err(CoopError::ProposalNotPending);
        }

        proposal.votes_for += member_data.shares;
        if proposal.votes_for >= proposal.quorum_required {
            proposal.status = ProposalStatus::Approved;
        }

        storage::set_proposal(&env, proposal_id, &proposal);
        storage::record_vote(&env, proposal_id, &member);

        env.events().publish((symbol_short!("coop"), symbol_short!("voted")), (proposal_id, proposal.votes_for));

        Ok(())
    }

    pub fn execute_proposal(env: Env, admin: Address, proposal_id: u64) -> Result<(), CoopError> {
        let stored_admin = storage::get_admin(&env)?;
        if admin != stored_admin {
            return Err(CoopError::Unauthorized);
        }
        admin.require_auth();

        let mut proposal = storage::get_proposal(&env, proposal_id)?;
        if proposal.status != ProposalStatus::Approved {
            return Err(CoopError::QuorumNotMet);
        }

        storage::deduct_treasury(&env, proposal.amount);

        proposal.status = ProposalStatus::Executed;
        storage::set_proposal(&env, proposal_id, &proposal);

        env.events().publish((symbol_short!("coop"), symbol_short!("executed")), proposal_id);

        Ok(())
    }

    pub fn get_treasury(env: Env) -> i128 {
        storage::get_treasury(&env)
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Result<BulkProcurementProposal, CoopError> {
        storage::get_proposal(&env, proposal_id)
    }
}
