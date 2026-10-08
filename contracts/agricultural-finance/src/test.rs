#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[contract]
pub struct MockRegistryContract;

#[contractimpl]
impl MockRegistryContract {
    pub fn has_farm(_env: Env, farm_id: Symbol) -> bool {
        let env = Env::default();
        farm_id == Symbol::new(&env, "AGRI-000001")
    }
}

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
        135
    }
}

#[test]
fn test_financing_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register(MockRegistryContract, ());
    let rep_id = env.register(MockReputationContract, ());

    let finance_id = env.register(AgriculturalFinanceContract, ());
    let client = AgriculturalFinanceContractClient::new(&env, &finance_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);
    let funder = Address::generate(&env);

    client.init(&admin, &registry_id, &rep_id);

    let farm_id = Symbol::new(&env, "AGRI-000001");
    let purpose = Symbol::new(&env, "SeedsAndFertilizer");

    // Farmer creates financing request for 2,000 XLM, expected repayment 2,100 XLM over 90 days
    let req_id = client.create_financing_request(
        &farmer,
        &farm_id,
        &2000_000_0000,
        &2100_000_0000,
        &purpose,
        &90,
    );
    assert_eq!(req_id, 1);

    let req = client.get_financing(&req_id);
    assert_eq!(req.status, 0); // Requested
    assert_eq!(req.requested_amount, 2000_000_0000);

    // Funder funds the request
    client.fund_request(&funder, &req_id);
    let funded_req = client.get_financing(&req_id);
    assert_eq!(funded_req.status, 1); // Funded
    assert_eq!(funded_req.funder, Some(funder));

    // Farmer records repayment
    client.record_repayment(&farmer, &req_id);
    let repaid_req = client.get_financing(&req_id);
    assert_eq!(repaid_req.status, 2); // Repaid

    // Farmer closes completed financing
    client.close_financing(&farmer, &req_id);
    let closed_req = client.get_financing(&req_id);
    assert_eq!(closed_req.status, 4); // Closed
}

#[test]
#[should_panic(expected = "Farm ID does not exist in FarmRegistry")]
fn test_financing_invalid_farm_id() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register(MockRegistryContract, ());
    let rep_id = env.register(MockReputationContract, ());

    let finance_id = env.register(AgriculturalFinanceContract, ());
    let client = AgriculturalFinanceContractClient::new(&env, &finance_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.init(&admin, &registry_id, &rep_id);

    client.create_financing_request(
        &farmer,
        &Symbol::new(&env, "INVALID_FARM"),
        &1000_000_0000,
        &1050_000_0000,
        &Symbol::new(&env, "Irrigation"),
        &60,
    );
}
