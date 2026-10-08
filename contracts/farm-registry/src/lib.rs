#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FarmError {
    AlreadyExists = 1,
    NotFound = 2,
    NotAuthorized = 3,
    InvalidInput = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FarmStatus {
    Active,
    PendingVerification,
    Suspended,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FarmPassport {
    pub farm_id: String,
    pub owner: Address,
    pub country: String,
    pub region: String,
    pub crop: String,
    pub farm_size_hectares: u32,
    pub expected_yield_tons: u32,
    pub registration_timestamp: u64,
    pub status: FarmStatus,
}

#[contracttype]
pub enum DataKey {
    Farm(String),
    FarmCount,
}

fn format_farm_id(env: &Env, count: u32) -> String {
    let mut buf = [b'A', b'G', b'R', b'I', b'-', b'0', b'0', b'0', b'0', b'0', b'0'];
    let mut val = count;
    for i in (5..11).rev() {
        buf[i] = b'0' + ((val % 10) as u8);
        val /= 10;
    }
    let s = core::str::from_utf8(&buf).unwrap();
    String::from_str(env, s)
}

#[contract]
pub struct FarmRegistryContract;

#[contractimpl]
impl FarmRegistryContract {
    /// Registers a new agricultural Farm Passport on-chain.
    /// Emits a `FarmRegistered` event upon successful creation.
    pub fn register_farm(
        env: Env,
        owner: Address,
        country: String,
        region: String,
        crop: String,
        farm_size_hectares: u32,
        expected_yield_tons: u32,
    ) -> Result<String, FarmError> {
        // Enforce owner signature authorization
        owner.require_auth();

        // Validate agricultural metrics
        if farm_size_hectares == 0 || expected_yield_tons == 0 {
            return Err(FarmError::InvalidInput);
        }

        // Get sequential counter
        let mut count: u32 = env.storage().instance().get(&DataKey::FarmCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::FarmCount, &count);

        let farm_id = format_farm_id(&env, count);
        let timestamp = env.ledger().timestamp();

        let passport = FarmPassport {
            farm_id: farm_id.clone(),
            owner: owner.clone(),
            country: country.clone(),
            region: region.clone(),
            crop: crop.clone(),
            farm_size_hectares,
            expected_yield_tons,
            registration_timestamp: timestamp,
            status: FarmStatus::Active,
        };

        // Persist on-chain
        env.storage().persistent().set(&DataKey::Farm(farm_id.clone()), &passport);

        // Emit real Soroban contract event
        env.events().publish(
            (
                Symbol::new(&env, "FarmRegistered"),
                owner.clone(),
                farm_id.clone(),
            ),
            (crop, country),
        );

        Ok(farm_id)
    }

    /// Retrieves an existing Farm Passport by its unique Farm ID.
    pub fn get_farm(env: Env, farm_id: String) -> Option<FarmPassport> {
        env.storage().persistent().get(&DataKey::Farm(farm_id))
    }

    /// Verifies if a given Farm ID exists in storage.
    pub fn has_farm(env: Env, farm_id: String) -> bool {
        env.storage().persistent().has(&DataKey::Farm(farm_id))
    }

    /// Returns the total number of registered farms.
    pub fn get_farm_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FarmCount).unwrap_or(0)
    }

    /// Updates the status of an existing Farm Passport (only owner can modify).
    pub fn update_farm_status(
        env: Env,
        owner: Address,
        farm_id: String,
        new_status: FarmStatus,
    ) -> Result<(), FarmError> {
        owner.require_auth();

        let mut passport: FarmPassport = env
            .storage()
            .persistent()
            .get(&DataKey::Farm(farm_id.clone()))
            .ok_or(FarmError::NotFound)?;

        if passport.owner != owner {
            return Err(FarmError::NotAuthorized);
        }

        passport.status = new_status;
        env.storage().persistent().set(&DataKey::Farm(farm_id), &passport);

        Ok(())
    }
}

#[cfg(test)]
mod test;
