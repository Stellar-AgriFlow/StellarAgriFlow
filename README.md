# AgriFlow: Global Agricultural Financial & Trade Protocol

**Production-grade decentralized agricultural finance, on-chain Farm Passports, marketplace trade, non-custodial escrow, and cross-contract reputation powered by Stellar and Soroban.**

AgriFlow is an institutional-grade Web3 protocol engineered to revolutionize global agricultural commerce. Built directly on the Stellar Network and Soroban smart contract runtime, AgriFlow connects smallholder farmers, regional cooperatives, input vendors, logistics carriers, and commodity buyers through instant, low-cost cross-border payments, verifiable on-chain agricultural identity (Farm Passports), collateralized forward harvest financing, automated escrow settlements, and tamper-proof reputation indexing.

---

## 🌾 The Global Agricultural Problem & Web3 Solution

Agricultural commerce represents over **$1.5 trillion in annual global trade**, yet the physical-to-financial pipeline suffers from structural friction:
- **Banking Settlement Delays**: Cross-border grain remittances routinely take 3 to 7 business days, with correspondent banking fees eroding up to 6–10% of smallholder harvest margins.
- **Under-Collateralized Producers**: Smallholder farmers are routinely excluded from traditional banking because financial institutions lack verifiable digital records of farm acreage, historical yield performance, and repayment credibility.
- **Counterparty & Delivery Risk**: Buyers hesitate to disburse payments before cargo inspection, while farmers risk non-payment once grain leaves the farm gate.

### AgriFlow Protocol Solutions
1. **Stellar High-Speed Settlement**: 3–5 second finality with deterministic 0.00001 XLM base fees.
2. **On-Chain Farm Passports**: Verifiable digital identities registered directly in Soroban contracts with crop, acreage, and expected yield metrics.
3. **Collateralized Agricultural Financing**: Forward harvest capital pools tied to verified Farm Passports.
4. **Non-Custodial Produce Escrow**: Conditional payment release triggered upon physical delivery confirmation.
5. **Smart Reputation Layer**: Tamper-proof on-chain trust scores minted exclusively through successful contract transactions.
6. **Decentralized Event Indexer**: Near real-time indexing of protocol events from Soroban RPC to an embedded persistence database.
7. **External Agricultural Oracle Feeds**: Live commodity reference tickers (Maize, Soybeans, Wheat, Coffee, Cocoa) and regional drought indices.

---

## 🏛️ Deployed Smart Contracts Architecture (Stellar Testnet)

AgriFlow operates a modular, multi-contract architecture where specialized contracts communicate via native Soroban cross-contract invocations.

| Contract | Network | Contract ID | Deployment Tx Hash | Explorer Link |
| :--- | :--- | :--- | :--- | :--- |
| **`FarmRegistry`** | Testnet | `CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ` | `016b501af3eb125c4f713e657046606334c3cc441c9acac555d986a3e2433a8e` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ) |
| **`AgriculturalReputation`** | Testnet | `CBUME23GQVEJ5SWDA7EOTUFOGXSSC2RO5HFTUMXQDQOPWTGOM2YWU65S` | `a392162ebadc0fb44fa013b8d5034b0b2bc590ce71a5e21078767862266f07fc` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CBUME23GQVEJ5SWDA7EOTUFOGXSSC2RO5HFTUMXQDQOPWTGOM2YWU65S) |
| **`AgriculturalEscrow`** | Testnet | `CD72TIQ3LQKJJKQX44UJVF6CT2V6FLELKXQPZ6TZ66KUYLLGUHQI7RHD` | `e8d168e72d248c8a793cecb4f70e58bb3a032967116017a53b8e76f839258abb` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CD72TIQ3LQKJJKQX44UJVF6CT2V6FLELKXQPZ6TZ66KUYLLGUHQI7RHD) |
| **`AgriculturalMarketplace`** | Testnet | `CD4RQ6D36NCTEXG22BPI3VBHZYJMES7CVS5Z7YLP4TJM3BI6IMHTVPF5` | `b0f6a6ad47dcb8e862dffde700a24b2e188c173d193ad3ecd16af6cda453ad82` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CD4RQ6D36NCTEXG22BPI3VBHZYJMES7CVS5Z7YLP4TJM3BI6IMHTVPF5) |
| **`AgriculturalFinance`** | Testnet | `CBRTDNZPZYCKUO7U76DEWV32KAYXZ45JPL2FUPCJIKQIA47BWXZFMBCL` | `575daf41507b5dab8c4905cf34db0c8e00eb048367990a7be76e64b4bd4e5e80` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CBRTDNZPZYCKUO7U76DEWV32KAYXZ45JPL2FUPCJIKQIA47BWXZFMBCL) |

