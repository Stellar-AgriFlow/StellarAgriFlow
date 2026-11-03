#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReceiptError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ReceiptNotFound = 4,
    ReceiptAlreadyPledged = 5,
    ReceiptNotPledged = 6,
    ReceiptAlreadyRedeemed = 7,
    InvalidMetrics = 8,
    ContractPaused = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WarehouseReceipt {
    pub receipt_id: u32,
    pub owner: Address,
    pub warehouse_id: Symbol,
    pub commodity: Symbol,
    pub quantity_kg: u64,
    pub grade: Symbol,          // e.g. "Grade1", "Grade2"
    pub moisture_percent_e2: u32, // e.g. 1350 for 13.50%
    pub harvest_year: u32,
    pub is_pledged: bool,
    pub pledgee: Option<Address>,
    pub is_redeemed: bool,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Custodians,
    ReceiptCount,
    Receipt(u32),
    Paused,
}

#[contract]
pub struct WarehouseReceiptContract;

#[contractimpl]
impl WarehouseReceiptContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReceiptError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReceiptError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        let empty_custodians: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Custodians, &empty_custodians);
        env.storage().instance().set(&DataKey::ReceiptCount, &0u32);
        env.storage().instance().set(&DataKey::Paused, &false);

        env.storage().instance().extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((symbol_short!("r_init"),), admin);
        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, ReceiptError> {
        env.storage().instance().get(&DataKey::Admin).ok_or(ReceiptError::NotInitialized)
    }

    pub fn get_receipt_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ReceiptCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
