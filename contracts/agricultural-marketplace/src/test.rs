#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[contract]
pub struct MockEscrowContract;

#[contractimpl]
impl MockEscrowContract {
    pub fn create_escrow(
        _env: Env,
        _caller: Address,
        _buyer: Address,
        _seller: Address,
        _listing_id: u32,
        _amount: i128,
    ) -> u32 {
        88 // Return mock escrow ID
    }
}

#[contract]
pub struct MockFarmRegistryContract;

#[contractimpl]
impl MockFarmRegistryContract {
    pub fn has_farm(env: Env, farm_id: Symbol) -> bool {
        farm_id == Symbol::new(&env, "AGRI_000001")
    }
}

#[test]
fn test_marketplace_listing_and_purchase() {
    let env = Env::default();
    env.mock_all_auths();

    let escrow_id = env.register(MockEscrowContract, ());
    let registry_id = env.register(MockFarmRegistryContract, ());

    let market_id = env.register(AgriculturalMarketplaceContract, ());
    let client = AgriculturalMarketplaceContractClient::new(&env, &market_id);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.init(&admin, &escrow_id, &registry_id);

    let farm_id = Symbol::new(&env, "AGRI_000001");
    let crop_type = Symbol::new(&env, "Maize");
    let unit = Symbol::new(&env, "Bags");
    let location = Symbol::new(&env, "Nakuru");

    let listing_id = client.create_listing(
        &seller,
        &farm_id,
        &crop_type,
        &50,
        &unit,
        &25_000_0000,
        &location,
    );
    assert_eq!(listing_id, 1);

    let listing = client.get_listing(&listing_id);
    assert_eq!(listing.status, 0); // Active
    assert_eq!(listing.quantity, 50);

    // Purchase listing -> triggers cross-contract escrow creation
    let returned_escrow_id = client.purchase_listing(&buyer, &listing_id);
    assert_eq!(returned_escrow_id, 88);

    let updated_listing = client.get_listing(&listing_id);
    assert_eq!(updated_listing.status, 1); // Sold
    assert_eq!(updated_listing.escrow_id, 88);
}

#[test]
#[should_panic(expected = "Farm ID does not exist in FarmRegistry")]
fn test_create_listing_with_invalid_farm_id() {
    let env = Env::default();
    env.mock_all_auths();

    let escrow_id = env.register(MockEscrowContract, ());
    let registry_id = env.register(MockFarmRegistryContract, ());

    let market_id = env.register(AgriculturalMarketplaceContract, ());
    let client = AgriculturalMarketplaceContractClient::new(&env, &market_id);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);

    client.init(&admin, &escrow_id, &registry_id);

    let invalid_farm_id = Symbol::new(&env, "NON_EXISTENT");
    client.create_listing(
        &seller,
        &invalid_farm_id,
        &Symbol::new(&env, "Wheat"),
        &10,
        &Symbol::new(&env, "Tons"),
        &100_000_0000,
        &Symbol::new(&env, "Eldoret"),
    );
}