Deployer Account: [`GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU`](https://stellar.expert/explorer/testnet/account/GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU)

---

## 🔗 Cross-Contract Communication Architecture

```text
               +-----------------------------+
               |     FarmRegistry Contract   |
               |  (On-Chain Farm Passports)  |
               +-----------------------------+
                         ^         ^
    validates farm_id    |         | validates farm_id
                         |         |
+------------------------------+ +------------------------------+
| AgriculturalFinance Contract | | AgriculturalMarketplace      |
| - create_financing_request   | | - create_listing             |
| - fund_request               | | - purchase_listing           |
| - record_repayment           | |                              |
+------------------------------+ +------------------------------+
               |                               |
               | calls                         | calls create_escrow
               v                               v
+------------------------------+ +------------------------------+
| AgriculturalReputation       | | AgriculturalEscrow Contract  |
| - record_activity(user, type)| | - fund_escrow                |
| - awards points automatically| | - release_funds              |
+------------------------------+ +------------------------------+
               ^                               |
               | calls record_activity         |
               +-------------------------------+
```

### Inter-Contract Invocations:
1. **Marketplace ➔ Escrow**: When a buyer calls `purchase_listing(buyer, listing_id)`, the Marketplace contract calls `AgriculturalEscrow::create_escrow(buyer, buyer, seller, listing_id, total_amount)` and records the new escrow ID.
2. **Escrow ➔ Reputation**: When delivery is verified and the buyer calls `release_funds(buyer, escrow_id)`, the Escrow contract calls `AgriculturalReputation::record_activity` to award trust points to both seller (`escrow`) and buyer (`trade`).
3. **Finance ➔ FarmRegistry**: Financing request creation verifies that the supplied `farm_id` exists on-chain via `FarmRegistry::has_farm`.
4. **Finance ➔ Reputation**: When loan repayment is finalized, the Finance contract invokes `AgriculturalReputation::record_activity` to grant the farmer a substantial repayment reputation boost (`repay`).

---

## 🔌 Multi-Wallet Support

AgriFlow supports all premier Stellar ecosystem wallets:
- **Freighter**: Official SDF browser extension wallet.
- **xBull**: Multi-platform wallet for Stellar & Soroban.
- **Albedo**: Web-based delegated signing without extension installation.
- **Hana**: Privacy-focused multi-chain wallet with Stellar support.
- **Testnet Account Preview**: Direct live network connection allowing instant testnet account exploration.

---

## 📡 Event Indexer & Database Architecture

Located in `services/event-indexer/`:
- **SorobanEventIndexer**: Connects to `https://soroban-testnet.stellar.org`, queries `getEvents` for monitored contract topics (`FarmRegistered`, `FinancingRequested`, `FinancingFunded`, `RepaymentRecorded`, `ListingCreated`, `ListingPurchased`, `EscrowCreated`, `EscrowFunded`, `EscrowReleased`, `ReputationUpdated`).
- **IndexerDatabase**: File-backed persistent database (`data/indexer.json`) with strict deduplication by transaction hash/ledger sequence.
- **IndexerApiClient**: Query API supporting filtering by wallet address, farm ID, and event type.

---

## 🌐 Agricultural Oracle Architecture

Located in `packages/oracle/`:
- Provides commodity benchmarks (Maize, Soybeans, Wheat, Coffee, Cocoa) in USD and XLM.
- Provides regional agricultural weather and rainfall risk indices (Nakuru Kenya, Kaduna Nigeria, Mato Grosso Brazil, Punjab India, Iowa USA).
- Cleanly labeled as `isExternalData: true` with data source attribution, preserving architectural distinction between off-chain reference indices and immutable on-chain consensus state.

---

## 📦 Monorepo Layout

```text
StellarAgriFlow/
├── apps/
│   └── web/                         # Next.js 14 Web Application
│       ├── src/app/                 # App Router pages and terminal dashboard
│       ├── src/components/          # FarmPassport, Financing, Marketplace, Escrow, Reputation, Oracle, Activity
│       ├── src/context/             # WalletContext (Multi-wallet state machine)
│       └── src/services/            # Wallet adapters (Freighter, xBull, Albedo, Hana)
├── contracts/
│   ├── farm-registry/               # FarmRegistry Soroban contract
│   ├── agricultural-finance/        # AgriculturalFinance contract
│   ├── agricultural-escrow/         # AgriculturalEscrow contract
│   ├── agricultural-marketplace/    # AgriculturalMarketplace contract
│   └── agricultural-reputation/     # AgriculturalReputation contract
├── packages/
│   ├── config/                      # Shared configs & presets
│   ├── contracts-client/            # Soroban RPC clients for all 5 contracts
│   ├── oracle/                      # Commodity & weather oracle feeds
│   ├── stellar/                     # Horizon SDK, balance & reserve engine, address utils
│   ├── types/                       # Domain types (Farm, Finance, Escrow, Marketplace, Reputation, Oracle, Indexer)
│   └── ui/                          # Reusable UI components (Button, Card, Badge, StatusPill)
├── services/
│   └── event-indexer/               # Real-time event indexer & persistence database
├── tests/                           # 54 passing unit and integration tests (Vitest)
│   ├── contracts-client.test.ts     # Client initialization & lifecycle states
│   ├── escrow.test.ts               # Escrow release & refund authorization
│   ├── farm-passport.test.ts        # Farm input validation & boundary checks
│   ├── finance.test.ts              # Loan calculation & status transitions
│   ├── indexer.test.ts              # Event indexing & deduplication
│   ├── marketplace.test.ts          # Produce listing & purchase checks
│   ├── multi-wallet.test.ts         # Multi-wallet registry & adapter factory
│   ├── oracle.test.ts               # Oracle price feeds & weather risk
│   ├── reputation.test.ts           # Trust score formula & tier thresholds
│   ├── validation.test.ts           # Stellar address & payment validations
│   ├── errors.test.ts               # User-friendly error parsing
│   └── wallet-state.test.ts         # Address formatting & Explorer link tests
├── .github/
│   └── workflows/ci.yml             # Matrix CI workflow for all 5 contracts & web app
├── package.json                     # Root manifest
├── pnpm-workspace.yaml              # PNPM workspace definition
└── turbo.json                       # Turborepo task pipeline
```

---

## 🧪 Testing Suite (54 Passing Tests)

### Running Contract Tests (Rust)
```bash
cargo test --manifest-path contracts/farm-registry/Cargo.toml
cargo test --manifest-path contracts/agricultural-reputation/Cargo.toml
cargo test --manifest-path contracts/agricultural-escrow/Cargo.toml
cargo test --manifest-path contracts/agricultural-marketplace/Cargo.toml
cargo test --manifest-path contracts/agricultural-finance/Cargo.toml
```

### Running Frontend & Integration Tests (TypeScript / Vitest)
```bash
pnpm test
```
All 54 tests across 12 test suites execute and pass.

---

## 🚀 Local Development Setup

### 1. Installation
```bash
git clone https://github.com/Stellar-AgriFlow/StellarAgriFlow.git
cd StellarAgriFlow
pnpm install
```

### 2. Environment Setup
Copy `.env.example` into `apps/web/.env.local`:
```bash
cp .env.example apps/web/.env.local
```

### 3. Run Dev Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Review & Protections

1. **Non-Custodial Design**: Private keys, seed phrases, and passwords are never collected, stored, or transmitted.
2. **On-Chain Cryptographic Authorization**: Enforced on-chain via `require_auth()`:
   - Only farm owner can register passport.
   - Only buyer can release escrow funds.
   - Only seller or admin can refund escrow.
   - Only authorized contracts (Escrow, Finance) can award reputation points.
   - Farmers cannot fund their own financing requests.
   - Sellers cannot purchase their own marketplace listings.
3. **No Technical Stack Dumps**: Errors are safely parsed into clean, actionable notifications.

---

## 📄 License

This project is licensed under the Apache 2.0 License.
