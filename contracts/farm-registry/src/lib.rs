#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol,
};

const INSTANCE_BUMP_AMOUNT: u32 = 300_000;
const INSTANCE_LIFETIME_THRESHOLD: u32 = 100_000;

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
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FarmCoordinates {
    pub lat_e6: i32,
    pub lon_e6: i32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FarmCertification {
    pub cert_type: Symbol,
    pub issuer: Address,
    pub issued_at: u64,
    pub expires_at: u64,
}

#[contracttype]
pub enum DataKey {
    Farm(String),
    FarmCount,
    FarmCoordinates(String),
    FarmCertification(String, Symbol),
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
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

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
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Farm(farm_id.clone()), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

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
        env.storage().persistent().set(&DataKey::Farm(farm_id.clone()), &passport);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Farm(farm_id), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        Ok(())
    }

    /// Validates GPS coordinates (latitude in [-90, +90] e6 microdegrees, longitude in [-180, +180] e6 microdegrees)
    pub fn validate_gps_coordinates(_env: Env, lat_e6: i32, lon_e6: i32) -> bool {
        lat_e6 >= -90_000_000 && lat_e6 <= 90_000_000 && lon_e6 >= -180_000_000 && lon_e6 <= 180_000_000
    }

    pub fn set_farm_coordinates(
        env: Env,
        owner: Address,
        farm_id: String,
        lat_e6: i32,
        lon_e6: i32,
    ) -> Result<(), FarmError> {
        owner.require_auth();
        let passport = Self::get_farm(env.clone(), farm_id.clone()).ok_or(FarmError::NotFound)?;
        if passport.owner != owner {
            return Err(FarmError::NotAuthorized);
        }
        if !Self::validate_gps_coordinates(env.clone(), lat_e6, lon_e6) {
            return Err(FarmError::InvalidInput);
        }
        let coords = FarmCoordinates { lat_e6, lon_e6 };
        env.storage().persistent().set(&DataKey::FarmCoordinates(farm_id.clone()), &coords);
        env.storage().persistent().extend_ttl(&DataKey::FarmCoordinates(farm_id.clone()), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.events().publish((Symbol::new(&env, "CoordinatesUpdated"), farm_id), (lat_e6, lon_e6));
        Ok(())
    }

    pub fn get_farm_coordinates(env: Env, farm_id: String) -> Option<FarmCoordinates> {
        env.storage().persistent().get(&DataKey::FarmCoordinates(farm_id))
    }

    pub fn add_certification(
        env: Env,
        issuer: Address,
        farm_id: String,
        cert_type: Symbol,
        duration_days: u32,
    ) -> Result<(), FarmError> {
        issuer.require_auth();
        if !Self::has_farm(env.clone(), farm_id.clone()) {
            return Err(FarmError::NotFound);
        }
        if duration_days == 0 {
            return Err(FarmError::InvalidInput);
        }

        let now = env.ledger().timestamp();
        let expires_at = now + (duration_days as u64) * 86400;

        let cert = FarmCertification {
            cert_type: cert_type.clone(),
            issuer: issuer.clone(),
            issued_at: now,
            expires_at,
        };

        env.storage()
            .persistent()
            .set(&DataKey::FarmCertification(farm_id.clone(), cert_type.clone()), &cert);
        env.storage().persistent().extend_ttl(
            &DataKey::FarmCertification(farm_id.clone(), cert_type.clone()),
            INSTANCE_LIFETIME_THRESHOLD,
            INSTANCE_BUMP_AMOUNT,
        );

        env.events().publish(
            (Symbol::new(&env, "CertificationAdded"), farm_id),
            (cert_type, issuer, expires_at),
        );

        Ok(())
    }

    pub fn has_valid_certification(env: Env, farm_id: String, cert_type: Symbol) -> bool {
        if let Some(cert) = env
            .storage()
            .persistent()
            .get::<DataKey, FarmCertification>(&DataKey::FarmCertification(farm_id, cert_type))
        {
            env.ledger().timestamp() < cert.expires_at
        } else {
            false
        }
    }

    pub fn get_certification(env: Env, farm_id: String, cert_type: Symbol) -> Option<FarmCertification> {
        env.storage().persistent().get(&DataKey::FarmCertification(farm_id, cert_type))
    }

    pub fn update_yield_forecast(
        env: Env,
        owner: Address,
        farm_id: String,
        new_crop: String,
        new_expected_yield_tons: u32,
    ) -> Result<(), FarmError> {
        owner.require_auth();
        if new_expected_yield_tons == 0 {
            return Err(FarmError::InvalidInput);
        }

        let mut passport: FarmPassport = env
            .storage()
            .persistent()
            .get(&DataKey::Farm(farm_id.clone()))
            .ok_or(FarmError::NotFound)?;

        if passport.owner != owner {
            return Err(FarmError::NotAuthorized);
        }

        passport.crop = new_crop.clone();
        passport.expected_yield_tons = new_expected_yield_tons;

        env.storage().persistent().set(&DataKey::Farm(farm_id.clone()), &passport);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Farm(farm_id.clone()), INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "YieldForecastUpdated"), farm_id),
            (new_crop, new_expected_yield_tons),
        );

        Ok(())
    }
}

#[cfg(test)]
mod test;
