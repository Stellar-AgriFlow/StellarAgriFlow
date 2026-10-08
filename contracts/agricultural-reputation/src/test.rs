#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_reputation_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AgriculturalReputationContract, ());
    let client = AgriculturalReputationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);
    let finance_contract = Address::generate(&env);

    client.init(&admin);

    // Initial reputation should be default 100
    let rep = client.get_reputation(&farmer);
    assert_eq!(rep.reputation_score, 100);
    assert_eq!(rep.completed_financing, 0);

    // Admin authorizes finance contract
    client.add_authorized_caller(&admin, &finance_contract);
    assert!(client.is_authorized(&finance_contract));

    // Finance contract records completed financing
    let new_score = client.record_activity(
        &finance_contract,
        &farmer,
        &Symbol::new(&env, "finance"),
    );
    assert_eq!(new_score, 115);

    // Record repayment
    let repay_score = client.record_activity(
        &finance_contract,
        &farmer,
        &Symbol::new(&env, "repay"),
    );
    assert_eq!(repay_score, 140);

    let updated_rep = client.get_reputation(&farmer);
    assert_eq!(updated_rep.completed_financing, 1);
    assert_eq!(updated_rep.successful_repayments, 1);
    assert_eq!(updated_rep.reputation_score, 140);
}

#[test]
#[should_panic(expected = "Caller is not authorized to award reputation")]
fn test_unauthorized_reputation_update() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AgriculturalReputationContract, ());
    let client = AgriculturalReputationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let victim = Address::generate(&env);

    client.init(&admin);

    // Attacker tries to award themselves reputation without authorization
    client.record_activity(&attacker, &victim, &Symbol::new(&env, "trade"));
}
