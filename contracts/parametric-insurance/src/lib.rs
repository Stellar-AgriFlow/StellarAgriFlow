#![no_std]

#[allow(unused_imports)]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Env, IntoVal,
    Symbol,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum InsuranceError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InsufficientPoolLiquidity = 4,
    PolicyNotFound = 5,
    PolicyAlreadyPaid = 6,
    PolicyExpired = 7,
    TriggerConditionNotMet = 8,
    ContractPaused = 9,
    InvalidAmount = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InsurancePolicy {
    pub policy_id: u32,
    pub farmer: Address,
    pub region: Symbol,
    pub trigger_drought_index: u32, // e.g. 75
    pub payout_amount: i128,
    pub premium_paid: i128,
    pub is_paid: bool,
    pub is_expired: bool,
    pub duration_days: u32,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    WeatherOracleContract,
    TotalLiquidity,
    TotalShares,
    Shares(Address),
    PolicyCount,
    Policy(u32),
    Paused,
}

#[contract]
pub struct ParametricInsuranceContract;

#[contractimpl]
impl ParametricInsuranceContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        weather_oracle_contract: Address,
    ) -> Result<(), InsuranceError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(InsuranceError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::WeatherOracleContract, &weather_oracle_contract);
        env.storage().instance().set(&DataKey::TotalLiquidity, &0i128);
        env.storage().instance().set(&DataKey::TotalShares, &0i128);
        env.storage().instance().set(&DataKey::PolicyCount, &0u32);
        env.storage().instance().set(&DataKey::Paused, &false);

        env.storage().instance().extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((symbol_short!("ins_init"),), admin);
        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, InsuranceError> {
        env.storage().instance().get(&DataKey::Admin).ok_or(InsuranceError::NotInitialized)
    }

    pub fn get_total_liquidity(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalLiquidity).unwrap_or(0)
    }

    pub fn get_policy_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PolicyCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
