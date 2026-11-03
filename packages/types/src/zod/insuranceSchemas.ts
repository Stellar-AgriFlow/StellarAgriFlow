import { z } from 'zod';
import { StellarPublicKeySchema } from './escrowSchemas';

export const UnderwritePolicySchema = z.object({
  farmer: StellarPublicKeySchema,
  riskType: z.enum(['Drought', 'Flood']),
  triggerThreshold: z.number().positive(),
  payoutAmountUsd: z.number().positive().min(50).max(50000),
  durationDays: z.number().int().min(14).max(365),
});

export const LiquidityDepositSchema = z.object({
  provider: StellarPublicKeySchema,
  amountUsd: z.number().positive().min(10),
});

export const LiquidityWithdrawSchema = z.object({
  provider: StellarPublicKeySchema,
  sharesToBurn: z.number().positive(),
});

export type ValidatedUnderwritePolicy = z.infer<typeof UnderwritePolicySchema>;
export type ValidatedLiquidityDeposit = z.infer<typeof LiquidityDepositSchema>;
export type ValidatedLiquidityWithdraw = z.infer<typeof LiquidityWithdrawSchema>;
