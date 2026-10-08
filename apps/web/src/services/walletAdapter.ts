import { IWalletAdapter } from '@agriflow/types';
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import { parseStellarError } from '@agriflow/stellar';

export class FreighterWalletAdapter implements IWalletAdapter {
  id = 'freighter';
  name = 'Freighter';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Check freighter presence
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
      // Request access / permissions
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
        throw new Error('No account found in Freighter wallet. Please create or unlock an account in Freighter.');
      }
      return address;
    } catch (err: any) {
      const msg = parseStellarError(err);
      throw new Error(msg);
    }
  }

  async disconnect(): Promise<void> {
    // Freighter does not have a native revoking API, so we disconnect client-side
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

export class TestnetPreviewWalletAdapter implements IWalletAdapter {
  id = 'testnet-preview';
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
    // Return xdr for preview mode
    return xdr;
  }
}

// Single default adapter instance (Freighter)
export const defaultWalletAdapter: IWalletAdapter = new FreighterWalletAdapter();
export const previewWalletAdapter: IWalletAdapter = new TestnetPreviewWalletAdapter();
