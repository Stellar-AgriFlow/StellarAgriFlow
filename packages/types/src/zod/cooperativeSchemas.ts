import { z } from 'zod';
import { StellarPublicKeySchema } from './escrowSchemas';

export const CoopMemberRegistrationSchema = z.object({
  admin: StellarPublicKeySchema,
  member: StellarPublicKeySchema,
  initialShares: z.number().int().positive().min(1, 'Must assign at least 1 voting share'),
});

export const DepositSavingsSchema = z.object({
  member: StellarPublicKeySchema,
  amount: z.number().positive('Deposit amount must be positive').min(1),
});

export const WithdrawSavingsSchema = z.object({
  member: StellarPublicKeySchema,
  amount: z.number().positive('Withdrawal amount must be positive').min(1),
});

export const SubmitProposalSchema = z.object({
  proposer: StellarPublicKeySchema,
  title: z
    .string()
    .min(3, 'Proposal title must be at least 3 characters')
    .max(64, 'Proposal title cannot exceed 64 characters'),
  recipient: StellarPublicKeySchema,
  amount: z.number().positive('Disbursement amount must be positive').min(1),
});

export const VoteProposalSchema = z.object({
  member: StellarPublicKeySchema,
  proposalId: z.number().int().positive('Proposal ID must be a positive integer'),
});

export const ExecuteProposalSchema = z.object({
  admin: StellarPublicKeySchema,
  proposalId: z.number().int().positive('Proposal ID must be a positive integer'),
});

export type ValidatedCoopMemberRegistration = z.infer<typeof CoopMemberRegistrationSchema>;
export type ValidatedDepositSavings = z.infer<typeof DepositSavingsSchema>;
export type ValidatedWithdrawSavings = z.infer<typeof WithdrawSavingsSchema>;
export type ValidatedSubmitProposal = z.infer<typeof SubmitProposalSchema>;
export type ValidatedVoteProposal = z.infer<typeof VoteProposalSchema>;
export type ValidatedExecuteProposal = z.infer<typeof ExecuteProposalSchema>;
