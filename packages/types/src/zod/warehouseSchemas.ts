import { z } from 'zod';
import { StellarPublicKeySchema } from './escrowSchemas';

export const WarehouseReceiptMintSchema = z.object({
  owner: StellarPublicKeySchema,
  commodityType: z.enum(['Wheat', 'Maize', 'Soybean', 'Coffee', 'Cocoa', 'Rice', 'Barley']),
  quantityKg: z.number().positive().min(100),
  qualityGrade: z.number().int().min(1).max(3),
  moistureBasisPoints: z.number().int().min(500).max(1400), // Max 14.0%
  warehouseAddress: StellarPublicKeySchema,
});

export const PledgeReceiptSchema = z.object({
  receiptId: z.number().int().positive(),
  owner: StellarPublicKeySchema,
  loanContractAddress: z.string().regex(/^C[A-Z0-9]{55}$/, {
    message: 'Must be a valid 56-character Soroban contract address starting with C',
  }),
});

export const RedeemReceiptSchema = z.object({
  receiptId: z.number().int().positive(),
  owner: StellarPublicKeySchema,
});

export type ValidatedWarehouseReceiptMint = z.infer<typeof WarehouseReceiptMintSchema>;
export type ValidatedPledgeReceipt = z.infer<typeof PledgeReceiptSchema>;
export type ValidatedRedeemReceipt = z.infer<typeof RedeemReceiptSchema>;
