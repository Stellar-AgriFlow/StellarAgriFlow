#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Events, Ledger}, Address, Env, String, IntoVal};

#[test]
fn test_register_and_get_farm() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1728400000);

    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let country = String::from_str(&env, "Kenya");
    let region = String::from_str(&env, "Rift Valley");
    let crop = String::from_str(&env, "Coffee");

    let farm_id = client.register_farm(
        &farmer,
        &country,
        &region,
        &crop,
        &50,
        &120,
    );

    assert_eq!(farm_id, String::from_str(&env, "AGRI-000001"));

    // Check retrieval
    let passport = client.get_farm(&farm_id).expect("Farm should exist");
    assert_eq!(passport.farm_id, farm_id);
    assert_eq!(passport.owner, farmer);
    assert_eq!(passport.country, country);
    assert_eq!(passport.region, region);
    assert_eq!(passport.crop, crop);
    assert_eq!(passport.farm_size_hectares, 50);
    assert_eq!(passport.expected_yield_tons, 120);
    assert_eq!(passport.registration_timestamp, 1728400000);
    assert_eq!(passport.status, FarmStatus::Active);

    // Verify existence
    assert!(client.has_farm(&farm_id));
    assert_eq!(client.get_farm_count(), 1);
}

#[test]
fn test_unique_sequential_farm_ids() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer1 = Address::generate(&env);
    let farmer2 = Address::generate(&env);

    let id1 = client.register_farm(
        &farmer1,
        &String::from_str(&env, "Ghana"),
        &String::from_str(&env, "Ashanti"),
        &String::from_str(&env, "Cocoa"),
        &25,
        &60,
    );

    let id2 = client.register_farm(
        &farmer2,
        &String::from_str(&env, "Nigeria"),
        &String::from_str(&env, "Benue"),
        &String::from_str(&env, "Cassava"),
        &80,
        &400,
    );

    assert_eq!(id1, String::from_str(&env, "AGRI-000001"));
    assert_eq!(id2, String::from_str(&env, "AGRI-000002"));
    assert_eq!(client.get_farm_count(), 2);
}

#[test]
fn test_invalid_farm_data_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);

    // Size = 0 should return Err
    let res = client.try_register_farm(
        &farmer,
        &String::from_str(&env, "Brazil"),
        &String::from_str(&env, "Cerrado"),
        &String::from_str(&env, "Soybeans"),
        &0,
        &100,
    );

    assert!(res.is_err());
}

#[test]
fn test_has_farm_nonexistent() {
    let env = Env::default();
    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    assert!(!client.has_farm(&String::from_str(&env, "AGRI-999999")));
    assert!(client.get_farm(&String::from_str(&env, "AGRI-999999")).is_none());
}

#[test]
fn test_unauthorized_status_update_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let real_owner = Address::generate(&env);
    let attacker = Address::generate(&env);

    let farm_id = client.register_farm(
        &real_owner,
        &String::from_str(&env, "Ivory Coast"),
        &String::from_str(&env, "Divo"),
        &String::from_str(&env, "Cocoa"),
        &30,
        &75,
    );

    // Attacker tries to update status
    let res = client.try_update_farm_status(&attacker, &farm_id, &FarmStatus::Suspended);
    assert!(res.is_err());

    // Real owner updates status
    let ok_res = client.try_update_farm_status(&real_owner, &farm_id, &FarmStatus::PendingVerification);
    assert!(ok_res.is_ok());

    let updated = client.get_farm(&farm_id).unwrap();
    assert_eq!(updated.status, FarmStatus::PendingVerification);
}

#[test]
fn test_event_emission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FarmRegistryContract);
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let farm_id = client.register_farm(
        &farmer,
        &String::from_str(&env, "Rwanda"),
        &String::from_str(&env, "Musanze"),
        &String::from_str(&env, "Potato"),
        &15,
        &45,
    );

    let events = env.events().all();
    assert!(!events.is_empty());
}
