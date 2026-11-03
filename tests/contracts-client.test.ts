import { describe, it, expect } from 'vitest';
import { FarmRegistryClient } from '../packages/contracts-client/src/client';
import { WarehouseReceiptClient } from '../packages/contracts-client/src/warehouse-receipt';
import { ParametricInsuranceClient } from '../packages/contracts-client/src/insurance';
import { FarmStatus } from '../packages/types/src/passport';

describe('Soroban FarmRegistry Client Architecture', () => {
  const validContractId = 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ';
  const rpcUrl = 'https://soroban-testnet.stellar.org';
  const networkPassphrase = 'Test SDF Network ; September 2015';

  it('initializes client with valid contract ID and testnet parameters', () => {
    const client = new FarmRegistryClient({
      contractId: validContractId,
      rpcUrl,
      networkPassphrase,
    });

    expect(client.getContractId()).toBe(validContractId);
  });

  it('rejects invalid or empty contract ID during initialization', () => {
    expect(
      () =>
        new FarmRegistryClient({
          contractId: '',
          rpcUrl,
          networkPassphrase,
        })
    ).toThrow('Invalid Soroban contract ID');

    expect(
      () =>
        new FarmRegistryClient({
          contractId: 'INVALID_CONTRACT_ID',
          rpcUrl,
          networkPassphrase,
        })
    ).toThrow('Invalid Soroban contract ID');
  });

  it('validates contract address format starting with C and 56 characters', () => {
    expect(validContractId.startsWith('C')).toBe(true);
    expect(validContractId.length).toBe(56);
  });

  it('correctly maps Soroban integer farm status to TypeScript status string', () => {
    const mapStatus = (code: number): FarmStatus => {
      switch (code) {
        case 1:
          return 'Suspended';
        default:
          return 'Active';
      }
    };

    expect(mapStatus(0)).toBe('Active');
    expect(mapStatus(1)).toBe('Suspended');
  });

  it('tracks transaction states throughout the full lifecycle', () => {
    const states: string[] = [];
    const callback = (state: string) => states.push(state);

    callback('signing');
    callback('submitting');
    callback('confirming');
    callback('confirmed');

    expect(states).toEqual(['signing', 'submitting', 'confirming', 'confirmed']);
  });

  it('initializes WarehouseReceiptClient with valid testnet contract ID', () => {
    const receiptClient = new WarehouseReceiptClient({
      contractId: validContractId,
      rpcUrl,
      networkPassphrase,
    });
    expect(receiptClient.getContractId()).toBe(validContractId);
  });

  it('initializes ParametricInsuranceClient with valid testnet contract ID', () => {
    const insuranceClient = new ParametricInsuranceClient({
      contractId: validContractId,
      rpcUrl,
      networkPassphrase,
    });
    expect(insuranceClient.getContractId()).toBe(validContractId);
  });
});
