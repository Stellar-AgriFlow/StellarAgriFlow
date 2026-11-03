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
