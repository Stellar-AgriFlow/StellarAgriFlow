# Stellar-AgriFlow Security Model & Threat Mitigation

## 1. Access Control Matrix

| Contract | Function | Authorized Role | Enforcement Mechanism |
|---|---|---|---|
| `warehouse-receipt` | `mint_receipt` | Licensed Custodian | `is_authorized_custodian()` check |
| `warehouse-receipt` | `burn_for_redemption` | Receipt Owner | `require_auth()` signature check |
| `agricultural-escrow` | `approve_inspection` | Certified Inspector | Inspector key verification |
| `agricultural-escrow` | `release_funds` | Buyer or Escrow Arbiter | `require_auth()` signature check |
| `agricultural-finance` | `set_paused` | Admin Multig | Admin key match |
| `parametric-insurance` | `trigger_policy_payout` | Any Caller / Relayer | Cross-contract oracle verification |

## 2. Circuit Breakers & Emergency Pause

All contracts implement emergency pause controls:
- In the event of an anomalous market condition, compromised oracle, or contract exploit, the admin can pause state-modifying operations (`create_listing`, `apply_loan`, `mint_receipt`, `purchase_policy`).
- Unfunded escrows and unencumbered receipts can always be cancelled or reclaimed safely even during a pause.

## 3. Reentrancy & Front-Running Protection

- Soroban smart contracts execute sequentially with deterministic ledger commits, eliminating standard EVM mempool sandwich attacks.
- Price feeds utilize Time-Weighted Average Pricing (TWAP) and multi-reporter median consensus to defeat single-block spot price manipulation.
- Collateral pledging irrevocably locks RWA receipts at the contract storage layer to prevent double-spending collateral across multiple lenders.
