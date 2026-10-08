# Contributing to AgriFlow

Thank you for your interest in contributing to AgriFlow! AgriFlow is an open-source, global agricultural financial and trade protocol powered by the Stellar network and Soroban smart contracts.

We welcome contributions from developers, researchers, agricultural economists, and Web3 enthusiasts worldwide.

---

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating.

---

## Getting Started

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **pnpm**: v9.0.0 or higher (or v12)
- **Rust & Cargo**: Latest stable Rust toolchain
- **Soroban CLI / Stellar CLI**: For smart contract compilation and testing
- **Git**

### Installation

1. **Fork and Clone**
   ```bash
   git clone https://github.com/Stellar-AgriFlow/StellarAgriFlow.git
   cd StellarAgriFlow
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example apps/web/.env.local
   ```

4. **Run the Development Server**
   ```bash
   pnpm dev
   ```

---

## Development Workflow

### Monorepo Structure

- `apps/web`: Next.js 14 web application, multi-wallet connectors, and protocol dashboard
- `contracts/`: Soroban smart contracts written in Rust
  - `farm-registry`: On-chain Farm Passport registry
  - `agricultural-finance`: Forward harvest financing and loan requests
  - `agricultural-escrow`: Conditional escrow settlement
  - `agricultural-marketplace`: Produce trade listings and purchases
  - `agricultural-reputation`: Non-transferable on-chain trust scoring
- `packages/`: Shared libraries
  - `contracts-client`: Soroban RPC client bindings
  - `oracle`: Agricultural commodity and weather oracle feeds
  - `stellar`: Stellar SDK integrations and balance tracking
  - `types`: TypeScript domain types
  - `ui`: Shared UI components
- `services/event-indexer`: Blockchain event indexer and persistence engine
- `tests/`: End-to-end and unit test suites

### Running Tests

Before submitting any code changes, ensure all tests pass:

```bash
# Run all TypeScript tests
pnpm test

# Run Rust smart contract tests
cargo test --manifest-path contracts/farm-registry/Cargo.toml
cargo test --manifest-path contracts/agricultural-reputation/Cargo.toml
cargo test --manifest-path contracts/agricultural-escrow/Cargo.toml
cargo test --manifest-path contracts/agricultural-marketplace/Cargo.toml
cargo test --manifest-path contracts/agricultural-finance/Cargo.toml
```

### Type Checking & Linting

```bash
pnpm --filter @agriflow/web lint
pnpm --filter @agriflow/web build
```

---

## Submitting Pull Requests

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. **Commit Guidelines**
   - Write clear, descriptive commit messages.
   - Do not reference internal milestone tags or belt rankings.
   - Keep commits focused on a single logical change.

3. **Push and Open a Pull Request**
   - Push your branch to your fork.
   - Open a PR against `main`.
   - Provide a clear summary of what changes were made and why.
   - Link any related issues using `Fixes #<issue-number>`.

---

## Reporting Issues

If you find a bug or have a feature request:
- Search existing issues before creating a new one.
- Use a clear, descriptive title.
- Provide step-by-step reproduction instructions and expected behavior.
- For security vulnerabilities, do **not** open a public issue. Follow our [Security Policy](./SECURITY.md).

---

## License

By contributing to AgriFlow, you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE).
