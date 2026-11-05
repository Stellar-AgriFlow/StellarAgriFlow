#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReceiptError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ReceiptNotFound = 4,
    ReceiptAlreadyPledged = 5,
    ReceiptNotPledged = 6,
    ReceiptAlreadyRedeemed = 7,
    InvalidMetrics = 8,
    ContractPaused = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WarehouseReceipt {
    pub receipt_id: u32,
    pub owner: Address,
    pub warehouse_id: Symbol,
    pub commodity: Symbol,
    pub quantity_kg: u64,
    pub grade: Symbol,            // e.g. "Grade1", "Grade2"
    pub moisture_percent_e2: u32, // e.g. 1350 for 13.50%
    pub harvest_year: u32,
    pub is_pledged: bool,
    pub pledgee: Option<Address>,
    pub is_redeemed: bool,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Custodians,
    ReceiptCount,
    Receipt(u32),
    Paused,
    OwnerReceipts(Address),
}

#[contract]
pub struct WarehouseReceiptContract;

#[contractimpl]
impl WarehouseReceiptContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReceiptError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReceiptError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        let empty_custodians: Vec<Address> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::Custodians, &empty_custodians);
        env.storage().instance().set(&DataKey::ReceiptCount, &0u32);
        env.storage().instance().set(&DataKey::Paused, &false);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((symbol_short!("r_init"),), admin);
        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, ReceiptError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReceiptError::NotInitialized)
    }

    pub fn get_receipt_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ReceiptCount)
            .unwrap_or(0)
    }

    /// Authorize a licensed warehouse custodian / grain elevator operator
    pub fn add_custodian(env: Env, admin: Address, custodian: Address) -> Result<(), ReceiptError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReceiptError::NotInitialized)?;
        stored_admin.require_auth();
        if admin != stored_admin {
            return Err(ReceiptError::Unauthorized);
        }

        let mut custodians: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Custodians)
            .unwrap_or(Vec::new(&env));

        for c in custodians.iter() {
            if c == custodian {
                return Ok(());
            }
        }

        custodians.push_back(custodian.clone());
        env.storage()
            .instance()
            .set(&DataKey::Custodians, &custodians);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events()
            .publish((symbol_short!("cust_add"),), custodian);
        Ok(())
    }

    /// Remove a licensed warehouse custodian
    pub fn remove_custodian(
        env: Env,
        admin: Address,
        custodian: Address,
    ) -> Result<(), ReceiptError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReceiptError::NotInitialized)?;
        stored_admin.require_auth();
        if admin != stored_admin {
            return Err(ReceiptError::Unauthorized);
        }

        let custodians: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Custodians)
            .unwrap_or(Vec::new(&env));

        let mut updated: Vec<Address> = Vec::new(&env);
        for c in custodians.iter() {
            if c != custodian {
                updated.push_back(c);
            }
        }

        env.storage().instance().set(&DataKey::Custodians, &updated);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((symbol_short!("cust_rm"),), custodian);
        Ok(())
    }

    /// Check if an address is an authorized custodian
    pub fn is_custodian(env: Env, address: Address) -> bool {
        let custodians: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Custodians)
            .unwrap_or(Vec::new(&env));
        for c in custodians.iter() {
            if c == address {
                return true;
            }
        }
        false
    }

    /// Returns the total number of authorized warehouse custodians
    pub fn get_custodians_count(env: Env) -> u32 {
        let custodians: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Custodians)
            .unwrap_or(Vec::new(&env));
        custodians.len()
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), ReceiptError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReceiptError::NotInitialized)?;
        stored_admin.require_auth();
        if admin != stored_admin {
            return Err(ReceiptError::Unauthorized);
        }

        env.storage().instance().set(&DataKey::Paused, &paused);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish((symbol_short!("r_pause"),), paused);
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Verify physical grain quality compliance against international grain storage standards
    pub fn validate_grain_quality(env: Env, moisture_percent_e2: u32, grade: Symbol) -> bool {
        if moisture_percent_e2 > 1600 {
            return false;
        }
        let g1 = Symbol::new(&env, "Grade1");
        let g2 = Symbol::new(&env, "Grade2");
        let g3 = Symbol::new(&env, "Grade3");

        if grade == g1 {
            moisture_percent_e2 <= 1350
        } else if grade == g2 {
            moisture_percent_e2 <= 1450
        } else if grade == g3 {
            moisture_percent_e2 <= 1600
        } else {
            false
        }
    }

    /// Mint a tokenized Electronic Negotiable Warehouse Receipt (e-NWR) for physical deposited commodities
    pub fn mint_receipt(
        env: Env,
        custodian: Address,
        farmer: Address,
        warehouse_id: Symbol,
        commodity: Symbol,
        quantity_kg: u64,
        grade: Symbol,
        moisture_percent_e2: u32,
        harvest_year: u32,
    ) -> Result<u32, ReceiptError> {
        custodian.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(ReceiptError::ContractPaused);
        }
        if !Self::is_custodian(env.clone(), custodian.clone()) {
            return Err(ReceiptError::Unauthorized);
        }
        if quantity_kg == 0 || moisture_percent_e2 > 3500 {
            // Moisture > 35.00% is physically unacceptable for grain storage
            return Err(ReceiptError::InvalidMetrics);
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReceiptCount)
            .unwrap_or(0);
        count += 1;

        let receipt = WarehouseReceipt {
            receipt_id: count,
            owner: farmer.clone(),
            warehouse_id: warehouse_id.clone(),
            commodity: commodity.clone(),
            quantity_kg,
            grade: grade.clone(),
            moisture_percent_e2,
            harvest_year,
            is_pledged: false,
            pledgee: None,
            is_redeemed: false,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Receipt(count), &receipt);
        env.storage().instance().set(&DataKey::ReceiptCount, &count);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(
            &DataKey::Receipt(count),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        let mut owner_receipt_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerReceipts(farmer.clone()))
            .unwrap_or(Vec::new(&env));
        owner_receipt_ids.push_back(count);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerReceipts(farmer.clone()), &owner_receipt_ids);
        env.storage().persistent().extend_ttl(
            &DataKey::OwnerReceipts(farmer.clone()),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events().publish(
            (symbol_short!("r_mint"), count),
            (farmer, commodity, quantity_kg),
        );

        Ok(count)
    }

    /// Retrieve an existing warehouse receipt by ID
    pub fn get_receipt(env: Env, receipt_id: u32) -> Result<WarehouseReceipt, ReceiptError> {
        env.storage()
            .persistent()
            .get(&DataKey::Receipt(receipt_id))
            .ok_or(ReceiptError::ReceiptNotFound)
    }

    /// Lock warehouse receipt as collateral backing a loan or credit line
    pub fn pledge_as_collateral(
        env: Env,
        owner: Address,
        receipt_id: u32,
        pledgee: Address,
    ) -> Result<(), ReceiptError> {
        owner.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(ReceiptError::ContractPaused);
        }
        let mut receipt = Self::get_receipt(env.clone(), receipt_id)?;

        if receipt.owner != owner {
            return Err(ReceiptError::Unauthorized);
        }
        if receipt.is_pledged {
            return Err(ReceiptError::ReceiptAlreadyPledged);
        }
        if receipt.is_redeemed {
            return Err(ReceiptError::ReceiptAlreadyRedeemed);
        }

        receipt.is_pledged = true;
        receipt.pledgee = Some(pledgee.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Receipt(receipt_id), &receipt);
        env.storage().persistent().extend_ttl(
            &DataKey::Receipt(receipt_id),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events()
            .publish((symbol_short!("r_pledge"), receipt_id), (owner, pledgee));
        Ok(())
    }

    /// Release lien from warehouse receipt upon loan repayment (only pledgee can release)
    pub fn unpledge_collateral(
        env: Env,
        pledgee: Address,
        receipt_id: u32,
    ) -> Result<(), ReceiptError> {
        pledgee.require_auth();
        let mut receipt = Self::get_receipt(env.clone(), receipt_id)?;

        if receipt.pledgee != Some(pledgee.clone()) {
            return Err(ReceiptError::Unauthorized);
        }
        if !receipt.is_pledged {
            return Err(ReceiptError::ReceiptNotPledged);
        }

        receipt.is_pledged = false;
        receipt.pledgee = None;

        env.storage()
            .persistent()
            .set(&DataKey::Receipt(receipt_id), &receipt);
        env.storage().persistent().extend_ttl(
            &DataKey::Receipt(receipt_id),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events()
            .publish((symbol_short!("r_unpld"), receipt_id), pledgee);
        Ok(())
    }

    /// Redeem and burn receipt for physical grain collection at the warehouse
    pub fn burn_receipt_for_redemption(
        env: Env,
        custodian: Address,
        receipt_id: u32,
    ) -> Result<(), ReceiptError> {
        custodian.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(ReceiptError::ContractPaused);
        }
        if !Self::is_custodian(env.clone(), custodian.clone()) {
            return Err(ReceiptError::Unauthorized);
        }

        let mut receipt = Self::get_receipt(env.clone(), receipt_id)?;
        if receipt.is_pledged {
            return Err(ReceiptError::ReceiptAlreadyPledged);
        }
        if receipt.is_redeemed {
            return Err(ReceiptError::ReceiptAlreadyRedeemed);
        }

        receipt.is_redeemed = true;

        env.storage()
            .persistent()
            .set(&DataKey::Receipt(receipt_id), &receipt);
        env.storage().persistent().extend_ttl(
            &DataKey::Receipt(receipt_id),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events().publish(
            (symbol_short!("r_redeem"), receipt_id),
            (receipt.owner, custodian, receipt.quantity_kg),
        );
        Ok(())
    }

    /// Transfer negotiable warehouse receipt ownership to another party
    pub fn transfer_receipt(
        env: Env,
        current_owner: Address,
        receipt_id: u32,
        new_owner: Address,
    ) -> Result<(), ReceiptError> {
        current_owner.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(ReceiptError::ContractPaused);
        }
        let mut receipt = Self::get_receipt(env.clone(), receipt_id)?;

        if receipt.owner != current_owner {
            return Err(ReceiptError::Unauthorized);
        }
        if receipt.is_pledged {
            return Err(ReceiptError::ReceiptAlreadyPledged);
        }
        if receipt.is_redeemed {
            return Err(ReceiptError::ReceiptAlreadyRedeemed);
        }

        let previous_owner = receipt.owner.clone();
        receipt.owner = new_owner.clone();

        env.storage()
            .persistent()
            .set(&DataKey::Receipt(receipt_id), &receipt);
        env.storage().persistent().extend_ttl(
            &DataKey::Receipt(receipt_id),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        // Update secondary index: remove from previous owner and add to new owner
        let prev_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerReceipts(previous_owner.clone()))
            .unwrap_or(Vec::new(&env));
        let mut updated_prev: Vec<u32> = Vec::new(&env);
        for id in prev_ids.iter() {
            if id != receipt_id {
                updated_prev.push_back(id);
            }
        }
        env.storage()
            .persistent()
            .set(&DataKey::OwnerReceipts(previous_owner.clone()), &updated_prev);

        let mut new_ids: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerReceipts(new_owner.clone()))
            .unwrap_or(Vec::new(&env));
        new_ids.push_back(receipt_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerReceipts(new_owner.clone()), &new_ids);
        env.storage().persistent().extend_ttl(
            &DataKey::OwnerReceipts(new_owner.clone()),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events().publish(
            (symbol_short!("r_trans"), receipt_id),
            (previous_owner, new_owner),
        );
        Ok(())
    }

    /// Retrieve all warehouse receipts belonging to a specific owner in O(k) bounded reads
    pub fn get_receipts_by_owner(env: Env, owner: Address) -> Vec<WarehouseReceipt> {
        let mut user_receipts: Vec<WarehouseReceipt> = Vec::new(&env);
        if let Some(ids) = env
            .storage()
            .persistent()
            .get::<DataKey, Vec<u32>>(&DataKey::OwnerReceipts(owner.clone()))
        {
            for id in ids.iter() {
                if let Ok(receipt) = Self::get_receipt(env.clone(), id) {
                    if receipt.owner == owner {
                        user_receipts.push_back(receipt);
                    }
                }
            }
        } else {
            let count = Self::get_receipt_count(env.clone());
            for id in 1..=count {
                if let Ok(receipt) = Self::get_receipt(env.clone(), id) {
                    if receipt.owner == owner {
                        user_receipts.push_back(receipt);
                    }
                }
            }
        }
        user_receipts
    }
}

#[cfg(test)]
mod test;
