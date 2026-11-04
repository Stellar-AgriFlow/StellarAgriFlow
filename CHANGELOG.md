# Changelog

All notable changes to the **StellarAgriFlow** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-11-04

### Added
- **Smart Contracts (Soroban v22 Rust)**:
  - `agricultural-finance`: Dynamic restructuring under climate distress, SEP-41 token validation, emergency pausability, and native Soroban events (`LoanRequested`, `LoanFunded`, `LoanRepaid`).
  - `agricultural-escrow`: Dual-signatory buyer/inspector clearance, timelocked dispute resolution fallback, and native event logging (`EscrowCreated`, `InspectionApproved`, `FundsReleased`).
  - `farm-registry`: GPS GeoJSON bounding box spatial validation, verifiable agricultural certification badges (GlobalGAP, Organic, FairTrade), and profile event streams.
  - `agricultural-marketplace`: Direct token escrow locking on order creation, volume-tiered wholesale discounting rules, and trade events (`ListingCreated`, `ListingFilled`).
  - `agricultural-reputation`: Non-linear credit decay formula based on historical repayment velocity, default recording, and milestone rewards.
  - `warehouse-receipt`: Electronic Negotiable Warehouse Receipt (eNWR) standard tokenizing real-world stored grain with grade, moisture, and warehouse operator attestations.
  - `parametric-insurance`: Underwriting capital liquidity pool supporting automated programmatic drought and flood disbursements with zero claims paperwork.
  - `collateral-liquidation`: Dutch auction mechanism for defaulted loan collateral recovery with minimum reserve floor pricing.
  - `cooperative-vault`: Democratic member share allocation, quadratic voting quorum evaluation, and proportional dividend distributions.
- **Backend & Relayer Services**:
  - Offline event indexer with persistent SQLite and PostgreSQL caching engines.
  - Stellar Anchor bridging protocols: SEP-10 WebAuth, SEP-24 Hosted Deposit/Withdrawal, and SEP-38 Cross-Asset Quotes for local fiat ramps (NGN, KES, ZAR).
  - Multi-reporter consensus engine with Median Absolute Deviation (MAD) outlier filtering and EWMA volatility tracking.
  - Automated Soroban Storage TTL auto-bump manager programmatically extending persistent state by 300,000 ledgers.
- **Frontend & Web Applications (`apps/web`)**:
  - Next.js 14 dashboards with Freighter, xBull, Albedo, Hana, and WebAuthn Passkey multi-wallet authentication.
  - Real-World Asset (RWA) Warehouse Receipt Minting, Pledging, and Redemption Modals.
  - Parametric Insurance Underwriting Vault and Policy cards with interactive drought risk gauges.
  - Dutch Auction liquidation cards with dynamic linear price decay visualization.
  - Live real-time Soroban RPC event stream ticker and notification center.
  - Solvency Proof-of-Reserve banner with on-chain cryptographic asset/liability verification.
  - Cooperative governance portal: Proposal creation, quadratic voting cards, and emergency freeze controls.
  - Carbon credit offset certificate badges with tokenized retirement burns.
- **Codebase & Tooling**:
  - Strongly typed TypeScript client SDKs (`@agriflow/contracts-client`, `@agriflow/stellar`, `@agriflow/types`).
  - Unified Zod schema validation across backend and frontend boundaries.
  - Multi-auth authorization entry signers for atomic multi-party Soroban transactions.
  - Transaction fee and Soroban CPU/memory resource simulator.
  - 79 automated test suites with 245 unit and integration tests passing at 100%.
- **General, Infrastructure & Standards**:
  - Published Stellar SEP-0001 `stellar.toml` metadata specification.
  - Docker Compose microservices stack for multi-service local testing.
  - Automated GitHub Actions CI/CD workflows for Soroban contracts, TypeScript packages, Next.js build, and security audits (`.github/workflows/security-audit.yml`).
  - Comprehensive documentation: Architecture specification, Security threat model, Deployment playbook, and RWA warehouse standards.

### Fixed
- Resolved Next.js build compilation by configuring webpack fallback for `crypto: false` and abstracting universal SHA-256 / WebCrypto hashing.
- Fixed TypeScript type exports in `@agriflow/types` (`MintReceiptParams`, `RedeemReceiptParams`, `ParametricPolicy`, `WarehouseReceipt`).
- Aligned `BaseSorobanClient`, `ParametricInsuranceClient`, and `WarehouseReceiptClient` method implementations with `apps/web` service layers.
- Resolved CrossChainBridgeAdapter transfer prefix matching and state transition validations.
- Completed PasskeySigner WebAuthn payload encoding helpers and ASN.1 DER signature parsing.
- Aligned `advancedTxBuilder.ts` base fee type accepting `string | number`.
