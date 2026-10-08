export type WalletProvider = 'FREIGHTER';

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
