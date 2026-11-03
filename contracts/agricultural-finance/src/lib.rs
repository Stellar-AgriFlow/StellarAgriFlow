#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, IntoVal, Symbol,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FinancingRequest {
    pub id: u32,
    pub farm_id: Symbol,
    pub farmer: Address,
    pub requested_amount: i128,
    pub expected_repayment: i128,
    pub purpose: Symbol,
    pub duration_days: u32,
    pub status: u32, // 0 = Requested, 1 = Funded, 2 = Repaid, 3 = Defaulted, 4 = Closed, 5 = ForbearanceActive
    pub funder: Option<Address>,
    pub created_at: u64,
    pub funded_at: u64,
    pub repaid_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    FarmRegistryContract,
    ReputationContract,
    PriceFeedContract,
    WeatherOracleContract,
    FinancingCount,
    Financing(u32),
    Paused,
}

#[contract]
pub struct AgriculturalFinanceContract;

#[contractimpl]
impl AgriculturalFinanceContract {
    pub fn init(
        env: Env,
        admin: Address,
        farm_registry_contract: Address,
        reputation_contract: Address,
    ) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::FarmRegistryContract, &farm_registry_contract);
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().set(&DataKey::FinancingCount, &0u32);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    /// Configure external AgriFlow Oracle contracts for automated collateral valuation and weather risk
    pub fn set_oracle_contracts(
        env: Env,
        admin: Address,
        price_feed_contract: Address,
        weather_oracle_contract: Address,
    ) {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        stored_admin.require_auth();
        if admin != stored_admin {
            panic!("Unauthorized admin");
        }

        env.storage()
            .instance()
            .set(&DataKey::PriceFeedContract, &price_feed_contract);
        env.storage()
            .instance()
            .set(&DataKey::WeatherOracleContract, &weather_oracle_contract);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (symbol_short!("oracles"),),
            (price_feed_contract, weather_oracle_contract),
        );
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        stored_admin.require_auth();
        if admin != stored_admin {
            panic!("Unauthorized admin");
        }
        env.storage().instance().set(&DataKey::Paused, &paused);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.events().publish((symbol_short!("paused"),), paused);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }

    pub fn create_financing_request(
        env: Env,
        farmer: Address,
        farm_id: Symbol,
        requested_amount: i128,
        expected_repayment: i128,
        purpose: Symbol,
        duration_days: u32,
    ) -> u32 {
        if Self::is_paused(env.clone()) {
            panic!("Contract is paused");
        }
        farmer.require_auth();

        if requested_amount <= 0 {
            panic!("Requested amount must be greater than zero");
        }
        if expected_repayment < requested_amount {
            panic!("Repayment amount must be at least equal to requested amount");
        }
        if duration_days == 0 {
            panic!("Duration must be at least 1 day");
        }

        // Inter-contract validation with FarmRegistry
        if let Some(registry_contract) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::FarmRegistryContract)
        {
            let args = vec![&env, farm_id.clone().into_val(&env)];
            let exists: bool = env.invoke_contract(
                &registry_contract,
                &Symbol::new(&env, "has_farm"),
                args,
            );
            if !exists {
                panic!("Farm ID does not exist in FarmRegistry");
            }
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FinancingCount)
            .unwrap_or(0);
        count += 1;

        let request = FinancingRequest {
            id: count,
            farm_id: farm_id.clone(),
            farmer: farmer.clone(),
            requested_amount,
            expected_repayment,
            purpose: purpose.clone(),
            duration_days,
            status: 0, // Requested
            funder: None,
            created_at: env.ledger().timestamp(),
            funded_at: 0,
            repaid_at: 0,
        };

        env.storage().instance().set(&DataKey::Financing(count), &request);
        env.storage().instance().set(&DataKey::FinancingCount, &count);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Emit FinancingRequested event
        env.events().publish(
            (Symbol::new(&env, "FinancingRequested"), count),
            (farmer, farm_id, requested_amount, duration_days),
        );

        count
    }

    pub fn fund_request(env: Env, funder: Address, request_id: u32) {
        if Self::is_paused(env.clone()) {
            panic!("Contract is paused");
        }
        funder.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.status != 0 {
            panic!("Financing request is not open for funding");
        }
        if req.farmer == funder {
            panic!("Farmer cannot fund own request");
        }

        req.status = 1; // Funded
        req.funder = Some(funder.clone());
        req.funded_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Financing(request_id), &req);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Award reputation to funder via cross-contract call
        if let Some(rep_contract) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::ReputationContract)
        {
            let args = vec![
                &env,
                env.current_contract_address().into_val(&env),
                funder.clone().into_val(&env),
                Symbol::new(&env, "finance").into_val(&env),
            ];
            let _: u32 = env.invoke_contract(&rep_contract, &Symbol::new(&env, "record_activity"), args);
        }

        // Emit FinancingFunded event
        env.events().publish(
            (Symbol::new(&env, "FinancingFunded"), request_id),
            (funder, req.farmer, req.requested_amount),
        );
    }

    /// Automatically extend repayment timeline if satellite weather oracle verifies a severe drought trigger
    pub fn apply_drought_forbearance(env: Env, caller: Address, request_id: u32, region: Symbol) -> bool {
        caller.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.status != 1 && req.status != 5 {
            panic!("Financing request is not in funded status");
        }

        let weather_oracle = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::WeatherOracleContract)
            .expect("Weather oracle not configured");

        // Query weather oracle: check_drought_trigger(region, threshold: 70)
        let args = vec![&env, region.into_val(&env), 70u32.into_val(&env)];
        let is_drought: bool = env.invoke_contract(
            &weather_oracle,
            &Symbol::new(&env, "check_drought_trigger"),
            args,
        );

        if is_drought {
            req.duration_days += 60; // 60-day automatic forbearance extension
            req.status = 5; // ForbearanceActive

            env.storage()
                .instance()
                .set(&DataKey::Financing(request_id), &req);
            env.storage()
                .instance()
                .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

            env.events().publish(
                (symbol_short!("forbear"), request_id),
                (req.farmer, req.duration_days),
            );
            true
        } else {
            false
        }
    }

    /// Restructure an active loan with revised duration and repayment terms agreed by the funder
    pub fn restructure_loan(
        env: Env,
        funder: Address,
        request_id: u32,
        new_duration_days: u32,
        new_expected_repayment: i128,
    ) {
        funder.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.funder != Some(funder.clone()) {
            panic!("Unauthorized funder");
        }
        if req.status != 1 && req.status != 5 {
            panic!("Only active loans can be restructured");
        }
        if new_duration_days <= req.duration_days {
            panic!("New duration must extend current tenure");
        }
        if new_expected_repayment < req.requested_amount {
            panic!("Repayment cannot be lower than principal");
        }

        req.duration_days = new_duration_days;
        req.expected_repayment = new_expected_repayment;

        env.storage()
            .instance()
            .set(&DataKey::Financing(request_id), &req);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "LoanRestructured"), request_id),
            (funder, new_duration_days, new_expected_repayment),
        );
    }

    pub fn record_repayment(env: Env, farmer: Address, request_id: u32) {
        farmer.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.farmer != farmer {
            panic!("Unauthorized farmer");
        }
        if req.status != 1 && req.status != 5 {
            panic!("Financing request must be funded before repayment");
        }

        req.status = 2; // Repaid
        req.repaid_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Financing(request_id), &req);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Inter-contract call: Award farmer reputation for timely repayment
        if let Some(rep_contract) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::ReputationContract)
        {
            let args = vec![
                &env,
                env.current_contract_address().into_val(&env),
                farmer.clone().into_val(&env),
                Symbol::new(&env, "repay").into_val(&env),
            ];
            let _: u32 = env.invoke_contract(&rep_contract, &Symbol::new(&env, "record_activity"), args);
        }

        // Emit RepaymentRecorded event
        env.events().publish(
            (Symbol::new(&env, "RepaymentRecorded"), request_id),
            (farmer, req.expected_repayment),
        );
    }

    pub fn close_financing(env: Env, farmer: Address, request_id: u32) {
        farmer.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.farmer != farmer {
            panic!("Unauthorized farmer");
        }
        if req.status != 2 {
            panic!("Only repaid financing can be closed");
        }

        req.status = 4; // Closed
        env.storage()
            .instance()
            .set(&DataKey::Financing(request_id), &req);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Emit FinancingClosed event
        env.events().publish(
            (Symbol::new(&env, "FinancingClosed"), request_id),
            farmer,
        );
    }

    pub fn get_financing(env: Env, request_id: u32) -> FinancingRequest {
        env.storage()
            .instance()
            .get(&DataKey::Financing(request_id))
            .expect("Financing request not found")
    }

    pub fn get_financing_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::FinancingCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
