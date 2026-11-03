#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger as _}, Env};

#[contract]
pub struct MockWeatherOracle;

#[contractimpl]
impl MockWeatherOracle {
    pub fn check_drought_trigger(_env: Env, _region: Symbol, _threshold: u32) -> bool {
        true
    }
}

#[test]
fn test_parametric_insurance_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin, &oracle_id);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_total_liquidity(), 0);
    assert_eq!(client.get_policy_count(), 0);
}

#[test]
fn test_deposit_liquidity() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);

    client.initialize(&admin, &oracle_id);

    // LP deposits 10,000 stroops
    let shares = client.deposit_liquidity(&lp, &10_000_0000);
    assert_eq!(shares, 10_000_0000);
    assert_eq!(client.get_total_liquidity(), 10_000_0000);
    assert_eq!(client.get_user_shares(&lp), 10_000_0000);
    assert_eq!(client.get_total_shares(), 10_000_0000);
}

#[test]
fn test_withdraw_liquidity() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);

    client.initialize(&admin, &oracle_id);
    client.deposit_liquidity(&lp, &10_000_0000);

    // LP withdraws 4,000 shares
    let payout = client.withdraw_liquidity(&lp, &4_000_0000);
    assert_eq!(payout, 4_000_0000);
    assert_eq!(client.get_total_liquidity(), 6_000_0000);
    assert_eq!(client.get_user_shares(&lp), 6_000_0000);
    assert_eq!(client.get_total_shares(), 6_000_0000);
}

#[test]
fn test_purchase_policy() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &oracle_id);

    // LP funds the pool with 20,000 stroops
    client.deposit_liquidity(&lp, &20_000_0000);

    // Farmer buys 5,000 coverage policy for Kano drought index >= 75
    let region = Symbol::new(&env, "NG_KANO");
    let policy_id = client.purchase_policy(&farmer, &region, &75, &5_000_0000, &90);
    assert_eq!(policy_id, 1);
    assert_eq!(client.get_policy_count(), 1);

    let policy = client.get_policy(&policy_id);
    assert_eq!(policy.farmer, farmer);
    assert_eq!(policy.payout_amount, 5_000_0000);
    assert_eq!(policy.premium_paid, 250_0000); // 5% of 5,000 = 250
    assert_eq!(policy.is_paid, false);

    // Pool liquidity increased by premium: 20,000 + 250 = 20,250
    assert_eq!(client.get_total_liquidity(), 20_250_0000);
}

#[test]
fn test_trigger_policy_payout() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &oracle_id);
    client.deposit_liquidity(&lp, &20_000_0000);

    let region = Symbol::new(&env, "NG_KANO");
    let policy_id = client.purchase_policy(&farmer, &region, &75, &5_000_0000, &90);

    // Weather oracle verifies severe drought trigger condition -> trigger instant payout
    let claim_payout = client.trigger_policy_payout(&farmer, &policy_id);
    assert_eq!(claim_payout, 5_000_0000);

    let updated_policy = client.get_policy(&policy_id);
    assert_eq!(updated_policy.is_paid, true);

    // Pool liquidity reduced by claim disbursement: 20,250 - 5,000 = 15,250
    assert_eq!(client.get_total_liquidity(), 15_250_0000);

    // Second trigger should fail
    let double_claim = client.try_trigger_policy_payout(&farmer, &policy_id);
    assert_eq!(double_claim.err(), Some(Ok(InsuranceError::PolicyAlreadyPaid)));
}

#[test]
fn test_expire_policy() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &oracle_id);
    client.deposit_liquidity(&lp, &10_000_0000);

    let policy_id = client.purchase_policy(
        &farmer,
        &Symbol::new(&env, "KE_RIFT"),
        &80,
        &2_000_0000,
        &60,
    );

    // Fast-forward 61 days
    env.ledger().set_timestamp(env.ledger().timestamp() + 61 * 86400);

    client.expire_policy(&farmer, &policy_id);
    let expired = client.get_policy(&policy_id);
    assert_eq!(expired.is_expired, true);
    assert_eq!(expired.is_paid, false);
}

#[test]
fn test_get_policies_by_farmer() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin, &oracle_id);
    client.deposit_liquidity(&lp, &50_000_0000);

    client.purchase_policy(&farmer, &Symbol::new(&env, "NG_KANO"), &70, &1_000_0000, &30);
    client.purchase_policy(&farmer, &Symbol::new(&env, "KE_NAK"), &75, &2_000_0000, &45);

    let farmer_policies = client.get_policies_by_farmer(&farmer);
    assert_eq!(farmer_policies.len(), 2);
}

#[test]
fn test_insurance_circuit_breaker() {
    let env = Env::default();
    env.mock_all_auths();

    let oracle_id = env.register(MockWeatherOracle, ());

    let contract_id = env.register(ParametricInsuranceContract, ());
    let client = ParametricInsuranceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let lp = Address::generate(&env);
    client.initialize(&admin, &oracle_id);

    assert_eq!(client.is_paused(), false);
    client.set_paused(&admin, &true);
    assert_eq!(client.is_paused(), true);

    // Deposit while paused should fail
    let err_dep = client.try_deposit_liquidity(&lp, &10_000_0000);
    assert_eq!(err_dep.err(), Some(Ok(InsuranceError::ContractPaused)));

    client.set_paused(&admin, &false);
    assert_eq!(client.is_paused(), false);
}
