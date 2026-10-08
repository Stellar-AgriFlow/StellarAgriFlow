import { StellarNetworkConfig } from '@agriflow/types';

export const STELLAR_TESTNET_CONFIG: StellarNetworkConfig = {
  network: 'TESTNET',
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet',
};

export const STELLAR_BASE_FEE_STROOPS = '100';
export const STELLAR_BASE_RESERVE_XLM = 0.5;
export const STELLAR_MIN_ACCOUNT_RESERVE = 1.0; // 2 * base reserve for an account
