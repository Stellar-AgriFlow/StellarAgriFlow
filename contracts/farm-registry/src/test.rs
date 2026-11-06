#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events, Ledger},
    Address, Env, String,
};

#[test]
fn test_register_and_get_farm() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1728400000);

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let country = String::from_str(&env, "Kenya");
    let region = String::from_str(&env, "Rift Valley");
    let crop = String::from_str(&env, "Coffee");

    let farm_id = client.register_farm(&farmer, &country, &region, &crop, &50, &120);

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

    let contract_id = env.register(FarmRegistryContract, ());
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

    let contract_id = env.register(FarmRegistryContract, ());
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
fn test_update_status_authorization() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let real_owner = Address::generate(&env);
    let impostor = Address::generate(&env);

    let farm_id = client.register_farm(
        &real_owner,
        &String::from_str(&env, "Uganda"),
        &String::from_str(&env, "Mbale"),
        &String::from_str(&env, "Arabica Coffee"),
        &10,
        &25,
    );

    // Impostor tries to suspend -> should fail
    let err_res = client.try_update_farm_status(&impostor, &farm_id, &FarmStatus::Suspended);
    assert!(err_res.is_err());

    // Real owner updates status
    let ok_res =
        client.try_update_farm_status(&real_owner, &farm_id, &FarmStatus::PendingVerification);
    assert!(ok_res.is_ok());

    let updated = client.get_farm(&farm_id).unwrap();
    assert_eq!(updated.status, FarmStatus::PendingVerification);
}

#[test]
fn test_event_emission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let _farm_id = client.register_farm(
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

#[test]
fn test_farm_coordinates_validation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let farm_id = client.register_farm(
        &farmer,
        &String::from_str(&env, "Kenya"),
        &String::from_str(&env, "Nakuru"),
        &String::from_str(&env, "Maize"),
        &30,
        &90,
    );

    assert!(client.validate_gps_coordinates(&-303100, &36080000));
    assert!(!client.validate_gps_coordinates(&100_000_000, &0)); // Lat > 90 invalid

    client.set_farm_coordinates(&farmer, &farm_id, &-303100, &36080000);

    let coords = client.get_farm_coordinates(&farm_id).unwrap();
    assert_eq!(coords.lat_e6, -303100);
    assert_eq!(coords.lon_e6, 36080000);
}

#[test]
fn test_farm_certification_expiry() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1700000000);

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let certifier = Address::generate(&env);
    let admin = Address::generate(&env);

    client.set_admin(&admin);
    client.add_certifier(&admin, &certifier);

    let farm_id = client.register_farm(
        &farmer,
        &String::from_str(&env, "Ivory Coast"),
        &String::from_str(&env, "San Pedro"),
        &String::from_str(&env, "Cocoa"),
        &40,
        &80,
    );

    let fair_trade = Symbol::new(&env, "FairTrade");

    assert!(!client.has_valid_certification(&farm_id, &fair_trade));

    // Certify for 365 days
    client.add_certification(&certifier, &farm_id, &fair_trade, &365);
    assert!(client.has_valid_certification(&farm_id, &fair_trade));

    let cert = client.get_certification(&farm_id, &fair_trade).unwrap();
    assert_eq!(cert.issuer, certifier);
    assert_eq!(cert.expires_at, 1700000000 + 365 * 86400);

    // Fast-forward past 366 days
    env.ledger().set_timestamp(1700000000 + 366 * 86400);
    assert!(!client.has_valid_certification(&farm_id, &fair_trade));
}

#[test]
fn test_update_yield_forecast() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FarmRegistryContract, ());
    let client = FarmRegistryContractClient::new(&env, &contract_id);

    let farmer = Address::generate(&env);
    let farm_id = client.register_farm(
        &farmer,
        &String::from_str(&env, "Zambia"),
        &String::from_str(&env, "Lusaka"),
        &String::from_str(&env, "Maize"),
        &50,
        &150,
    );

    let new_crop = String::from_str(&env, "Soybeans");
    client.update_yield_forecast(&farmer, &farm_id, &new_crop, &220);

    let updated = client.get_farm(&farm_id).unwrap();
    assert_eq!(updated.crop, new_crop);
    assert_eq!(updated.expected_yield_tons, 220);
}
