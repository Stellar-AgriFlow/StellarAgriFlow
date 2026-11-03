import { describe, it, expect } from 'vitest';
import { generateContractManifest } from '../scripts/export-bindings';
import { STELLAR_TESTNET_CONFIG } from '../packages/stellar/src/config';

describe('Contract Deployment Manifest & Configuration', () => {
  it('generates deployment manifest containing all 7 primary contracts', () => {
    const manifest = generateContractManifest('testnet');

    expect(manifest.network).toBe('testnet');
    expect(manifest.contracts.farmRegistry).toBeDefined();
    expect(manifest.contracts.reputation).toBeDefined();
    expect(manifest.contracts.finance).toBeDefined();
    expect(manifest.contracts.escrow).toBeDefined();
    expect(manifest.contracts.marketplace).toBeDefined();
    expect(manifest.contracts.warehouseReceipt).toBeDefined();
    expect(manifest.contracts.parametricInsurance).toBeDefined();
    expect(manifest.exportedAt).toBeDefined();
  });

  it('validates testnet network passphrase and Horizon RPC configurations', () => {
    expect(STELLAR_TESTNET_CONFIG.networkPassphrase).toBe(
      'Test SDF Network ; September 2015'
    );
    expect(STELLAR_TESTNET_CONFIG.horizonUrl).toContain('testnet');
    expect(STELLAR_TESTNET_CONFIG.explorerUrl).toContain('testnet');
  });
});
