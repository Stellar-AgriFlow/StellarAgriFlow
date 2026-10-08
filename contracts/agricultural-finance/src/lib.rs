#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, vec, Address, Env, IntoVal, Symbol,
};

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
    pub status: u32, // 0 = Requested, 1 = Funded, 2 = Repaid, 3 = Defaulted, 4 = Closed
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
    FinancingCount,
    Financing(u32),
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

        // Emit FinancingRequested event
        env.events().publish(
            (Symbol::new(&env, "FinancingRequested"), count),
            (farmer, farm_id, requested_amount, duration_days),
        );

        count
    }

    pub fn fund_request(env: Env, funder: Address, request_id: u32) {
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

    pub fn record_repayment(env: Env, farmer: Address, request_id: u32) {
        farmer.require_auth();
        let mut req = Self::get_financing(env.clone(), request_id);

        if req.farmer != farmer {
            panic!("Unauthorized farmer");
        }
        if req.status != 1 {
            panic!("Financing request must be funded before repayment");
        }

        req.status = 2; // Repaid
        req.repaid_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Financing(request_id), &req);

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
