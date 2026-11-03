#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum LiquidationError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    ContractPaused = 3,
    Unauthorized = 4,
    InvalidAuctionParameters = 5,
    AuctionNotFound = 6,
    AuctionNotActive = 7,
    AuctionExpired = 8,
    InsufficientPayment = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AuctionStatus {
    Active = 1,
    Filled = 2,
    Expired = 3,
    Cancelled = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CollateralAuction {
    pub id: u64,
    pub borrower: Address,
    pub receipt_id: u64,
    pub debt_amount: i128,
    pub start_price: i128,
    pub reserve_price: i128,
    pub start_time: u64,
    pub duration_seconds: u64,
    pub status: AuctionStatus,
    pub buyer: Option<Address>,
    pub final_price: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    AuctionCount,
    Auction(u64),
}


#[contract]
pub struct CollateralLiquidationContract;

#[contractimpl]
impl CollateralLiquidationContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), LiquidationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(LiquidationError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::AuctionCount, &0u64);

        Ok(())
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), LiquidationError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(LiquidationError::NotInitialized)?;

        if admin != stored_admin {
            return Err(LiquidationError::Unauthorized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    pub fn start_auction(
        env: Env,
        caller: Address,
        borrower: Address,
        receipt_id: u64,
        debt_amount: i128,
        start_price: i128,
        reserve_price: i128,
        duration_seconds: u64,
    ) -> Result<u64, LiquidationError> {
        caller.require_auth();

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            return Err(LiquidationError::ContractPaused);
        }

        if start_price <= 0
            || reserve_price <= 0
            || start_price <= reserve_price
            || debt_amount <= 0
            || duration_seconds == 0
        {
            return Err(LiquidationError::InvalidAuctionParameters);
        }

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0);
        count += 1;

        let current_time = env.ledger().timestamp();

        let auction = CollateralAuction {
            id: count,
            borrower,
            receipt_id,
            debt_amount,
            start_price,
            reserve_price,
            start_time: current_time,
            duration_seconds,
            status: AuctionStatus::Active,
            buyer: None,
            final_price: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::Auction(count), &auction);
        env.storage().instance().set(&DataKey::AuctionCount, &count);

        env.events().publish(
            (symbol_short!("auction"), symbol_short!("started")),
            count,
        );

        Ok(count)
    }

    pub fn get_current_price(env: Env, auction_id: u64) -> Result<i128, LiquidationError> {
        let auction: CollateralAuction = env
            .storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .ok_or(LiquidationError::AuctionNotFound)?;

        if auction.status != AuctionStatus::Active {
            return Ok(auction.final_price);
        }

        let current_time = env.ledger().timestamp();
        let elapsed = current_time.saturating_sub(auction.start_time);

        if elapsed >= auction.duration_seconds {
            return Ok(auction.reserve_price);
        }

        let price_diff = auction.start_price - auction.reserve_price;
        let decay = (price_diff * (elapsed as i128)) / (auction.duration_seconds as i128);
        let current_price = auction.start_price - decay;

        Ok(current_price.max(auction.reserve_price))
    }

    pub fn buy_collateral(
        env: Env,
        buyer: Address,
        auction_id: u64,
        payment_amount: i128,
    ) -> Result<(i128, i128), LiquidationError> {
        buyer.require_auth();

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            return Err(LiquidationError::ContractPaused);
        }

        let mut auction: CollateralAuction = env
            .storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .ok_or(LiquidationError::AuctionNotFound)?;

        if auction.status != AuctionStatus::Active {
            return Err(LiquidationError::AuctionNotActive);
        }

        let current_time = env.ledger().timestamp();
        if current_time > auction.start_time + auction.duration_seconds {
            auction.status = AuctionStatus::Expired;
            env.storage()
                .instance()
                .set(&DataKey::Auction(auction_id), &auction);
            return Err(LiquidationError::AuctionExpired);
        }

        let current_price = Self::get_current_price(env.clone(), auction_id)?;
        if payment_amount < current_price {
            return Err(LiquidationError::InsufficientPayment);
        }

        let debt_recovered = current_price.min(auction.debt_amount);
        let surplus_refund = current_price.saturating_sub(auction.debt_amount);

        auction.status = AuctionStatus::Filled;
        auction.buyer = Some(buyer);
        auction.final_price = current_price;

        env.storage()
            .instance()
            .set(&DataKey::Auction(auction_id), &auction);

        env.events().publish(
            (symbol_short!("auction"), symbol_short!("filled")),
            (auction_id, current_price),
        );

        Ok((debt_recovered, surplus_refund))
    }

    pub fn cancel_auction(
        env: Env,
        admin: Address,
        auction_id: u64,
    ) -> Result<(), LiquidationError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(LiquidationError::NotInitialized)?;

        if admin != stored_admin {
            return Err(LiquidationError::Unauthorized);
        }
        admin.require_auth();

        let mut auction: CollateralAuction = env
            .storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .ok_or(LiquidationError::AuctionNotFound)?;

        if auction.status != AuctionStatus::Active {
            return Err(LiquidationError::AuctionNotActive);
        }

        auction.status = AuctionStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::Auction(auction_id), &auction);

        env.events().publish(
            (symbol_short!("auction"), symbol_short!("cancel")),
            auction_id,
        );

        Ok(())
    }

    pub fn calculate_proceeds_distribution(
        env: Env,
        auction_id: u64,
        settlement_price: i128,
    ) -> Result<(i128, i128), LiquidationError> {
        let auction: CollateralAuction = env
            .storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .ok_or(LiquidationError::AuctionNotFound)?;

        let debt_recovered = settlement_price.min(auction.debt_amount);
        let surplus_refund = settlement_price.saturating_sub(auction.debt_amount);

        Ok((debt_recovered, surplus_refund))
    }

    pub fn get_auction(env: Env, auction_id: u64) -> Result<CollateralAuction, LiquidationError> {
        env.storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .ok_or(LiquidationError::AuctionNotFound)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger as _};
    use soroban_sdk::Env;

    #[test]
    fn test_dutch_auction_lifecycle_and_bidding() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1000);

        let contract_id = env.register(CollateralLiquidationContract, ());
        let client = CollateralLiquidationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let borrower = Address::generate(&env);
        let buyer = Address::generate(&env);

        client.initialize(&admin);

        // Start auction: start_price = 10,000, reserve_price = 6,000, debt = 7,000, duration = 1000s
        let auction_id = client.start_auction(
            &admin,
            &borrower,
            &101u64,
            &7000i128,
            &10000i128,
            &6000i128,
            &1000u64,
        );

        assert_eq!(auction_id, 1);

        // Price at start (elapsed = 0)
        let price_start = client.get_current_price(&auction_id);
        assert_eq!(price_start, 10000);

        // Advance time to 500s (halfway through auction)
        env.ledger().set_timestamp(1500);
        let price_mid = client.get_current_price(&auction_id);
        // decay = (10,000 - 6,000) * 500 / 1000 = 2,000 => price = 8,000
        assert_eq!(price_mid, 8000);

        // Buyer purchases at midpoint price (8,000)
        // Debt = 7,000 => debt_recovered = 7,000, surplus_refund = 1,000
        let (debt_recovered, surplus) = client.buy_collateral(&buyer, &auction_id, &8000i128);
        assert_eq!(debt_recovered, 7000);
        assert_eq!(surplus, 1000);

        let final_auction = client.get_auction(&auction_id);
        assert_eq!(final_auction.status, AuctionStatus::Filled);
        assert_eq!(final_auction.final_price, 8000);
    }

    #[test]
    fn test_auction_pause_circuit_breaker() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CollateralLiquidationContract, ());
        let client = CollateralLiquidationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let borrower = Address::generate(&env);

        client.initialize(&admin);
        client.set_paused(&admin, &true);

        let res = client.try_start_auction(
            &admin,
            &borrower,
            &102u64,
            &5000i128,
            &8000i128,
            &4000i128,
            &500u64,
        );
        assert!(res.is_err());
    }

    #[test]
    fn test_cancel_auction() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CollateralLiquidationContract, ());
        let client = CollateralLiquidationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let borrower = Address::generate(&env);

        client.initialize(&admin);
        let auction_id = client.start_auction(
            &admin,
            &borrower,
            &103u64,
            &4000i128,
            &6000i128,
            &3000i128,
            &600u64,
        );

        client.cancel_auction(&admin, &auction_id);
        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.status, AuctionStatus::Cancelled);
    }
}
