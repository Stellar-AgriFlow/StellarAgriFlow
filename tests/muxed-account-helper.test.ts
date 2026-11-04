import { describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { MuxedAccountHelper } from '../packages/contracts-client/src/muxedAccountHelper';

describe('MuxedAccountHelper SEP-0023', () => {
  const baseKeypair = Keypair.random();
  const basePublicKey = baseKeypair.publicKey();
  const userId = '987654321';

  it('encodes base G-address and subaccount ID into 69-character M-address', () => {
    const muxedAddress = MuxedAccountHelper.encodeMuxedAccount(basePublicKey, userId);

    expect(muxedAddress.startsWith('M')).toBe(true);
    expect(muxedAddress.length).toBe(69);
    expect(MuxedAccountHelper.isMuxedAccount(muxedAddress)).toBe(true);
  });

  it('decodes M-address accurately into original base key and user ID', () => {
    const muxedAddress = MuxedAccountHelper.encodeMuxedAccount(basePublicKey, userId);
    const decoded = MuxedAccountHelper.decodeMuxedAccount(muxedAddress);

    expect(decoded.isMuxed).toBe(true);
    expect(decoded.basePublicKey).toBe(basePublicKey);
    expect(decoded.userId).toBe(userId);
  });

  it('handles standard G-address without error and sets isMuxed to false', () => {
    expect(MuxedAccountHelper.isMuxedAccount(basePublicKey)).toBe(false);

    const decoded = MuxedAccountHelper.decodeMuxedAccount(basePublicKey);
    expect(decoded.isMuxed).toBe(false);
    expect(decoded.basePublicKey).toBe(basePublicKey);
    expect(decoded.userId).toBeUndefined();
  });

  it('rejects invalid or malformed address formats', () => {
    expect(() => MuxedAccountHelper.encodeMuxedAccount('INVALID', 1)).toThrow(
      'Invalid Stellar base public key'
    );
    expect(() => MuxedAccountHelper.decodeMuxedAccount('INVALID_KEY')).toThrow(
      'Invalid Stellar address format'
    );
  });
});
