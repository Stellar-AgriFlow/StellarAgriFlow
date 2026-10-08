#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, vec, Address, Env, IntoVal, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProduceListing {
    pub id: u32,
    pub seller: Address,
    pub farm_id: Symbol,
    pub crop_type: Symbol,
    pub quantity: u32,
    pub unit: Symbol,
    pub price_per_unit: i128,
    pub location: Symbol,
    pub status: u32, // 0 = Active, 1 = Sold, 2 = Cancelled
    pub escrow_id: u32,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    EscrowContract,
    FarmRegistryContract,
    ListingCount,
    Listing(u32),
}

#[contract]
pub struct AgriculturalMarketplaceContract;

#[contractimpl]
impl AgriculturalMarketplaceContract {
    pub fn init(
        env: Env,
        admin: Address,
        escrow_contract: Address,
        farm_registry_contract: Address,
    ) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        env.storage()
            .instance()
            .set(&DataKey::FarmRegistryContract, &farm_registry_contract);
        env.storage().instance().set(&DataKey::ListingCount, &0u32);
    }

    pub fn create_listing(
        env: Env,
        seller: Address,
        farm_id: Symbol,
        crop_type: Symbol,
        quantity: u32,
        unit: Symbol,
        price_per_unit: i128,
        location: Symbol,
    ) -> u32 {
        seller.require_auth();
        if quantity == 0 {
            panic!("Quantity must be greater than zero");
        }
        if price_per_unit <= 0 {
            panic!("Price per unit must be greater than zero");
        }

        // Optional inter-contract validation of farm_id with FarmRegistry
        if let Some(registry_contract) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::FarmRegistryContract)
        {
            let args = vec![&env, farm_id.clone().into_val(&env)];
            let exists: bool = env.invoke_contract(&registry_contract, &Symbol::new(&env, "has_farm"), args);
            if !exists {
                panic!("Farm ID does not exist in FarmRegistry");
            }
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ListingCount)
            .unwrap_or(0);
        count += 1;

        let listing = ProduceListing {
            id: count,
            seller: seller.clone(),
            farm_id: farm_id.clone(),
            crop_type: crop_type.clone(),
            quantity,
            unit,
            price_per_unit,
            location,
            status: 0, // Active
            escrow_id: 0,
            created_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Listing(count), &listing);
        env.storage().instance().set(&DataKey::ListingCount, &count);

        // Emit ListingCreated event
        env.events().publish(
            (Symbol::new(&env, "ListingCreated"), count),
            (seller, farm_id, crop_type, quantity, price_per_unit),
        );

        count
    }

    pub fn purchase_listing(env: Env, buyer: Address, listing_id: u32) -> u32 {
        buyer.require_auth();
        let mut listing = Self::get_listing(env.clone(), listing_id);

        if listing.status != 0 {
            panic!("Listing is not active");
        }
        if listing.seller == buyer {
            panic!("Seller cannot purchase own listing");
        }

        let total_amount = (listing.quantity as i128)
            .checked_mul(listing.price_per_unit)
            .expect("Amount overflow");

        let escrow_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .expect("Escrow contract not configured");

        // Inter-contract call: Create Escrow in AgriculturalEscrow contract
        let args = vec![
            &env,
            buyer.clone().into_val(&env), // caller
            buyer.clone().into_val(&env), // buyer
            listing.seller.clone().into_val(&env), // seller
            listing_id.into_val(&env), // listing_id
            total_amount.into_val(&env), // amount
        ];

        let escrow_id: u32 = env.invoke_contract(
            &escrow_contract,
            &Symbol::new(&env, "create_escrow"),
            args,
        );

        listing.status = 1; // Sold
        listing.escrow_id = escrow_id;
        env.storage()
            .instance()
            .set(&DataKey::Listing(listing_id), &listing);

        // Emit ListingPurchased event
        env.events().publish(
            (Symbol::new(&env, "ListingPurchased"), listing_id),
            (buyer, listing.seller, escrow_id, total_amount),
        );

        escrow_id
    }

    pub fn cancel_listing(env: Env, seller: Address, listing_id: u32) {
        seller.require_auth();
        let mut listing = Self::get_listing(env.clone(), listing_id);

        if listing.seller != seller {
            panic!("Unauthorized seller");
        }
        if listing.status != 0 {
            panic!("Only active listings can be cancelled");
        }

        listing.status = 2; // Cancelled
        env.storage()
            .instance()
            .set(&DataKey::Listing(listing_id), &listing);
    }

    pub fn get_listing(env: Env, listing_id: u32) -> ProduceListing {
        env.storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .expect("Listing not found")
    }

    pub fn get_listing_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ListingCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
