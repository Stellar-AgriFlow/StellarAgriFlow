#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, vec, Address, Env, IntoVal, Symbol,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

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
    Paused,
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
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        stored_admin.require_auth();
        if admin != stored_admin {
            panic!("Unauthorized admin");
        }
        env.storage().instance().set(&DataKey::Paused, &paused);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((Symbol::new(&env, "MarketplacePaused"),), paused);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
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
        if Self::is_paused(env.clone()) {
            panic!("Marketplace is paused");
        }
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
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Emit ListingCreated event
        env.events().publish(
            (Symbol::new(&env, "ListingCreated"), count),
            (seller, farm_id, crop_type, quantity, price_per_unit),
        );

        count
    }

    /// Calculate bulk volume wholesale discount on agricultural lots
    pub fn calculate_discounted_total(
        _env: Env,
        price_per_unit: i128,
        quantity: u32,
    ) -> i128 {
        let raw_total = (quantity as i128)
            .checked_mul(price_per_unit)
            .expect("Overflow");
        if quantity >= 500 {
            raw_total * 90 / 100 // 10% bulk wholesale discount
        } else if quantity >= 100 {
            raw_total * 95 / 100 // 5% tier discount
        } else {
            raw_total
        }
    }

    pub fn purchase_listing(env: Env, buyer: Address, listing_id: u32) -> u32 {
        if Self::is_paused(env.clone()) {
            panic!("Marketplace is paused");
        }
        buyer.require_auth();
        let mut listing = Self::get_listing(env.clone(), listing_id);

        if listing.status != 0 {
            panic!("Listing is not active");
        }
        if listing.seller == buyer {
            panic!("Seller cannot purchase own listing");
        }

        let total_amount = Self::calculate_discounted_total(
            env.clone(),
            listing.price_per_unit,
            listing.quantity,
        );

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
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

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
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    /// Mark stale or perishable produce listings as expired once shelf life elapses
    pub fn expire_listing(env: Env, caller: Address, listing_id: u32, max_shelf_life_days: u32) {
        caller.require_auth();
        let mut listing = Self::get_listing(env.clone(), listing_id);

        if listing.status != 0 {
            panic!("Only active listings can expire");
        }

        let shelf_life_seconds = (max_shelf_life_days as u64) * 86400;
        if env.ledger().timestamp() < listing.created_at + shelf_life_seconds {
            panic!("Listing has not exceeded shelf life");
        }

        listing.status = 3; // Expired
        env.storage()
            .instance()
            .set(&DataKey::Listing(listing_id), &listing);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "ListingExpired"), listing_id),
            caller,
        );
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
