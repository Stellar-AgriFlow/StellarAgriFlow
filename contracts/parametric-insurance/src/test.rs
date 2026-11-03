#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

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
