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
