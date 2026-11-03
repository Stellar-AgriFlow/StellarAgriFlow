import { describe, it, expect } from 'vitest';
import {
  CooperativeVaultClient,
  DEFAULT_COOPERATIVE_CONTRACT_ID,
} from '../packages/contracts-client/src/cooperativeClient';

describe('Cooperative Vault Contract Client SDK', () => {
  it('initializes client with default cooperative contract address', () => {
    const client = new CooperativeVaultClient();
    expect(client.getContractId()).toBe(DEFAULT_COOPERATIVE_CONTRACT_ID);
  });

  it('initializes client with a custom 56-character Soroban contract address', () => {
    const customId = 'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888';
    const client = new CooperativeVaultClient(customId);
    expect(client.getContractId()).toBe(customId);
  });

  it('rejects invalid or malformed contract IDs during initialization', () => {
    expect(() => new CooperativeVaultClient('')).toThrow(
      'Invalid Soroban contract ID'
    );
    expect(() => new CooperativeVaultClient('INVALID_ID')).toThrow(
      'Invalid Soroban contract ID'
    );
  });

  it('formats getProposal responses with defaults when simulation fails', async () => {
    const client = new CooperativeVaultClient();
    const proposal = await client.getProposal(1);
    expect(proposal.id).toBe(1);
    expect(proposal.title).toBe('Bulk Fertilizer Order');
    expect(proposal.quorumRequired).toBe(51);
  });
});
