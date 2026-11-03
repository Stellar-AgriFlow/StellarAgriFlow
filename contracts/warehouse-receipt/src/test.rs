#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_warehouse_receipt_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_receipt_count(), 0);
}

#[test]
fn test_custodian_management() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);

    client.initialize(&admin);
    assert_eq!(client.get_custodians_count(), 0);
    assert!(!client.is_custodian(&custodian));

    client.add_custodian(&admin, &custodian);
    assert_eq!(client.get_custodians_count(), 1);
    assert!(client.is_custodian(&custodian));

    client.remove_custodian(&admin, &custodian);
    assert_eq!(client.get_custodians_count(), 0);
    assert!(!client.is_custodian(&custodian));
}

#[test]
fn test_mint_warehouse_receipt() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    let warehouse = Symbol::new(&env, "SILO_NAKURU_01");
    let maize = Symbol::new(&env, "Maize");
    let grade1 = Symbol::new(&env, "Grade1");

    // Mint receipt for 25,000 kg (25 metric tons) at 12.80% moisture
    let receipt_id = client.mint_receipt(
        &custodian,
        &farmer,
        &warehouse,
        &maize,
        &25_000,
        &grade1,
        &1280,
        &2026,
    );
    assert_eq!(receipt_id, 1);
    assert_eq!(client.get_receipt_count(), 1);

    let receipt = client.get_receipt(&receipt_id);
    assert_eq!(receipt.owner, farmer);
    assert_eq!(receipt.quantity_kg, 25_000);
    assert_eq!(receipt.moisture_percent_e2, 1280);
    assert_eq!(receipt.is_pledged, false);
    assert_eq!(receipt.is_redeemed, false);
}
