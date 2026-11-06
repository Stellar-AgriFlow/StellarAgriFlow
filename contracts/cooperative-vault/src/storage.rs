use crate::types::{BulkProcurementProposal, CoopError, CoopMember, DataKey};
use soroban_sdk::{Address, Env, Vec};

pub const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
pub const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

pub fn get_admin(env: &Env) -> Result<Address, CoopError> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(CoopError::NotInitialized)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&DataKey::Paused, &paused);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_token(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Token)
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_quorum_percent(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::QuorumPercent)
        .unwrap_or(51)
}

pub fn set_quorum_percent(env: &Env, percent: u32) {
    env.storage()
        .instance()
        .set(&DataKey::QuorumPercent, &percent);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_total_shares(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::TotalShares)
        .unwrap_or(0)
}

pub fn add_shares(env: &Env, shares: u64) {
    let current = get_total_shares(env);
    env.storage()
        .instance()
        .set(&DataKey::TotalShares, &(current + shares));
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_treasury(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalTreasury)
        .unwrap_or(0)
}

pub fn add_treasury(env: &Env, amount: i128) {
    let current = get_treasury(env);
    env.storage()
        .instance()
        .set(&DataKey::TotalTreasury, &(current + amount));
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn deduct_treasury(env: &Env, amount: i128) {
    let current = get_treasury(env);
    env.storage()
        .instance()
        .set(&DataKey::TotalTreasury, &current.saturating_sub(amount));
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_member(env: &Env, member: &Address) -> Result<CoopMember, CoopError> {
    env.storage()
        .persistent()
        .get(&DataKey::Member(member.clone()))
        .ok_or(CoopError::MemberNotFound)
}

pub fn set_member(env: &Env, member: &Address, data: &CoopMember) {
    env.storage()
        .persistent()
        .set(&DataKey::Member(member.clone()), data);
    env.storage().persistent().extend_ttl(
        &DataKey::Member(member.clone()),
        INSTANCE_LIFETIME_THRESHOLD,
        INSTANCE_BUMP_AMOUNT,
    );
}

pub fn has_member(env: &Env, member: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Member(member.clone()))
}

pub fn add_member_to_list(env: &Env, member: &Address) {
    let mut members: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Members)
        .unwrap_or(Vec::new(env));
    members.push_back(member.clone());
    env.storage().instance().set(&DataKey::Members, &members);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn get_next_proposal_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::ProposalCount)
        .unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::ProposalCount, &next);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    next
}

pub fn get_proposal(env: &Env, id: u64) -> Result<BulkProcurementProposal, CoopError> {
    env.storage()
        .persistent()
        .get(&DataKey::Proposal(id))
        .ok_or(CoopError::ProposalNotFound)
}

pub fn set_proposal(env: &Env, id: u64, proposal: &BulkProcurementProposal) {
    env.storage()
        .persistent()
        .set(&DataKey::Proposal(id), proposal);
    env.storage().persistent().extend_ttl(
        &DataKey::Proposal(id),
        INSTANCE_LIFETIME_THRESHOLD,
        INSTANCE_BUMP_AMOUNT,
    );
}

pub fn has_voted(env: &Env, id: u64, voter: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::ProposalVoted(id, voter.clone()))
        .unwrap_or(false)
}

pub fn record_vote(env: &Env, id: u64, voter: &Address) {
    env.storage()
        .persistent()
        .set(&DataKey::ProposalVoted(id, voter.clone()), &true);
    env.storage().persistent().extend_ttl(
        &DataKey::ProposalVoted(id, voter.clone()),
        INSTANCE_LIFETIME_THRESHOLD,
        INSTANCE_BUMP_AMOUNT,
    );
}
