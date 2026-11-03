import { z } from 'zod';

export const StellarPublicKeySchema = z.string().regex(/^G[A-Z0-9]{55}$/, {
  message: 'Must be a valid 56-character Stellar public key starting with G',
});

export const CreateEscrowSchema = z.object({
  buyer: StellarPublicKeySchema,
  seller: StellarPublicKeySchema,
  inspector: StellarPublicKeySchema.optional(),
  amountUsd: z.number().positive().min(1),
  commodityType: z.string().min(2),
  quantityKg: z.number().positive(),
  disputeWindowHours: z.number().int().min(24).max(720).default(72),
});

export const InspectionApprovalSchema = z.object({
  escrowId: z.number().int().positive(),
  inspector: StellarPublicKeySchema,
  passedInspection: z.boolean(),
  notes: z.string().max(500).default(''),
});

export const DisputeClaimSchema = z.object({
  escrowId: z.number().int().positive(),
  claimant: StellarPublicKeySchema,
  reason: z.string().min(10).max(1000),
});

export type ValidatedCreateEscrow = z.infer<typeof CreateEscrowSchema>;
export type ValidatedInspectionApproval = z.infer<typeof InspectionApprovalSchema>;
export type ValidatedDisputeClaim = z.infer<typeof DisputeClaimSchema>;
