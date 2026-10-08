#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

// Dummy mock reputation contract for testutils
#[contract]
pub struct MockReputationContract;

#[contractimpl]
impl MockReputationContract {
    pub fn record_activity(
        _env: Env,
        _caller: Address,
        _user: Address,
        _activity_type: Symbol,
    ) -> u32 {
        120
    }
}

#[test]
fn test_escrow_full_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());

    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.init(&admin, &rep_contract_id);

    // Create escrow for listing #42 with 500 XLM
    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &42, &500_000_0000);
    assert_eq!(escrow_id, 1);

    let record = client.get_escrow(&escrow_id);
    assert_eq!(record.status, 0); // Created
    assert_eq!(record.amount, 500_000_0000);

    // Fund escrow
    client.fund_escrow(&buyer, &escrow_id);
    let funded_record = client.get_escrow(&escrow_id);
    assert_eq!(funded_record.status, 1); // Funded

    // Release funds upon delivery confirmation
    client.release_funds(&buyer, &escrow_id);
    let released_record = client.get_escrow(&escrow_id);
    assert_eq!(released_record.status, 2); // Released
}

#[test]
#[should_panic(expected = "Unauthorized buyer")]
fn test_unauthorized_buyer_release() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());
    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let attacker = Address::generate(&env);

    client.init(&admin, &rep_contract_id);
    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &10, &100_000_0000);
    client.fund_escrow(&buyer, &escrow_id);

    // Attacker tries to release funds
    client.release_funds(&attacker, &escrow_id);
}
