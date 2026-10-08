# AgriFlow

**Global agricultural payments powered by Stellar.**

AgriFlow is a decentralized financial and trade settlement protocol engineered for agriculture. Built on the Stellar Network, AgriFlow bridges farmers, agricultural cooperatives, input suppliers, logistics carriers, and institutional grain buyers through instant, low-cost, non-custodial cross-border payments.

---

## Vision

Agricultural commerce represents over $1.5 trillion in annual global trade, yet cross-border agricultural supply chains remain burdened by multi-day banking delays, prohibitive correspondent remittance fees, opaque currency spreads, and lack of verified trade metadata. Smallholders and regional cooperatives frequently experience severe working capital shortages while awaiting wire settlements.

AgriFlow's long-term vision is to construct an end-to-end Web3 financial rail for global agriculture:
1. **Financial Infrastructure**: Direct producer disbursements, zero-reserve payment corridors, and harvest-cycle liquidity.
2. **Agricultural Identity (Farm Passport)**: Verifiable credentials representing acreage, crop yields, certifications, and historical fulfillment reliability.
3. **Smart Escrow & Trade Automation**: Soroban-powered conditional releases triggered upon verified shipping milestones and quality inspections.
4. **Decentralized Marketplace & Crop Insurance**: Algorithmic parametric weather coverage and forward contracting directly linked to Stellar settlement channels.

---

## Current Architecture

This release establishes the core payment and financial foundation of the AgriFlow protocol:

- **Freighter Wallet Integration**: Secure, non-custodial wallet connectivity with account detection and session management.
- **Real-Time Stellar Testnet XLM Balance**: Live queries to Horizon Testnet nodes with automatic calculation of base reserves and spendable balances.
- **Agricultural Payment Terminal**: Non-custodial XLM disbursements with agricultural purpose classification (`Farm Input`, `Farmer Payment`, `Produce Purchase`, `Logistics`, `Other`).
- **Deterministic Transaction Lifecycle**: Granular UI status states (`idle` -> `preparing` -> `awaiting approval` -> `submitting` -> `pending` -> `success` / `failed`).
- **On-Chain Verification**: Verified ledger indexing and deep links to Stellar.Expert Testnet Explorer.
- **Enterprise Monorepo Architecture**: Clean separation into `@agriflow/stellar`, `@agriflow/types`, `@agriflow/ui`, `@agriflow/config`, and `@agriflow/web`.

---

## Why Stellar?

The Stellar Network provides the optimal distributed ledger architecture for agricultural fintech:

- **Deterministic Sub-Cent Settlement**: Transactions finalize in 3–5 seconds with a fixed base fee of 100 stroops (0.00001 XLM), enabling micro-disbursements to smallholder farmers without fee erosion.
- **Native Asset & Payment Primitives**: Native support for XLM and fiat-backed anchors (USDC, EURC, local agricultural stablecoins) without smart contract overhead.
- **On-Chain Transaction Memos**: Up to 28-byte UTF-8 transaction memos allow attaching invoice references and agricultural purpose identifiers directly onto ledger entries.
- **Future-Ready for Soroban Smart Contracts**: Clean evolution into Soroban WebAssembly contracts for automated agricultural escrow, collateralized trade financing, and multi-signature supply chain release.

---

## System Architecture

```text
       +---------------------------------------------+
       |             Agricultural User               |
       |  (Farmer, Cooperative, Buyer, Logistics)    |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |             AgriFlow Web App                |
       |  (Next.js 14 App Router / Tailwind CSS)     |
       +---------------------------------------------+
               |                             |
               v                             v
+-----------------------------+   +-----------------------------+
|    @agriflow/stellar SDK    |   |     Freighter Wallet        |
|  - Horizon Client           |   |  - Non-Custodial Key Storage|
|  - Transaction Builder      |   |  - User Signature Approval  |
|  - Balance & Reserve Engine |   +-----------------------------+
+-----------------------------+                  |
               |                                 |
               +---------------+                 |
                               | (Signed XDR)    |
                               v                 v
       +---------------------------------------------+
       |         Stellar Testnet Horizon Node        |
       |    (https://horizon-testnet.stellar.org)    |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |          Stellar Consensus Protocol         |
       |       Ledger Finality in ~4 Seconds         |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |         Stellar.Expert Testnet Explorer     |
       |        (Public Verification & Receipts)     |
       +---------------------------------------------+
```

---

## Monorepo Layout

