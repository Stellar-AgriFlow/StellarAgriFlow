# AgriFlow: Global Agricultural Financial & Trade Protocol

**Decentralized agricultural finance, on-chain Farm Passports, and global trade settlement powered by Stellar & Soroban.**

AgriFlow is a production-grade Web3 financial and trade protocol engineered specifically for global agriculture. Built directly on the Stellar Network and Soroban smart contract environment, AgriFlow connects smallholder farmers, agricultural cooperatives, input distributors, logistics providers, and institutional commodity buyers through instant, low-cost cross-border payments, verifiable on-chain agricultural identity (Farm Passports), and real-time blockchain event indexing.

---

## 🌾 The Global Agricultural Use Case

Agricultural trade represents over **$1.5 trillion in annual global commerce**, yet regional agricultural supply chains suffer from severe systemic frictions:
- **Remittance Delays & High Fees**: Cross-border payments between grain traders, processors, and farmers routinely take 3 to 7 business days, with correspondent banking fees eroding up to 6–10% of smallholder harvest revenue.
- **Lack of Verifiable Agricultural Identity**: Smallholder farmers frequently cannot access fair working capital, input financing, or insurance because commercial banks lack verifiable records of farm size, historical crop yields, and operational status.
- **Counterparty & Settlement Risk**: Buyers fear paying upfront before produce arrives, while farmers fear shipping grain without guaranteed payment.

**AgriFlow solves this on Stellar**:
1. **Instant, Sub-Cent Disbursements**: Settles payments in 3–5 seconds with transaction fees of 0.00001 XLM (100 stroops).
2. **On-Chain Farm Passports**: Verifiable digital identities registered directly onto Soroban smart contracts, encoding farm geographic region, primary crop, acreage, and expected yield.
3. **Multi-Wallet Accessibility**: Non-custodial access across premier Stellar ecosystem wallets (Freighter, xBull, Albedo, Hana).
4. **Real-Time Event Streams**: Immediate indexing of contract events (`FarmRegistered`) directly from Stellar Testnet nodes.

---

## 🏛️ Smart Contract Infrastructure: FarmRegistry

The `FarmRegistry` Soroban smart contract serves as AgriFlow's core agricultural registry, establishing on-chain **Farm Passports** as the foundation for future micro-financing, crop insurance, escrow, and tokenized agricultural collateral.

### Deployed Contract Details (Stellar Testnet)

