import { describe, it, expect } from 'vitest';
import {
  CoopMemberRegistrationSchema,
  DepositSavingsSchema,
  WithdrawSavingsSchema,
  SubmitProposalSchema,
  VoteProposalSchema,
  ExecuteProposalSchema,
} from '../packages/types/src/zod/cooperativeSchemas';

describe('Cooperative Zod Validation Schemas', () => {
  const validAdmin = 'G' + 'A'.repeat(55);
  const validMember = 'G' + 'B'.repeat(55);
  const validSupplier = 'G' + 'C'.repeat(55);

  it('validates successful cooperative member registration', () => {
    const res = CoopMemberRegistrationSchema.safeParse({
      admin: validAdmin,
      member: validMember,
      initialShares: 50,
    });
    expect(res.success).toBe(true);
  });

  it('rejects member registration with zero or negative shares', () => {
    const resZero = CoopMemberRegistrationSchema.safeParse({
      admin: validAdmin,
      member: validMember,
      initialShares: 0,
    });
    expect(resZero.success).toBe(false);

    const resNeg = CoopMemberRegistrationSchema.safeParse({
      admin: validAdmin,
      member: validMember,
      initialShares: -5,
    });
    expect(resNeg.success).toBe(false);
  });

  it('validates seasonal savings deposit schema', () => {
    const resValid = DepositSavingsSchema.safeParse({
      member: validMember,
      amount: 2500,
    });
    expect(resValid.success).toBe(true);

    const resInvalid = DepositSavingsSchema.safeParse({
      member: validMember,
      amount: 0,
    });
    expect(resInvalid.success).toBe(false);
  });

  it('validates seasonal savings withdrawal schema', () => {
    const resValid = WithdrawSavingsSchema.safeParse({
      member: validMember,
      amount: 500,
    });
    expect(resValid.success).toBe(true);
  });

  it('validates procurement proposal submission with length boundaries', () => {
    const resValid = SubmitProposalSchema.safeParse({
      proposer: validMember,
      title: 'Bulk NPK 15-15-15 Fertilizer',
      recipient: validSupplier,
      amount: 12000,
    });
    expect(resValid.success).toBe(true);

    const resShortTitle = SubmitProposalSchema.safeParse({
      proposer: validMember,
      title: 'Hi',
      recipient: validSupplier,
      amount: 12000,
    });
    expect(resShortTitle.success).toBe(false);

    const resInvalidRecipient = SubmitProposalSchema.safeParse({
      proposer: validMember,
      title: 'Valid Long Title',
      recipient: 'NOT_A_STELLAR_KEY',
      amount: 12000,
    });
    expect(resInvalidRecipient.success).toBe(false);
  });

  it('validates voting and execution schemas', () => {
    const resVote = VoteProposalSchema.safeParse({
      member: validMember,
      proposalId: 1,
    });
    expect(resVote.success).toBe(true);

    const resExec = ExecuteProposalSchema.safeParse({
      admin: validAdmin,
      proposalId: 1,
    });
    expect(resExec.success).toBe(true);

    const resBadId = VoteProposalSchema.safeParse({
      member: validMember,
      proposalId: -1,
    });
    expect(resBadId.success).toBe(false);
  });
});
