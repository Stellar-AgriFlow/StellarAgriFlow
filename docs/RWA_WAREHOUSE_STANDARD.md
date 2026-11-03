# Electronic Negotiable Warehouse Receipt (e-NWR) Standard on Stellar

## Abstract
This document defines the **AgriFlow e-NWR Real-World Asset (RWA) Standard**, a Soroban-based standard for tokenizing physical agricultural commodities deposited in certified custodial warehouses.

## Lifecycle State Machine

```
   [Physical Crop Deposit]
              |
              v (Quality & Moisture Check <= 14.0%)
         +----------+
         |  ACTIVE  | <---------------------------+
         +----------+                             |
            |      \                              |
 (Pledge as |       \ (Transfer Ownership)        | (Loan Repaid /
 Collateral)|        \                            |  Lien Released)
            v         v                           |
       +---------+  [New Owner]                   |
       | PLEDGED | -------------------------------+
       +---------+
            |
            | (Physical Delivery Pickup)
            v
       +----------+
       | REDEEMED | (Token Burned)
       +----------+
```

## Contract Interface

### Mint Receipt
```rust
pub fn mint_receipt(
    env: Env,
    custodian: Address,
    owner: Address,
    commodity_type: Symbol,
    quantity_kg: u64,
    quality_grade: u32,
    moisture_percent: u32,
) -> Result<u64, WarehouseError>;
```
- **Validation**: `moisture_percent <= 1400` basis points (14.0%).
- **Authorization**: Caller must be a licensed warehouse custodian registered in the contract.

### Pledge as Collateral
```rust
pub fn pledge_receipt(
    env: Env,
    owner: Address,
    receipt_id: u64,
    loan_contract: Address,
) -> Result<(), WarehouseError>;
```
- Restricts transfers while encumbered under an active loan.

### Redeem and Burn
```rust
pub fn burn_for_redemption(
    env: Env,
    owner: Address,
    receipt_id: u64,
) -> Result<(), WarehouseError>;
```
- Permanently updates receipt status to `Redeemed`, invalidating future transfers and releasing warehouse storage.
