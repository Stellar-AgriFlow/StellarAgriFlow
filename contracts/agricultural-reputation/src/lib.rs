#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub user: Address,
    pub successful_trades: u32,
    pub completed_financing: u32,
    pub successful_repayments: u32,
    pub completed_escrows: u32,
    pub reputation_score: u32,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Authorized(Address),
    Reputation(Address),
}

#[contract]
pub struct AgriculturalReputationContract;

#[contractimpl]
impl AgriculturalReputationContract {
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn add_authorized_caller(env: Env, admin: Address, caller: Address) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        if admin != stored_admin {
            panic!("Unauthorized admin");
        }
        env.storage().instance().set(&DataKey::Authorized(caller), &true);
    }

    pub fn is_authorized(env: Env, caller: Address) -> bool {
        if let Some(admin) = env.storage().instance().get::<DataKey, Address>(&DataKey::Admin) {
            if admin == caller {
                return true;
            }
        }
        env.storage().instance().has(&DataKey::Authorized(caller))
    }

    pub fn record_activity(
        env: Env,
        caller: Address,
        user: Address,
        activity_type: Symbol,
    ) -> u32 {
        caller.require_auth();
        if !Self::is_authorized(env.clone(), caller.clone()) {
            panic!("Caller is not authorized to award reputation");
        }

        let mut record = Self::get_reputation(env.clone(), user.clone());
        let trade_sym = Symbol::new(&env, "trade");
        let finance_sym = Symbol::new(&env, "finance");
        let repay_sym = Symbol::new(&env, "repay");
        let escrow_sym = Symbol::new(&env, "escrow");

        if activity_type == trade_sym {
            record.successful_trades += 1;
            record.reputation_score += 10;
        } else if activity_type == finance_sym {
            record.completed_financing += 1;
            record.reputation_score += 15;
        } else if activity_type == repay_sym {
            record.successful_repayments += 1;
            record.reputation_score += 25;
        } else if activity_type == escrow_sym {
            record.completed_escrows += 1;
            record.reputation_score += 10;
        } else {
            panic!("Invalid activity type");
        }

        record.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Reputation(user.clone()), &record);

        // Emit ReputationUpdated event: topics (symbol, user), data (score, activity)
        env.events().publish(
            (Symbol::new(&env, "ReputationUpdated"), user),
            (record.reputation_score, activity_type),
        );

        record.reputation_score
    }

    pub fn get_reputation(env: Env, user: Address) -> ReputationData {
        if let Some(record) = env
            .storage()
            .instance()
            .get::<DataKey, ReputationData>(&DataKey::Reputation(user.clone()))
        {
            record
        } else {
            ReputationData {
                user,
                successful_trades: 0,
                completed_financing: 0,
                successful_repayments: 0,
                completed_escrows: 0,
                reputation_score: 100, // Base default reputation score
                updated_at: env.ledger().timestamp(),
            }
        }
    }
}

#[cfg(test)]
mod test;
