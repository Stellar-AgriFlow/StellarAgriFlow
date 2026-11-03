import { describe, it, expect } from 'vitest';
import { CollateralLiquidationClient } from '../packages/contracts-client/src/liquidationClient';

describe('Collateral Liquidation Contract Client SDK', () => {
  const contractId = 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ';
  const client = new CollateralLiquidationClient(contractId);

  it('initializes client with valid 56-character Soroban contract address', () => {
    expect(client.getContractId()).toBe(contractId);
  });

  it('rejects invalid or malformed contract IDs during initialization', () => {
    expect(() => new CollateralLiquidationClient('')).toThrow(
      'Invalid Soroban contract ID'
    );
    expect(() => new CollateralLiquidationClient('INVALID_ID')).toThrow(
      'Invalid Soroban contract ID'
    );
  });
});
