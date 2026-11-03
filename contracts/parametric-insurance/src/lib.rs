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

    /// Deposit underwriting liquidity into the insurance pool and receive LP shares
    pub fn deposit_liquidity(
        env: Env,
        provider: Address,
        amount: i128,
    ) -> Result<i128, InsuranceError> {
        provider.require_auth();
        if amount <= 0 {
            return Err(InsuranceError::InvalidAmount);
        }

        let total_liq: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);

        let shares_to_mint = if total_shares == 0 || total_liq == 0 {
            amount
        } else {
            (amount * total_shares) / total_liq
        };

        let current_user_shares: i128 = env.storage().persistent().get(&DataKey::Shares(provider.clone())).unwrap_or(0);
        let new_user_shares = current_user_shares + shares_to_mint;
        let new_total_shares = total_shares + shares_to_mint;
        let new_total_liq = total_liq + amount;

        env.storage().persistent().set(&DataKey::Shares(provider.clone()), &new_user_shares);
        env.storage().instance().set(&DataKey::TotalShares, &new_total_shares);
        env.storage().instance().set(&DataKey::TotalLiquidity, &new_total_liq);

        env.storage().instance().extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&DataKey::Shares(provider.clone()), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (symbol_short!("lp_dep"), provider),
            (amount, shares_to_mint),
        );

        Ok(shares_to_mint)
    }

    /// Withdraw proportional liquidity from the underwriting pool by burning LP shares
    pub fn withdraw_liquidity(
        env: Env,
        provider: Address,
        shares_to_burn: i128,
    ) -> Result<i128, InsuranceError> {
        provider.require_auth();
        if shares_to_burn <= 0 {
            return Err(InsuranceError::InvalidAmount);
        }

        let current_user_shares: i128 = env.storage().persistent().get(&DataKey::Shares(provider.clone())).unwrap_or(0);
        if current_user_shares < shares_to_burn {
            return Err(InsuranceError::Unauthorized);
        }

        let total_liq: i128 = env.storage().instance().get(&DataKey::TotalLiquidity).unwrap_or(0);
        let total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);

        if total_shares == 0 {
            return Err(InsuranceError::InsufficientPoolLiquidity);
        }

        let payout_amount = (shares_to_burn * total_liq) / total_shares;
        if payout_amount > total_liq {
            return Err(InsuranceError::InsufficientPoolLiquidity);
        }

        let new_user_shares = current_user_shares - shares_to_burn;
        let new_total_shares = total_shares - shares_to_burn;
        let new_total_liq = total_liq - payout_amount;

        env.storage().persistent().set(&DataKey::Shares(provider.clone()), &new_user_shares);
        env.storage().instance().set(&DataKey::TotalShares, &new_total_shares);
        env.storage().instance().set(&DataKey::TotalLiquidity, &new_total_liq);

        env.storage().instance().extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&DataKey::Shares(provider.clone()), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (symbol_short!("lp_wdr"), provider),
            (payout_amount, shares_to_burn),
        );

        Ok(payout_amount)
    }

    pub fn get_user_shares(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Shares(user)).unwrap_or(0)
    }

    pub fn get_total_shares(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
