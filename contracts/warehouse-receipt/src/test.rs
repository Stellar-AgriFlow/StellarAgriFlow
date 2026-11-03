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

#[test]
fn test_pledge_and_unpledge_collateral() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);
    let lender = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    let receipt_id = client.mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_01"),
        &Symbol::new(&env, "Wheat"),
        &10_000,
        &Symbol::new(&env, "Grade1"),
        &1200,
        &2026,
    );

    // Farmer pledges receipt to lender
    client.pledge_as_collateral(&farmer, &receipt_id, &lender);
    let pledged = client.get_receipt(&receipt_id);
    assert_eq!(pledged.is_pledged, true);
    assert_eq!(pledged.pledgee, Some(lender.clone()));

    // Lender releases pledge upon full debt settlement
    client.unpledge_collateral(&lender, &receipt_id);
    let released = client.get_receipt(&receipt_id);
    assert_eq!(released.is_pledged, false);
    assert_eq!(released.pledgee, None);
}

#[test]
fn test_burn_receipt_for_redemption() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    let receipt_id = client.mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_KANO_02"),
        &Symbol::new(&env, "Soybeans"),
        &15_000,
        &Symbol::new(&env, "Grade1"),
        &1150,
        &2026,
    );

    // Custodian burns receipt as physical soybeans are loaded onto exporter's trucks
    client.burn_receipt_for_redemption(&custodian, &receipt_id);
    let redeemed = client.get_receipt(&receipt_id);
    assert_eq!(redeemed.is_redeemed, true);

    // Double redemption should fail
    let double_err = client.try_burn_receipt_for_redemption(&custodian, &receipt_id);
    assert_eq!(double_err.err(), Some(Ok(ReceiptError::ReceiptAlreadyRedeemed)));
}

#[test]
fn test_transfer_receipt() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    let receipt_id = client.mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_01"),
        &Symbol::new(&env, "Cocoa"),
        &5_000,
        &Symbol::new(&env, "Grade1"),
        &750,
        &2026,
    );

    // Farmer transfers negotiable receipt to buyer
    client.transfer_receipt(&farmer, &receipt_id, &buyer);
    let transferred = client.get_receipt(&receipt_id);
    assert_eq!(transferred.owner, buyer);
}

#[test]
fn test_get_receipts_by_owner() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    client.mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_01"),
        &Symbol::new(&env, "Maize"),
        &10_000,
        &Symbol::new(&env, "Grade1"),
        &1250,
        &2026,
    );
    client.mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_01"),
        &Symbol::new(&env, "Wheat"),
        &15_000,
        &Symbol::new(&env, "Grade2"),
        &1300,
        &2026,
    );

    let farmer_receipts = client.get_receipts_by_owner(&farmer);
    assert_eq!(farmer_receipts.len(), 2);
}

#[test]
fn test_warehouse_receipt_circuit_breaker() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let custodian = Address::generate(&env);
    let farmer = Address::generate(&env);

    client.initialize(&admin);
    client.add_custodian(&admin, &custodian);

    assert_eq!(client.is_paused(), false);
    client.set_paused(&admin, &true);
    assert_eq!(client.is_paused(), true);

    // Minting while paused should fail
    let err_mint = client.try_mint_receipt(
        &custodian,
        &farmer,
        &Symbol::new(&env, "SILO_01"),
        &Symbol::new(&env, "Maize"),
        &10_000,
        &Symbol::new(&env, "Grade1"),
        &1250,
        &2026,
    );
    assert_eq!(err_mint.err(), Some(Ok(ReceiptError::ContractPaused)));

    client.set_paused(&admin, &false);
    assert_eq!(client.is_paused(), false);
}

#[test]
fn test_validate_grain_quality() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WarehouseReceiptContract, ());
    let client = WarehouseReceiptContractClient::new(&env, &contract_id);

    let g1 = Symbol::new(&env, "Grade1");
    let g2 = Symbol::new(&env, "Grade2");
    let g3 = Symbol::new(&env, "Grade3");

    // Grade 1 requires <= 13.50% moisture
    assert!(client.validate_grain_quality(&1300, &g1));
    assert!(!client.validate_grain_quality(&1400, &g1));

    // Grade 2 requires <= 14.50% moisture
    assert!(client.validate_grain_quality(&1400, &g2));
    assert!(!client.validate_grain_quality(&1500, &g2));

    // Grade 3 requires <= 16.00% moisture
    assert!(client.validate_grain_quality(&1550, &g3));
    assert!(!client.validate_grain_quality(&1650, &g3));
}
