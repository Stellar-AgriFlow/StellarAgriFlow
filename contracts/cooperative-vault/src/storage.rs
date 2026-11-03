use soroban_sdk::{Address, Env, Vec};
use crate::types::{BulkProcurementProposal, CoopError, CoopMember, DataKey};

pub fn get_admin(env: &Env) -> Result<Address, CoopError> {
    env.storage().instance().get(&DataKey::Admin).ok_or(CoopError::NotInitialized)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn is_paused(env: &Env) -> bool {
    env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
}

pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&DataKey::Paused, &paused);
}

pub fn get_quorum_percent(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::QuorumPercent).unwrap_or(51)
}

pub fn set_quorum_percent(env: &Env, percent: u32) {
    env.storage().instance().set(&DataKey::QuorumPercent, &percent);
}

pub fn get_total_shares(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
}

pub fn add_shares(env: &Env, shares: u64) {
    let current = get_total_shares(env);
    env.storage().instance().set(&DataKey::TotalShares, &(current + shares));
}

pub fn get_treasury(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::TotalTreasury).unwrap_or(0)
}

pub fn add_treasury(env: &Env, amount: i128) {
    let current = get_treasury(env);
    env.storage().instance().set(&DataKey::TotalTreasury, &(current + amount));
}

pub fn deduct_treasury(env: &Env, amount: i128) {
    let current = get_treasury(env);
    env.storage().instance().set(&DataKey::TotalTreasury, &current.saturating_sub(amount));
}

pub fn get_member(env: &Env, member: &Address) -> Result<CoopMember, CoopError> {
    env.storage().instance().get(&DataKey::Member(member.clone())).ok_or(CoopError::MemberNotFound)
}

pub fn set_member(env: &Env, member: &Address, data: &CoopMember) {
    env.storage().instance().set(&DataKey::Member(member.clone()), data);
}

pub fn has_member(env: &Env, member: &Address) -> bool {
    env.storage().instance().has(&DataKey::Member(member.clone()))
}

pub fn add_member_to_list(env: &Env, member: &Address) {
    let mut members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap_or(Vec::new(env));
    members.push_back(member.clone());
    env.storage().instance().set(&DataKey::Members, &members);
}

pub fn get_next_proposal_id(env: &Env) -> u64 {
    let current: u64 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::ProposalCount, &next);
    next
}

pub fn get_proposal(env: &Env, id: u64) -> Result<BulkProcurementProposal, CoopError> {
    env.storage().instance().get(&DataKey::Proposal(id)).ok_or(CoopError::ProposalNotFound)
}

pub fn set_proposal(env: &Env, id: u64, proposal: &BulkProcurementProposal) {
    env.storage().instance().set(&DataKey::Proposal(id), proposal);
}

pub fn has_voted(env: &Env, id: u64, voter: &Address) -> bool {
    env.storage().instance().get(&DataKey::ProposalVoted(id, voter.clone())).unwrap_or(false)
}

pub fn record_vote(env: &Env, id: u64, voter: &Address) {
    env.storage().instance().set(&DataKey::ProposalVoted(id, voter.clone()), &true);
}
