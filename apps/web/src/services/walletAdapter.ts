import { IWalletAdapter, WalletOption, WalletProvider } from '@agriflow/types';
import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
  setAllowed as freighterSetAllowed,
} from '@stellar/freighter-api';
import { parseStellarError } from '@agriflow/stellar';

export class FreighterWalletAdapter implements IWalletAdapter {
  id = 'FREIGHTER';
  name = 'Freighter';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (typeof freighterIsConnected === 'function') {
        const result = await freighterIsConnected();
        if (typeof result === 'object' && result !== null && 'isConnected' in result) {
          return Boolean((result as any).isConnected);
        }
        return Boolean(result);
      }
      return Boolean((window as any).freighter);
    } catch {
      return false;
    }
  }

  async connect(): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Freighter wallet was not detected. Please install Freighter to continue.');
    }

    try {
      if (typeof freighterRequestAccess === 'function') {
        const access = await freighterRequestAccess();
        if (access && typeof access === 'object' && 'address' in access && (access as any).address) {
          return (access as any).address;
        }
      } else if (typeof freighterSetAllowed === 'function') {
        await freighterSetAllowed();
      }

      const address = await this.getPublicKey();
      if (!address) {
        throw new Error('No account found in Freighter wallet. Please unlock your account in Freighter.');
      }
      return address;
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getPublicKey(): Promise<string> {
    try {
      if (typeof freighterGetAddress === 'function') {
        const res = await freighterGetAddress();
        if (res && typeof res === 'object' && 'address' in res && (res as any).address) {
          return (res as any).address;
        }
        if (typeof res === 'string' && res) {
          return res;
        }
      }
      return '';
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }

  async signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string }
  ): Promise<string> {
    try {
      const res = await freighterSignTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase,
      });

      if (!res) {
        throw new Error('Transaction was rejected in your wallet.');
      }

      if (typeof res === 'string') {
        return res;
      }

      if (typeof res === 'object') {
        if ('signedTxXdr' in res && (res as any).signedTxXdr) {
          return (res as any).signedTxXdr;
        }
        if ('error' in res && (res as any).error) {
          throw new Error((res as any).error);
        }
      }

      throw new Error('Failed to sign transaction with Freighter.');
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }
}

export class XBullWalletAdapter implements IWalletAdapter {
  id = 'XBULL';
  name = 'xBull Wallet';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).xBullSDK || (window as any).xbull);
  }

  async connect(): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('xBull wallet was not detected. Please install xBull extension to continue.');
    }
    try {
      const xbull = (window as any).xBullSDK || (window as any).xbull;
      const publicKey = await xbull.getPublicKey();
      return publicKey;
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getPublicKey(): Promise<string> {
    const xbull = typeof window !== 'undefined' ? (window as any).xBullSDK || (window as any).xbull : null;
    if (!xbull) return '';
    return (await xbull.getPublicKey()) || '';
  }

  async signTransaction(xdr: string): Promise<string> {
    const xbull = (window as any).xBullSDK || (window as any).xbull;
    if (!xbull) throw new Error('xBull wallet not available');
    try {
      return await xbull.signXDR(xdr);
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }
}

export class AlbedoWalletAdapter implements IWalletAdapter {
  id = 'ALBEDO';
  name = 'Albedo';

  async isAvailable(): Promise<boolean> {
    return true; // Web-based modal fallback always available
  }

  async connect(): Promise<string> {
    try {
      // Dynamic import or web popup
      if (typeof window !== 'undefined' && (window as any).albedo) {
        const res = await (window as any).albedo.publicKey();
        return res.pubkey;
      }
      throw new Error('Albedo connection was canceled or unavailable.');
    } catch (err: any) {
      throw new Error(parseStellarError(err));
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getPublicKey(): Promise<string> {
    return '';
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).albedo) {
      const res = await (window as any).albedo.tx({
        xdr,
        network: opts?.networkPassphrase,
      });
      return res.signed_envelope_xdr;
    }
    throw new Error('Albedo wallet unavailable');
  }
}

export class HanaWalletAdapter implements IWalletAdapter {
  id = 'HANA';
  name = 'Hana Wallet';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).hanaWallet);
  }

  async connect(): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Hana wallet was not detected. Please install Hana wallet to continue.');
    }
    const hana = (window as any).hanaWallet;
    return await hana.getPublicKey();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getPublicKey(): Promise<string> {
    const hana = typeof window !== 'undefined' ? (window as any).hanaWallet : null;
    return hana ? await hana.getPublicKey() : '';
  }

  async signTransaction(xdr: string): Promise<string> {
    const hana = (window as any).hanaWallet;
    return await hana.signTransaction(xdr);
  }
}

export class TestnetPreviewWalletAdapter implements IWalletAdapter {
  id = 'TESTNET_DEMO';
  name = 'Stellar Testnet Account (Preview)';
  private address = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<string> {
    return this.address;
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getPublicKey(): Promise<string> {
    return this.address;
  }

  async signTransaction(
    xdr: string,
    _opts?: { networkPassphrase?: string }
  ): Promise<string> {
    return xdr;
  }
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  {
    id: 'FREIGHTER',
    name: 'Freighter',
    description: 'The premier Stellar browser extension wallet by SDF.',
    isAvailable: false,
    downloadUrl: 'https://www.freighter.app/',
  },
  {
    id: 'XBULL',
    name: 'xBull Wallet',
    description: 'Feature-rich multi-platform wallet for Stellar & Soroban.',
    isAvailable: false,
    downloadUrl: 'https://xbull.app/',
  },
  {
    id: 'ALBEDO',
    name: 'Albedo',
    description: 'Web-based delegated signing without browser extension.',
    isAvailable: true,
    downloadUrl: 'https://albedo.link/',
  },
  {
    id: 'HANA',
    name: 'Hana Wallet',
    description: 'Privacy-focused multi-chain wallet with Stellar support.',
    isAvailable: false,
    downloadUrl: 'https://hanawallet.io/',
  },
  {
    id: 'TESTNET_DEMO',
    name: 'Testnet Account Preview',
    description: 'Explore live on-chain Testnet state without browser extensions.',
    isAvailable: true,
    downloadUrl: '#',
  },
];

export function getAdapterForProvider(provider: WalletProvider): IWalletAdapter {
  switch (provider) {
    case 'FREIGHTER':
      return new FreighterWalletAdapter();
    case 'XBULL':
      return new XBullWalletAdapter();
    case 'ALBEDO':
      return new AlbedoWalletAdapter();
    case 'HANA':
      return new HanaWalletAdapter();
    case 'TESTNET_DEMO':
    default:
      return new TestnetPreviewWalletAdapter();
  }
}

export const defaultWalletAdapter: IWalletAdapter = new FreighterWalletAdapter();
export const previewWalletAdapter: IWalletAdapter = new TestnetPreviewWalletAdapter();
