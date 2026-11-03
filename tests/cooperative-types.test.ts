import { describe, it, expect } from 'vitest';
import {
  ProposalStatus,
  BulkProcurementProposal,
  SubmitProposalParams,
} from '../packages/types/src/cooperative';

export function canTransitionProposal(
  from: ProposalStatus,
  to: ProposalStatus
): boolean {
  switch (from) {
    case ProposalStatus.Pending:
      return to === ProposalStatus.Approved || to === ProposalStatus.Rejected;
    case ProposalStatus.Approved:
      return to === ProposalStatus.Executed;
    case ProposalStatus.Executed:
    case ProposalStatus.Rejected:
      return false;
    default:
      return false;
  }
}

export function validateProposalParams(params: SubmitProposalParams): {
  valid: boolean;
  reason?: string;
} {
  if (!params.title || params.title.trim().length === 0) {
    return { valid: false, reason: 'Title cannot be empty' };
  }
  if (!params.proposer || !params.proposer.startsWith('G') || params.proposer.length !== 56) {
    return { valid: false, reason: 'Invalid proposer Stellar address' };
  }
  if (!params.recipient || !params.recipient.startsWith('G') || params.recipient.length !== 56) {
    return { valid: false, reason: 'Invalid recipient Stellar address' };
  }
  if (params.amount <= 0) {
    return { valid: false, reason: 'Disbursement amount must be positive' };
  }
  return { valid: true };
}

describe('Cooperative Proposal Schemas & State Machine Transitions', () => {
  it('allows valid state machine progression: Pending -> Approved -> Executed', () => {
    expect(canTransitionProposal(ProposalStatus.Pending, ProposalStatus.Approved)).toBe(true);
    expect(canTransitionProposal(ProposalStatus.Approved, ProposalStatus.Executed)).toBe(true);
  });

  it('allows Pending proposal to transition to Rejected', () => {
    expect(canTransitionProposal(ProposalStatus.Pending, ProposalStatus.Rejected)).toBe(true);
  });

  it('prevents illegal backward or terminal state transitions', () => {
    expect(canTransitionProposal(ProposalStatus.Executed, ProposalStatus.Pending)).toBe(false);
    expect(canTransitionProposal(ProposalStatus.Executed, ProposalStatus.Approved)).toBe(false);
    expect(canTransitionProposal(ProposalStatus.Rejected, ProposalStatus.Approved)).toBe(false);
    expect(canTransitionProposal(ProposalStatus.Rejected, ProposalStatus.Executed)).toBe(false);
    expect(canTransitionProposal(ProposalStatus.Pending, ProposalStatus.Executed)).toBe(false);
  });

  it('validates correct proposal submission parameters', () => {
    const validParams: SubmitProposalParams = {
      title: 'Bulk Organic Fertilizer',
      proposer: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL7777777777777777777777',
      recipient: 'GCAGRISUPPLIER001AGRICO999STELLARKEY88888888888888888888',
      amount: 15000,
    };
    expect(validateProposalParams(validParams).valid).toBe(true);
  });

  it('rejects proposal submission with invalid Stellar addresses or non-positive amount', () => {
    const badAddressParams: SubmitProposalParams = {
      title: 'Bulk Organic Fertilizer',
      proposer: 'BAD_KEY',
      recipient: 'GCAGRISUPPLIER001AGRICO999STELLARKEY8888888888888888888888',
      amount: 15000,
    };
    expect(validateProposalParams(badAddressParams).valid).toBe(false);

    const zeroAmountParams: SubmitProposalParams = {
      title: 'Bulk Organic Fertilizer',
      proposer: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL777777777777777777777777',
      recipient: 'GCAGRISUPPLIER001AGRICO999STELLARKEY8888888888888888888888',
      amount: 0,
    };
    expect(validateProposalParams(zeroAmountParams).valid).toBe(false);
  });
});
