# Production Deployment & Operations Playbook

## 1. Prerequisites
- Rust `1.80+` with target `wasm32-unknown-unknown`
- `stellar-cli` (v22.0.0+)
- Node.js `20+` and `pnpm` (v9.15.9+)
- Funded Stellar Deployer Account (`testnet` or `public`)

## 2. Compiling Soroban Contracts
```bash
# Build all 7 contracts in release mode
cargo build --manifest-path contracts/Cargo.toml --target wasm32-unknown-unknown --release
```

## 3. Deploying to Stellar Testnet
```bash
# Set network environment
export STELLAR_NETWORK=testnet
export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# 1. Deploy Farm Registry
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/farm_registry.wasm \
  --source deployer \
  --network testnet

# 2. Deploy Warehouse Receipt
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/warehouse_receipt.wasm \
  --source deployer \
  --network testnet

# 3. Deploy Parametric Insurance
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/parametric_insurance.wasm \
  --source deployer \
  --network testnet
```

## 4. Contract Initialization Order
1. Initialize `agricultural-reputation` with admin keys.
2. Initialize `farm-registry` with reputation contract address.
3. Initialize `agricultural-finance` with `farm-registry` and oracle feed contracts.
4. Initialize `warehouse-receipt` and authorize custodian accounts.
5. Initialize `parametric-insurance` and deposit initial reinsurance liquidity pool capital.
