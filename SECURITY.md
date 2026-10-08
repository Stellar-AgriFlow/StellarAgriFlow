# Security Policy

The AgriFlow team takes the security of our smart contracts, off-chain infrastructure, and decentralized application very seriously. We appreciate the responsible disclosure of any vulnerabilities found by community members, auditors, and security researchers.

---

## Supported Versions

Only the latest release and the current active deployments on the Stellar Testnet and Mainnet are actively supported for security updates:

| Version / Deployment | Supported |
| :--- | :--- |
| Smart Contracts (`v0.1.0` - Current Testnet) | :white_check_mark: |
| Web Application (`main` branch) | :white_check_mark: |
| Event Indexer Service (`services/event-indexer`) | :white_check_mark: |
| Oracle Provider (`packages/oracle`) | :white_check_mark: |
| Historical / Deprecated Testnet Deployments | :x: |

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential threat in AgriFlow:

**Please DO NOT open a public GitHub issue.**

Instead, please send an encrypted or direct report to our security team:
- **Email**: [security@agriflow.network](mailto:security@agriflow.network)
- **Subject**: `[SECURITY VULNERABILITY] AgriFlow: <Brief Summary>`

### What to Include in Your Report
To help us triage and validate the vulnerability promptly, please include:
1. **Description**: Clear description of the vulnerability and its potential impact.
2. **Affected Components**: Contract name, specific functions, file paths, or API endpoints.
3. **Reproduction Steps**: Step-by-step instructions or proof-of-concept (PoC) code/scripts.
4. **Proposed Fix**: Any suggested mitigations or patches (optional but appreciated).

---

## Response Process & SLAs

1. **Initial Response**: Within **24–48 hours**, we will acknowledge receipt of your report.
2. **Triage & Assessment**: Within **5 business days**, we will investigate and determine the severity rating according to the CVSS framework.
3. **Remediation & Patch**: We will work on a secure fix and deploy updates to contracts or web apps.
4. **Public Disclosure**: Once the fix is verified and deployed, a coordinated public advisory will be published, giving full credit to the researcher (unless anonymity is requested).

---

## Scope & Out-of-Scope

### In-Scope
- Soroban smart contracts (`contracts/farm-registry`, `contracts/agricultural-finance`, `contracts/agricultural-escrow`, `contracts/agricultural-marketplace`, `contracts/agricultural-reputation`)
- Authorization bypasses (`require_auth`)
- Re-entrancy, arithmetic overflows/underflows, or state corruption
- Client-side cryptographic transaction signing risks
- Event indexer data poisoning or RPC query manipulation

### Out-of-Scope
- Attacks requiring physical access to an end user's device
- Social engineering or phishing targeting individuals
- Denial-of-Service attacks on public Stellar RPC nodes beyond our control
- Issues in third-party wallet extensions (Freighter, xBull, Albedo, Hana)
