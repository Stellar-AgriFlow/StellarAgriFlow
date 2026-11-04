import { Account, MuxedAccount } from '@stellar/stellar-sdk';

export interface DecodedMuxedAccount {
  basePublicKey: string;
  userId?: string;
  isMuxed: boolean;
}

export class MuxedAccountHelper {
  /**
   * Checks if an address is a SEP-0023 M-address (69 characters starting with M)
   */
  static isMuxedAccount(address: string): boolean {
    return typeof address === 'string' && address.startsWith('M') && address.length === 69;
  }

  /**
   * Encodes a standard Stellar G-address with a 64-bit user subaccount ID into an M-address
   */
  static encodeMuxedAccount(basePublicKey: string, userId: string | number | bigint): string {
    if (!basePublicKey || !basePublicKey.startsWith('G') || basePublicKey.length !== 56) {
      throw new Error(`Invalid Stellar base public key: "${basePublicKey}". Must start with G and be 56 characters.`);
    }

    const idStr = String(userId);
    const dummyAccount = new Account(basePublicKey, '0');
    const muxed = new MuxedAccount(dummyAccount, idStr);
    return muxed.accountId();
  }

  /**
   * Decodes an M-address or G-address into base public key and user ID
   */
  static decodeMuxedAccount(address: string): DecodedMuxedAccount {
    if (!address) {
      throw new Error('Address cannot be empty');
    }

    if (address.startsWith('G') && address.length === 56) {
      return {
        basePublicKey: address,
        isMuxed: false,
      };
    }

    if (MuxedAccountHelper.isMuxedAccount(address)) {
      try {
        const dummyAccount = new Account(address, '0');
        const muxed = new MuxedAccount(dummyAccount, '0');
        const baseKey = muxed.baseAccount().accountId();
        const userId = muxed.id();

        return {
          basePublicKey: baseKey,
          userId: userId || undefined,
          isMuxed: true,
        };
      } catch (err: unknown) {
        throw new Error(`Failed to decode Muxed Account "${address}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    throw new Error(`Invalid Stellar address format: "${address}". Expected G... (56 chars) or M... (69 chars).`);
  }
}
