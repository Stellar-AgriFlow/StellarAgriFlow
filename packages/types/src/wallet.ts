export type WalletProvider =
  | 'FREIGHTER'
  | 'XBULL'
  | 'ALBEDO'
  | 'HANA'
  | 'LOBSTR'
  | 'TESTNET_DEMO';

export interface WalletOption {
  id: WalletProvider;
  name: string;
  description: string;
  isAvailable: boolean;
  downloadUrl: string;
}

export interface WalletAccount {
  address: string;
  shortAddress: string;
}

export type WalletConnectionStatus =
  | 'disconnected'
  | 'checking'
  | 'connecting'
  | 'connected'
  | 'not-installed'
  | 'error';

export interface WalletState {
  status: WalletConnectionStatus;
  account: WalletAccount | null;
  error: string | null;
  isAvailable: boolean;
  selectedProvider?: WalletProvider;
}

export interface IWalletAdapter {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
}
