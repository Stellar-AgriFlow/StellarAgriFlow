#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, vec, Address, Env, IntoVal, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub id: u32,
    pub buyer: Address,
    pub seller: Address,
    pub listing_id: u32,
    pub amount: i128,
    pub status: u32, // 0 = Created, 1 = Funded, 2 = Released, 3 = Refunded, 4 = Disputed
    pub created_at: u64,
    pub released_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ReputationContract,
    EscrowCount,
    Escrow(u32),
}

#[contract]
pub struct AgriculturalEscrowContract;

#[contractimpl]
impl AgriculturalEscrowContract {
    pub fn init(env: Env, admin: Address, reputation_contract: Address) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().set(&DataKey::EscrowCount, &0u32);
    }

    pub fn create_escrow(
        env: Env,
        caller: Address,
        buyer: Address,
        seller: Address,
        listing_id: u32,
        amount: i128,
    ) -> u32 {
        caller.require_auth();
        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowCount)
            .unwrap_or(0);
        count += 1;

        let escrow = EscrowRecord {
            id: count,
            buyer: buyer.clone(),
            seller: seller.clone(),
            listing_id,
            amount,
            status: 0, // Created
            created_at: env.ledger().timestamp(),
            released_at: 0,
        };

        env.storage().instance().set(&DataKey::Escrow(count), &escrow);
        env.storage().instance().set(&DataKey::EscrowCount, &count);

        // Emit EscrowCreated event: topics (symbol, escrow_id), data (buyer, seller, amount)
        env.events().publish(
            (Symbol::new(&env, "EscrowCreated"), count),
            (buyer, seller, amount),
        );

        count
    }

    pub fn fund_escrow(env: Env, buyer: Address, escrow_id: u32) {
        buyer.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        if escrow.buyer != buyer {
            panic!("Unauthorized buyer");
        }
        if escrow.status != 0 {
            panic!("Escrow cannot be funded in current status");
        }

        escrow.status = 1; // Funded
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        // Emit EscrowFunded event
        env.events().publish(
            (Symbol::new(&env, "EscrowFunded"), escrow_id),
            (escrow.buyer, escrow.amount),
        );
    }

    pub fn release_funds(env: Env, buyer: Address, escrow_id: u32) {
        buyer.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        if escrow.buyer != buyer {
            panic!("Unauthorized buyer");
        }
        if escrow.status != 1 {
            panic!("Escrow must be funded before release");
        }

        escrow.status = 2; // Released
        escrow.released_at = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        // Inter-contract call: Record reputation for seller and buyer if reputation_contract is set
        if let Some(rep_contract) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::ReputationContract)
        {
            // Award reputation to seller for escrow fulfillment
            let args_seller = vec![
                &env,
                env.current_contract_address().into_val(&env),
                escrow.seller.clone().into_val(&env),
                Symbol::new(&env, "escrow").into_val(&env),
            ];
            let _: u32 = env.invoke_contract(&rep_contract, &Symbol::new(&env, "record_activity"), args_seller);

            // Award reputation to buyer for completed trade
            let args_buyer = vec![
                &env,
                env.current_contract_address().into_val(&env),
                escrow.buyer.clone().into_val(&env),
                Symbol::new(&env, "trade").into_val(&env),
            ];
            let _: u32 = env.invoke_contract(&rep_contract, &Symbol::new(&env, "record_activity"), args_buyer);
        }

        // Emit EscrowReleased event
        env.events().publish(
            (Symbol::new(&env, "EscrowReleased"), escrow_id),
            (escrow.seller, escrow.amount),
        );
    }

    pub fn refund_escrow(env: Env, caller: Address, escrow_id: u32) {
        caller.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");

        // Either seller voluntarily refunds, or admin intervenes in dispute
        if caller != escrow.seller && caller != admin {
            panic!("Only seller or protocol admin can authorize refund");
        }
        if escrow.status != 1 && escrow.status != 0 {
            panic!("Escrow not refundable in current status");
        }

        escrow.status = 3; // Refunded
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        // Emit EscrowRefunded event
        env.events().publish(
            (Symbol::new(&env, "EscrowRefunded"), escrow_id),
            (escrow.buyer, escrow.amount),
        );
    }

    pub fn get_escrow(env: Env, escrow_id: u32) -> EscrowRecord {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found")
    }

    pub fn get_escrow_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::EscrowCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
