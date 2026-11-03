#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

#[test]
fn test_coop_vault_lifecycle_and_multisig_voting() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CooperativeVaultContract, ());
    let client = CooperativeVaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let farmer1 = Address::generate(&env);
    let farmer2 = Address::generate(&env);
    let supplier = Address::generate(&env);

    // 51% quorum required
    client.initialize(&admin, &51u32);

    // Register farmer1 (60 shares) and farmer2 (40 shares) -> Total = 100 shares
    client.register_member(&admin, &farmer1, &60u64);
    client.register_member(&admin, &farmer2, &40u64);

    // Farmers deposit collective savings into treasury
    client.deposit_savings(&farmer1, &15000i128);
    client.deposit_savings(&farmer2, &10000i128);

    assert_eq!(client.get_treasury(), 25000);

    // Farmer1 proposes bulk fertilizer purchase of 12,000 to supplier
    let prop_id = client.submit_proposal(
        &farmer1,
        &symbol_short!("FERTILIZ"),
        &supplier,
        &12000i128,
    );
    assert_eq!(prop_id, 1);

    // Farmer1 votes with 60 shares (which is >= 51 quorum)
    client.vote_proposal(&farmer1, &prop_id);

    let prop = client.get_proposal(&prop_id);
    assert_eq!(prop.status, ProposalStatus::Approved);

    // Admin executes approved proposal
    client.execute_proposal(&admin, &prop_id);
    let executed_prop = client.get_proposal(&prop_id);
    assert_eq!(executed_prop.status, ProposalStatus::Executed);

    // Treasury decremented by 12,000 -> 13,000 remaining
    assert_eq!(client.get_treasury(), 13000);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_paused_contract_rejects_deposits() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CooperativeVaultContract, ());
    let client = CooperativeVaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &51u32);
    client.register_member(&admin, &farmer, &100u64);
    client.set_paused(&admin, &true);

    // Should panic with ContractPaused
    client.deposit_savings(&farmer, &5000i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_duplicate_voting_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CooperativeVaultContract, ());
    let client = CooperativeVaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let farmer1 = Address::generate(&env);
    let supplier = Address::generate(&env);

    client.initialize(&admin, &60u32);
    client.register_member(&admin, &farmer1, &50u64);
    client.deposit_savings(&farmer1, &10000i128);

    let prop_id = client.submit_proposal(&farmer1, &symbol_short!("SEEDS"), &supplier, &5000i128);
    client.vote_proposal(&farmer1, &prop_id);
    // Duplicate vote should panic with AlreadyVoted
    client.vote_proposal(&farmer1, &prop_id);
}

#[test]
fn test_partial_savings_withdrawal() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CooperativeVaultContract, ());
    let client = CooperativeVaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &51u32);
    client.register_member(&admin, &farmer, &100u64);
    client.deposit_savings(&farmer, &8000i128);
    assert_eq!(client.get_treasury(), 8000);

    client.withdraw_savings(&farmer, &3000i128);
    assert_eq!(client.get_treasury(), 5000);
}
