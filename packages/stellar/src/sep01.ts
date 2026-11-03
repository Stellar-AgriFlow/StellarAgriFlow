import {
  FARM_REGISTRY_CONTRACT_ID,
  AGRICULTURAL_FINANCE_CONTRACT_ID,
  AGRICULTURAL_ESCROW_CONTRACT_ID,
  AGRICULTURAL_MARKETPLACE_CONTRACT_ID,
  AGRICULTURAL_REPUTATION_CONTRACT_ID,
  WAREHOUSE_RECEIPT_CONTRACT_ID,
  PARAMETRIC_INSURANCE_CONTRACT_ID,
  STELLAR_TESTNET_CONFIG,
} from './config';

export interface Sep01TomlOptions {
  domain: string;
  adminPublicKey?: string;
  signingPublicKey?: string;
  networkPassphrase?: string;
}

export function generateSep01Toml(options: Sep01TomlOptions): string {
  const passphrase = options.networkPassphrase || STELLAR_TESTNET_CONFIG.networkPassphrase;
  const adminKey = options.adminPublicKey || 'GCL7UUKY7EE3OL5ROR3V3PFPRONI7RBCJ5S5BRFF4SO5LBDUH3QEXBTY';
  const signingKey = options.signingPublicKey || adminKey;

  return `# Stellar-AgriFlow SEP-0001 Discovery Specification
# Protocol: Decentralized Agricultural Commodity Finance & Parametric Risk Network on Stellar

VERSION = "2.0.0"
NETWORK_PASSPHRASE = "${passphrase}"
HORIZON_URL = "${STELLAR_TESTNET_CONFIG.horizonUrl}"
TRANSFER_SERVER = "https://${options.domain}/api/sep24"
ANCHOR_QUOTE_SERVER = "https://${options.domain}/api/sep38"
WEB_AUTH_ENDPOINT = "https://${options.domain}/api/auth/sep10"
SIGNING_KEY = "${signingKey}"

[DOCUMENTATION]
ORG_NAME = "Stellar-AgriFlow"
ORG_URL = "https://${options.domain}"
ORG_DESCRIPTION = "Decentralized agricultural finance, RWA commodity warehouse receipts, and parametric climate risk insurance on Stellar."
ORG_GITHUB = "https://github.com/Stellar-AgriFlow"
ORG_OFFICIAL_EMAIL = "contact@agriflow.network"

[[PRINCIPALS]]
NAME = "AgriFlow Operations"
EMAIL = "ops@agriflow.network"

# Soroban Smart Contracts
[CONTRACTS]
FARM_REGISTRY = "${FARM_REGISTRY_CONTRACT_ID}"
AGRICULTURAL_FINANCE = "${AGRICULTURAL_FINANCE_CONTRACT_ID}"
AGRICULTURAL_ESCROW = "${AGRICULTURAL_ESCROW_CONTRACT_ID}"
AGRICULTURAL_MARKETPLACE = "${AGRICULTURAL_MARKETPLACE_CONTRACT_ID}"
AGRICULTURAL_REPUTATION = "${AGRICULTURAL_REPUTATION_CONTRACT_ID}"
WAREHOUSE_RECEIPT = "${WAREHOUSE_RECEIPT_CONTRACT_ID}"
PARAMETRIC_INSURANCE = "${PARAMETRIC_INSURANCE_CONTRACT_ID}"

# AgriFlow Oracle Network (Stellar Testnet Deployed Contracts)
AGRI_PRICE_FEED_ORACLE = "CDE2KRZ2ZYZ2B7RT4BA4IPMTHBMUROWSSBCG2RGXM6MDS5GGAKR3GEI7"
WEATHER_RISK_ORACLE = "CCC6PHP7LADEVOW4AOLSRXHC6WOK2LW3ZJQX4EEYKR42GR3HXNSFIPHN"
`;
}
