import { z } from 'zod';
import { StellarPublicKeySchema } from './escrowSchemas';

export const LoanRequestSchema = z.object({
  borrower: StellarPublicKeySchema,
  farmId: z.number().int().positive(),
  principalAmountUsd: z.number().positive().min(50).max(100000),
  tenureDays: z.number().int().min(14).max(365),
  collateralReceiptId: z.number().int().positive().optional(),
});

export const LoanRestructureSchema = z.object({
  loanId: z.number().int().positive(),
  additionalDays: z.number().int().min(7).max(180),
  agreedByBorrower: z.boolean().refine((val) => val === true, {
    message: 'Borrower must consent to restructured terms',
  }),
  agreedByLender: z.boolean().refine((val) => val === true, {
    message: 'Lender must consent to restructured terms',
  }),
});

export const RepaymentSchema = z.object({
  loanId: z.number().int().positive(),
  payer: StellarPublicKeySchema,
  repaymentAmountUsd: z.number().positive(),
});

export type ValidatedLoanRequest = z.infer<typeof LoanRequestSchema>;
export type ValidatedLoanRestructure = z.infer<typeof LoanRestructureSchema>;
export type ValidatedRepayment = z.infer<typeof RepaymentSchema>;
