#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Env,
};

#[contract]
pub struct MockRegistryContract;

#[contractimpl]
impl MockRegistryContract {
    pub fn has_farm(env: Env, farm_id: Symbol) -> bool {
        farm_id == Symbol::new(&env, "AGRI_000001")
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

#[contract]
pub struct MockWeatherOracleContract;

#[contractimpl]
impl MockWeatherOracleContract {
    pub fn check_drought_trigger(_env: Env, _region: Symbol, _threshold: u32) -> bool {
        true
    }
}

#[contract]
pub struct MockPriceFeedContract;

#[contractimpl]
impl MockPriceFeedContract {
    pub fn get_price(_env: Env, _commodity: Symbol) -> i128 {
        442
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

    let farm_id = Symbol::new(&env, "AGRI_000001");
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
fn test_paused_circuit_breaker() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register(MockRegistryContract, ());
    let rep_id = env.register(MockReputationContract, ());

    let finance_id = env.register(AgriculturalFinanceContract, ());
    let client = AgriculturalFinanceContractClient::new(&env, &finance_id);

    let admin = Address::generate(&env);
    let _unused_farmer = Address::generate(&env);

    client.init(&admin, &registry_id, &rep_id);
    assert_eq!(client.is_paused(), false);

    client.set_paused(&admin, &true);
    assert_eq!(client.is_paused(), true);

    client.set_paused(&admin, &false);
    assert_eq!(client.is_paused(), false);
}

#[test]
fn test_loan_restructuring() {
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

    let farm_id = Symbol::new(&env, "AGRI_000001");
    let purpose = Symbol::new(&env, "IrrigationKit");

    let req_id = client.create_financing_request(
        &farmer,
        &farm_id,
        &1000_000_0000,
        &1100_000_0000,
        &purpose,
        &60,
    );
    client.fund_request(&funder, &req_id);

    // Funder agrees to restructure to 120 days and 1150 XLM
    client.restructure_loan(&funder, &req_id, &120, &1150_000_0000);

    let req = client.get_financing(&req_id);
    assert_eq!(req.duration_days, 120);
    assert_eq!(req.expected_repayment, 1150_000_0000);
}

#[test]
fn test_collateral_valuation_via_oracle() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register(MockRegistryContract, ());
    let rep_id = env.register(MockReputationContract, ());
    let price_id = env.register(MockPriceFeedContract, ());
    let weather_id = env.register(MockWeatherOracleContract, ());

    let finance_id = env.register(AgriculturalFinanceContract, ());
    let client = AgriculturalFinanceContractClient::new(&env, &finance_id);

    let admin = Address::generate(&env);
    client.init(&admin, &registry_id, &rep_id);
    client.set_oracle_contracts(&admin, &price_id, &weather_id);

    let commodity = Symbol::new(&env, "Maize");
    // MockPriceFeed returns 442 cents/bushel. For 100 bushels: 44200
    let valuation = client.calculate_collateral_value(&commodity, &100);
    assert_eq!(valuation, 44200);
}

#[test]
fn test_mark_default_after_grace_period() {
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

    let req_id = client.create_financing_request(
        &farmer,
        &Symbol::new(&env, "AGRI_000001"),
        &500_000_0000,
        &550_000_0000,
        &Symbol::new(&env, "Fertilizer"),
        &30,
    );
    client.fund_request(&funder, &req_id);

    // Fast forward ledger timestamp beyond 30 days + 7 days grace = 37 days (3,196,800 seconds)
    env.ledger()
        .set_timestamp(env.ledger().timestamp() + 38 * 86400);

    client.mark_default(&funder, &req_id);
    let req = client.get_financing(&req_id);
    assert_eq!(req.status, 3); // Defaulted
}

#[test]
fn test_drought_forbearance_extension() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register(MockRegistryContract, ());
    let rep_id = env.register(MockReputationContract, ());
    let weather_id = env.register(MockWeatherOracleContract, ());
    let price_feed_id = env.register(MockPriceFeedContract, ());

    let finance_id = env.register(AgriculturalFinanceContract, ());
    let client = AgriculturalFinanceContractClient::new(&env, &finance_id);

    let admin = Address::generate(&env);
    let farmer = Address::generate(&env);
    let funder = Address::generate(&env);

    client.init(&admin, &registry_id, &rep_id);
    client.set_oracle_contracts(&admin, &price_feed_id, &weather_id);

    let farm_id = Symbol::new(&env, "AGRI_000001");
    let req_id = client.create_financing_request(
        &farmer,
        &farm_id,
        &1500_000_0000,
        &1600_000_0000,
        &Symbol::new(&env, "Fertilizer"),
        &90,
    );

    client.fund_request(&funder, &req_id);

    // Apply drought forbearance verified by weather oracle
    let forbearance_applied =
        client.apply_drought_forbearance(&farmer, &req_id, &Symbol::new(&env, "NG_KANO"));
    assert_eq!(forbearance_applied, true);

    let updated_req = client.get_financing(&req_id);
    assert_eq!(updated_req.status, 5); // ForbearanceActive
    assert_eq!(updated_req.duration_days, 150); // 90 + 60 days extension
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
