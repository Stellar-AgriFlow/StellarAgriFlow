# AgriFlow Technical Architecture

This document details the architectural decisions and system design of the AgriFlow protocol.

## Monorepo Strategy

AgriFlow utilizes a modern Turborepo workspace managed by PNPM:

```text
StellarAgriFlow/
├── apps/
│   └── web/            # Next.js 14 frontend application
└── packages/
    ├── config/         # Shared Tailwind preset and tsconfig definitions
    ├── types/          # Domain types for wallet, payments, and networks
    ├── stellar/        # Stellar SDK wrapper, Horizon queries, transaction builders
    └── ui/             # Reusable UI component library (design system)
```

### Rationale
- **Isolation of Concerns**: UI components (`packages/ui`) have zero coupling to blockchain dependencies.
- **Blockchain Abstraction**: `@agriflow/stellar` contains all Horizon client logic and transaction construction. If network endpoints or SDK interfaces evolve, only this package is updated.
- **Extensibility for Phase 2**: The structure permits the introduction of `@agriflow/contracts`, `@agriflow/contracts-client`, and event indexing services without architectural refactoring.

## Wallet Abstraction Layer

The application interacts with wallets through the `IWalletAdapter` interface:

```typescript
export interface IWalletAdapter {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
}
```

This interface enables future wallet providers (StellarWalletsKit, Albedo, xBull, WalletConnect) to be plugged in seamlessly.

## Horizon Balance & Reserve Mechanics

Stellar protocol enforces a minimum account reserve to prevent ledger spam:
$$\text{Required Reserve} = (2 + \text{subentryCount}) \times 0.5\text{ XLM}$$

The spendable balance calculation is performed as:
$$\text{Spendable XLM} = \max(0, \text{totalXLM} - \text{Required Reserve} - \text{Fee Buffer})$$

This ensures users never submit transactions that fail with `op_underfunded` due to ledger reserve locks.
