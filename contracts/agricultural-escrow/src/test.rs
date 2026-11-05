#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Env,
};

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

#[test]
fn test_escrow_inspection_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());
    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let inspector = Address::generate(&env);

    client.init(&admin, &rep_contract_id);
    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &15, &1200_000_0000);
    client.fund_escrow(&buyer, &escrow_id);

    // Assign certified inspector
    client.assign_inspector(&buyer, &escrow_id, &inspector);
    let assigned = client.get_escrow(&escrow_id);
    assert_eq!(assigned.inspector, Some(inspector.clone()));

    // Inspector verifies quality of agricultural consignment
    client.approve_inspection(&inspector, &escrow_id);
    let inspected = client.get_escrow(&escrow_id);
    assert_eq!(inspected.status, 5); // InspectionApproved
    assert_eq!(inspected.inspection_passed, true);

    // Buyer releases payment
    client.release_funds(&buyer, &escrow_id);
    let released = client.get_escrow(&escrow_id);
    assert_eq!(released.status, 2); // Released
}

#[test]
fn test_dispute_timeout_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());
    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.init(&admin, &rep_contract_id);
    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &99, &750_000_0000);
    client.fund_escrow(&buyer, &escrow_id);

    // Buyer raises dispute due to damaged consignment
    client.raise_dispute(&buyer, &escrow_id);
    let disputed = client.get_escrow(&escrow_id);
    assert_eq!(disputed.status, 4); // Disputed

    // Advance 8 days past 7-day timeout
    env.ledger()
        .set_timestamp(env.ledger().timestamp() + 8 * 86400);

    // Buyer claims timeout refund
    client.claim_dispute_timeout_refund(&buyer, &escrow_id);
    let refunded = client.get_escrow(&escrow_id);
    assert_eq!(refunded.status, 3); // Refunded
}

#[test]
fn test_escrow_pause_and_cancel_unfunded() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());
    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.init(&admin, &rep_contract_id);
    assert_eq!(client.is_paused(), false);

    client.set_paused(&admin, &true);
    assert_eq!(client.is_paused(), true);
    client.set_paused(&admin, &false);

    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &100, &300_000_0000);
    client.cancel_unfunded_escrow(&buyer, &escrow_id);
    let cancelled = client.get_escrow(&escrow_id);
    assert_eq!(cancelled.status, 3);
}

#[test]
fn test_escrow_with_token_transfers() {
    let env = Env::default();
    env.mock_all_auths();

    let rep_contract_id = env.register(MockReputationContract, ());
    let escrow_contract_id = env.register(AgriculturalEscrowContract, ());
    let client = AgriculturalEscrowContractClient::new(&env, &escrow_contract_id);

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    client.init(&admin, &rep_contract_id);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_id.address());
    let token_general = soroban_sdk::token::Client::new(&env, &token_id.address());

    token_client.mint(&buyer, &1000);
    assert_eq!(token_general.balance(&buyer), 1000);

    client.set_token(&admin, &token_id.address());
    assert_eq!(client.get_token(), Some(token_id.address()));

    let escrow_id = client.create_escrow(&buyer, &buyer, &seller, &1, &400);
    client.fund_escrow(&buyer, &escrow_id);

    assert_eq!(token_general.balance(&buyer), 600);
    assert_eq!(token_general.balance(&escrow_contract_id), 400);

    client.release_funds(&buyer, &escrow_id);
    assert_eq!(token_general.balance(&seller), 400);
    assert_eq!(token_general.balance(&escrow_contract_id), 0);
}
