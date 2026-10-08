export type StellarNetworkType = 'TESTNET' | 'PUBLIC';

export interface StellarNetworkConfig {
  network: StellarNetworkType;
  networkPassphrase: string;
  horizonUrl: string;
  explorerUrl: string;
}
