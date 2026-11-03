import { describe, it, expect } from 'vitest';
import {
  StellarAssetClient,
  TESTNET_USDC_SAC_CONTRACT_ID,
} from '../packages/contracts-client/src/stellarAssetClient';

describe('StellarAssetClient SDK', () => {
  it('initializes with default testnet USDC SAC contract ID', () => {
    const client = new StellarAssetClient();
    expect(client.getContractId()).toBe(TESTNET_USDC_SAC_CONTRACT_ID);
  });

  it('rejects invalid or malformed contract IDs', () => {
    expect(() => new StellarAssetClient('')).toThrow('Invalid Soroban contract ID');
    expect(() => new StellarAssetClient('GBADKEY')).toThrow('Invalid Soroban contract ID');
  });

  it('formats raw stroops to human-readable strings with variable decimals', () => {
    // 7 decimals (Stellar standard)
    expect(StellarAssetClient.formatUnits(10_000_000n, 7)).toBe('1');
    expect(StellarAssetClient.formatUnits(15_500_000n, 7)).toBe('1.55');
    expect(StellarAssetClient.formatUnits(1234567n, 7)).toBe('0.1234567');

    // 2 decimals (Fiat cents)
    expect(StellarAssetClient.formatUnits(1050n, 2)).toBe('10.5');
  });

  it('parses human-readable strings into accurate BigInt base units', () => {
    expect(StellarAssetClient.parseUnits('1', 7)).toBe(10_000_000n);
    expect(StellarAssetClient.parseUnits('1.55', 7)).toBe(15_500_000n);
    expect(StellarAssetClient.parseUnits('0.0000001', 7)).toBe(1n);
    expect(StellarAssetClient.parseUnits('100', 7)).toBe(1_000_000_000n);
  });

  it('returns metadata fallback when RPC simulation is offline', async () => {
    const client = new StellarAssetClient();
    const meta = await client.getMetadata();
    expect(meta.symbol).toBe('USDC');
    expect(meta.decimals).toBe(7);
  });

  it('returns zero balance when simulation throws', async () => {
    const client = new StellarAssetClient();
    const bal = await client.balance('G' + 'A'.repeat(55));
    expect(bal).toBe(0n);
  });
});