| Parameter | Value |
| :--- | :--- |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **Contract Name** | `FarmRegistry` |
| **Contract ID** | [`CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ`](https://stellar.expert/explorer/testnet/contract/CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ) |
| **Deployment Transaction Hash** | [`016b501af3eb125c4f713e657046606334c3cc441c9acac555d986a3e2433a8e`](https://stellar.expert/explorer/testnet/tx/016b501af3eb125c4f713e657046606334c3cc441c9acac555d986a3e2433a8e) |
| **Deployer Public Key** | [`GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU`](https://stellar.expert/explorer/testnet/account/GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU) |
| **WASM Hash** | `e1f93f1d3e1a6603a11631ef842d3d9e843ea35043a53be46c986c71c4c1a9ae` |
| **Soroban RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **Horizon Endpoint** | `https://horizon-testnet.stellar.org` |

---

### Contract Capabilities

The `FarmRegistry` contract (`contracts/farm-registry/src/lib.rs`) implements:
- **`register_farm(owner, country, region, crop, farm_size_hectares, expected_yield_tons) -> Symbol`**:
  - Requires cryptographic authorization from the owner address (`owner.require_auth()`).
  - Validates input boundaries (ensures non-empty strings, size > 0, yield > 0).
  - Generates a sequential, deterministic Farm ID (`AGRI-000001`, `AGRI-000002`, ...).
  - Persists the passport struct to Soroban persistent instance storage.
  - Emits an on-chain `FarmRegistered` event containing `(farm_id, owner, crop, country)`.
- **`get_farm(farm_id) -> Option<FarmPassport>`**: Retrieves verified farm passport record.
- **`has_farm(farm_id) -> bool`**: Returns boolean existence of a farm identifier.
- **`get_farm_count() -> u32`**: Returns total registered farms in the protocol.
- **`update_farm_status(farm_id, new_status)`**: Authorizes only the farm owner or protocol admin to update status (`Active`, `Suspended`, `Revoked`).

---

## 🔌 Multi-Wallet Integration

AgriFlow provides an extensible multi-wallet architecture implementing the `IWalletAdapter` interface. Users can connect with their preferred Stellar provider:

1. **Freighter Wallet**: Stellar's flagship non-custodial browser extension by SDF.
2. **xBull Wallet**: Feature-rich multi-platform wallet engineered for Stellar and Soroban.
3. **Albedo**: Web-based delegated signing without browser extension requirements.
4. **Hana Wallet**: Multi-chain wallet with integrated Stellar account management.
5. **Testnet Account Preview**: Direct live network connection allowing instant testnet account exploration.

### Modular Adapter Architecture

```text
              +--------------------------+
              |     IWalletAdapter       |
              +--------------------------+
              | + connect(): string      |
              | + disconnect(): void     |
              | + isAvailable(): bool    |
              | + signTx(xdr): string    |
              +--------------------------+
                           ^
        +------------------+------------------+
        |                  |                  |
+----------------+ +----------------+ +----------------+
| FreighterAdapter| |  XBullAdapter   | | AlbedoAdapter  | ...
+----------------+ +----------------+ +----------------+
```

---

## 🔄 Transaction Lifecycle Management

Both Soroban contract invocations and native Stellar payments execute through a deterministic state machine:

```text
[ Idle ] 
   │
   ▼
[ Preparing ] ──> Input validation & parameter encoding
   │
   ▼
[ Simulating ] ──> Soroban RPC pre-flight simulation (gas & auth footprint)
   │
   ▼
[ Awaiting Signature ] ──> Prompting user in Freighter / xBull / Albedo
   │
   ├── (Declined) ──> [ Rejected ] (Clean user-friendly error message)
   │
   ▼
[ Submitting ] ──> Transmitting signed XDR to Soroban RPC / Horizon
   │
   ▼
[ Pending ] ──> Polling ledger inclusion (avg 3.5s block time)
   │
   ├── (Success) ──> [ Confirmed ] ──> Deep link to Stellar.Expert & live UI reload
   └── (Error)   ──> [ Failed ] ──> Friendly error parsing without technical stack dumps
```

---

## 📡 Real-Time Blockchain Event Handling

AgriFlow interacts with the live Soroban RPC event filter to index smart contract events in real time:
- The contract emits `FarmRegistered` topics: `Symbol::new(&env, "FarmRegistered")`, `farm_id`.
- The frontend client polls `getEvents` on `https://soroban-testnet.stellar.org` starting from the latest confirmed ledger.
- Newly discovered events are parsed from Soroban ScVal representations into typed JavaScript event objects and prepended to the **Recent Activity** feed.

---

## 📦 Monorepo Architecture

AgriFlow is structured as an enterprise Turborepo monorepo:

```text
StellarAgriFlow/
├── apps/
│   └── web/                         # Next.js 14 App Router Web Application
│       ├── src/app/                 # Layout, styling, and dashboard pages
│       ├── src/components/          # FarmPassportForm, FarmPassportList,
│       │                            # ActivityFeed, PaymentForm, WalletModal
│       ├── src/context/             # WalletContext & session provider
│       └── src/services/            # Multi-wallet adapters (Freighter, xBull, Albedo)
├── contracts/
│   └── farm-registry/               # Production Soroban Smart Contract (Rust)
│       ├── src/
│       │   ├── lib.rs               # FarmRegistry contract implementation
│       │   └── test.rs              # Contract unit tests (8 tests covering all branches)
│       ├── Cargo.toml               # Soroban SDK 22.0.1 dependencies
│       └── Makefile                 # Build and deploy helpers
├── packages/
│   ├── config/                      # Shared configs & network constants
│   ├── contracts-client/            # Soroban RPC client, contract caller, event parser
│   ├── stellar/                     # Horizon client, balance query, transaction builder
│   ├── types/                       # Shared domain types (FarmPassport, WalletState, etc.)
│   └── ui/                          # Design system components (Button, Card, Badge)
├── tests/                           # 37 Vitest tests across all packages
│   ├── contracts-client.test.ts     # Client initialization, lifecycle, & status parsing
│   ├── farm-passport.test.ts        # Farm input validation & data integrity tests
│   ├── multi-wallet.test.ts         # Wallet discovery & adapter registry tests
│   ├── validation.test.ts           # Stellar address & payment validation tests
│   ├── errors.test.ts               # Error translation & user friendly messaging
│   └── wallet-state.test.ts         # Formatter & Explorer deep link tests
├── .github/
│   └── workflows/ci.yml             # Automated CI: Rust tests + TypeScript tests + Build
├── package.json                     # Root workspace manifest
├── pnpm-workspace.yaml              # PNPM workspace definition
└── turbo.json                       # Turborepo task orchestrator
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (or newer)
- **pnpm**: `v10.x` or `v12.x` (`npm install -g pnpm`)
- **Rust & Cargo** (for contract development): `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: `v22+` (`cargo install --locked stellar-cli`)
- **Stellar Wallet**: [Freighter](https://www.freighter.app/) or [xBull](https://xbull.app/)

### 1. Installation

```bash
git clone https://github.com/Stellar-AgriFlow/StellarAgriFlow.git
cd StellarAgriFlow
pnpm install
```

### 2. Environment Configuration

Copy `.env.example` into `apps/web/.env.local`:

```bash
cp .env.example apps/web/.env.local
```

Default configuration points to the live deployed contract:
```env
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_EXPLORER_URL="https://stellar.expert/explorer/testnet"
NEXT_PUBLIC_FARM_REGISTRY_CONTRACT_ID="CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ"
```

### 3. Running the Development Server

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing Suite

### 1. Smart Contract Tests (Rust)

Run the contract test suite covering registration, unique identifiers, unauthorized status modification, existence verification, and event emission:

```bash
cd contracts/farm-registry
cargo test
```

### 2. Frontend & Client Tests (TypeScript / Vitest)

Execute all 37 unit and integration tests across all monorepo packages:

```bash
pnpm test
```

Test coverage includes:
- **`tests/contracts-client.test.ts`**: Client initialization, contract ID validation, transaction lifecycle states, status mapping.
- **`tests/farm-passport.test.ts`**: Agricultural field validation (country, region, crop, acreage, expected yield), extreme bound checks.
- **`tests/multi-wallet.test.ts`**: Wallet registry completeness, adapter instantiation, browser availability detection.
- **`tests/validation.test.ts`**: Stellar Ed25519 public key StrKey validation, payment amounts, invoice memos.
- **`tests/errors.test.ts`**: User signature denial, missing extensions, Horizon `op_underfunded`, 404 account missing.
- **`tests/wallet-state.test.ts`**: Address truncator, Stellar.Expert explorer receipt link generator.

---

## 🛠️ Reproducing Contract Build & Deployment

To build and deploy the contract yourself to Stellar Testnet:

```bash
# 1. Build the WebAssembly binary
cd contracts/farm-registry
cargo build --target wasm32-unknown-unknown --release

# 2. Configure Stellar CLI network and identity
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

stellar keys generate --global deployer --network testnet
stellar keys fund deployer --network testnet

# 3. Deploy contract binary to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/farm_registry.wasm \
  --source deployer \
  --network testnet
```

The output will display your new contract ID (`C...`). Update `NEXT_PUBLIC_FARM_REGISTRY_CONTRACT_ID` in `apps/web/.env.local`.

---

## 🔒 Security Best Practices

1. **Non-Custodial Design**: Private keys, seed phrases, and passwords are never requested, stored, or transmitted by AgriFlow. All signing occurs exclusively inside user wallets.
2. **On-Chain Cryptographic Authorization**: The `FarmRegistry` contract enforces `owner.require_auth()` for registration and updates, preventing unauthorized entity spoofing.
3. **No Raw Stack Dumps**: Low-level Horizon/Soroban simulation errors and RPC faults are parsed into human-actionable guidelines.
4. **Boundary Validation**: Contract logic independently verifies acreage, yield, and input strings before state commitment.

---

## 🗺️ Future Roadmap

```text
Phase 1: Payment Settlement (Complete)
└── Non-custodial XLM disbursements with agricultural purpose classification
└── Real-time Horizon balance and reserve calculation

Phase 2: Farm Identity & Registry (Current Release)
└── FarmRegistry Soroban smart contract on Stellar Testnet
└── Multi-wallet integration (Freighter, xBull, Albedo, Hana)
└── Client transaction lifecycle & real-time event indexing

Phase 3: Agricultural Escrow & Trade Automation (Next)
└── Conditional milestone release smart contracts for crop freight
└── Quality inspection oracle verification
└── Multi-currency settlement (USDC / EURC agricultural rails)

Phase 4: Collateralized Financing & Insurance
└── Tokenized harvest receipts as borrowing collateral
└── Parametric drought & rainfall insurance pools on Soroban
└── Cross-border cooperative liquidity pools
```

---

## 📄 License

This project is licensed under the Apache 2.0 License.
