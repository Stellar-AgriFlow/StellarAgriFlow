use soroban_sdk::{contracterror, contracttype, Address, Symbol};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CoopError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    ContractPaused = 3,
    Unauthorized = 4,
    MemberAlreadyExists = 5,
    MemberNotFound = 6,
    InsufficientBalance = 7,
    ProposalNotFound = 8,
    ProposalNotPending = 9,
    AlreadyVoted = 10,
    QuorumNotMet = 11,
    InvalidAmount = 12,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalStatus {
    Pending = 1,
    Approved = 2,
    Executed = 3,
    Rejected = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CoopMember {
    pub shares: u64,
    pub staked_amount: i128,
    pub joined_timestamp: u64,
    pub is_token_staked: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BulkProcurementProposal {
    pub id: u64,
    pub proposer: Address,
    pub title: Symbol,
    pub recipient: Address,
    pub amount: i128,
    pub votes_for: u64,
    pub quorum_required: u64,
    pub status: ProposalStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    QuorumPercent,
    TotalShares,
    TotalTreasury,
    Members,
    Member(Address),
    ProposalCount,
    Proposal(u64),
    ProposalVoted(u64, Address),
    Token,
}