```text
StellarAgriFlow/
├── apps/
│   └── web/                   # Next.js 14 Web Application
│       ├── src/app/           # App Router pages and layouts
│       ├── src/components/    # Terminal, BalanceCard, PaymentForm, Header
│       ├── src/context/       # WalletProvider context
│       ├── src/hooks/         # useStellarWallet, useAccountBalance
│       └── src/services/      # Freighter wallet adapter abstraction
├── packages/
│   ├── config/                # Shared ESLint, Tailwind presets, TSConfigs
│   ├── types/                 # Domain types, WalletState, PaymentReceipt
│   ├── stellar/               # Horizon queries, TransactionBuilder, Validation
│   └── ui/                    # Reusable design system (Button, Card, Input)
├── docs/                      # Architectural documentation & guides
│   ├── ARCHITECTURE.md        # Technical architecture & design rationale
│   └── TESTNET_GUIDE.md       # Step-by-step testnet guide & Friendbot setup
├── tests/                     # Unit & validation test suite (Vitest)
│   ├── validation.test.ts     # Address, amount, and memo validation tests
│   ├── errors.test.ts         # Stellar Horizon error parser tests
│   └── wallet-state.test.ts   # Formatter and Explorer URL tests
├── .github/
│   └── workflows/ci.yml       # GitHub Actions automated CI workflow
├── turbo.json                 # Turborepo task pipeline configuration
├── pnpm-workspace.yaml        # PNPM workspace definition
├── package.json               # Root workspace manifest
├── .env.example               # Environment variables template
└── README.md
```

---

## Implemented Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Freighter Connection** | Connects to Freighter browser extension, retrieves public key | ✅ Production Ready |
| **Wallet Disconnect** | Flushes active session and resets application state | ✅ Production Ready |
| **Testnet Horizon Client** | Connects to `https://horizon-testnet.stellar.org` | ✅ Production Ready |
| **XLM Balance Query** | Live native balance retrieval with minimum reserve subtraction | ✅ Production Ready |
| **Payment Form** | Validated address, amount, purpose selector, optional memo | ✅ Production Ready |
| **Address Validation** | Cryptographic Ed25519 public key validation via StrKey | ✅ Production Ready |
| **Reserve Calculation** | Dynamic reserve formula `(2 + subentries) * 0.5 XLM` | ✅ Production Ready |
| **Unfunded Account Handling** | Automatic detection of unfunded accounts + Friendbot activator | ✅ Production Ready |
| **Transaction Builder** | Constructs Stellar payment / createAccount operations with fee bounds | ✅ Production Ready |
| **User Rejection Handling** | Graceful error translation when user declines signing | ✅ Production Ready |
| **Receipt Modal** | Displays confirmed transaction hash with direct link to Stellar.Expert | ✅ Production Ready |
| **Automated Testing** | 23 comprehensive tests in Vitest covering all core logic | ✅ 100% Passing |

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Monorepo Engine**: [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/)
- **Blockchain SDK**: [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) (v17.2.1)
- **Wallet Extension**: [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) (v6.0.1)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom agricultural palette
- **Testing**: [Vitest](https://vitest.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (or later)
- **pnpm**: `v10.x` or `v12.x` (`npm install -g pnpm`)
- **Freighter Wallet Extension**: Install from [freighter.app](https://www.freighter.app/)

### 1. Clone & Install

```bash
git clone https://github.com/Stellar-AgriFlow/StellarAgriFlow.git
cd StellarAgriFlow
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `apps/web/.env.local`:

```bash
cp .env.example apps/web/.env.local
```

Default configuration:
```env
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_EXPLORER_URL="https://stellar.expert/explorer/testnet"
```

### 3. Run Locally

```bash
# Run web application in development mode
pnpm dev

# Or run tests
pnpm test

# Or build production bundles
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testnet Setup & Making a Test Transaction

### 1. Configure Freighter for Testnet
1. Open your Freighter browser extension.
2. Click the gear icon (Settings) in the top right.
3. Switch the network from **Public** to **Testnet**.

### 2. Fund Your Testnet Wallet
1. Copy your public key from Freighter (starts with `G...`).
2. Visit the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test) or use the built-in **Fund with Friendbot** button inside the AgriFlow terminal.
3. Your wallet will immediately receive **10,000 Testnet XLM**.

### 3. Send an Agricultural Payment
1. Click **Connect Wallet** on AgriFlow.
2. Your live XLM balance and available spendable balance will appear.
3. In the **Send Agricultural Payment** card:
   - Enter a recipient address (or click **Use Demo Testnet Address** to use `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`).
   - Enter an amount in XLM (e.g., `25`).
   - Select an agricultural purpose (e.g., `Produce Purchase`).
   - (Optional) Enter an invoice memo (e.g., `INV-2026-COFFEE`).
4. Click **Confirm & Send Payment**.
5. Approve the transaction in your Freighter pop-up window.
6. The terminal will track the transaction through submission and ledger finality (~4 seconds).
7. Review your payment receipt and click **View on Stellar Explorer** to verify the transaction on the public ledger.

---

## Roadmap

```text
Phase 1 (Current Foundation)
└── Non-custodial Stellar wallet integration
└── Real-time Horizon XLM balance & reserve management
└── Agricultural payment terminal with on-chain metadata
└── Explorer verification & automated validation

Phase 2 (Trade Contracts & Identity)
└── Soroban Smart Contracts for agricultural escrow
└── Farm Passport: Verifiable credentials for agricultural producers
└── Multi-wallet integration via StellarWalletsKit
└── Real-time contract event indexer

Phase 3 (Global Agricultural Finance & Liquidity)
└── Collateralized harvest financing & forward contracts
└── Decentralized agricultural marketplace with automated settlement
└── Parametric crop insurance pools
└── Cross-border multi-currency anchor settlement (USDC / EURC)
```

---

## License

This project is licensed under the Apache 2.0 License.
