import { describe, it, expect } from 'vitest';
import {
  FarmRegistrationSchema,
  CreateEscrowSchema,
  LoanRequestSchema,
  WarehouseReceiptMintSchema,
  UnderwritePolicySchema,
} from '../packages/types/src';

describe('Zod Domain Validation Schemas', () => {
  const validStellarKey = 'GDQWAAAHHJJJKKLLMMNNPPOOQQRRSSTTUUVVWWXXYYZZ112233445566';

  it('validates legitimate farm registration payload with valid coordinates', () => {
    const validFarm = {
      farmerName: 'Kofi Mensah',
      location: 'Kumasi Agricultural Hub',
      sizeHectares: 25.5,
      primaryCrop: 'Cocoa',
      coordinates: { latitude: 6.6885, longitude: -1.6244 },
      soilType: 'Loam',
      certifications: ['FairTrade', 'Organic'],
    };

    const parsed = FarmRegistrationSchema.safeParse(validFarm);
    expect(parsed.success).toBe(true);
  });

  it('rejects farm registration with out-of-range coordinates', () => {
    const invalidFarm = {
      farmerName: 'Kofi Mensah',
      location: 'Kumasi Agricultural Hub',
      sizeHectares: 25.5,
      primaryCrop: 'Cocoa',
      coordinates: { latitude: 120.0, longitude: -1.6244 }, // Lat > 90 invalid
      soilType: 'Loam',
    };

    const parsed = FarmRegistrationSchema.safeParse(invalidFarm);
    expect(parsed.success).toBe(false);
  });

  it('validates escrow creation payload with valid public keys', () => {
    const escrow = {
      buyer: validStellarKey,
      seller: validStellarKey,
      amountUsd: 1500,
      commodityType: 'Wheat',
      quantityKg: 2500,
      disputeWindowHours: 72,
    };

    const parsed = CreateEscrowSchema.safeParse(escrow);
    expect(parsed.success).toBe(true);
  });

  it('rejects warehouse receipt minting with excessive moisture level > 14%', () => {
    const receipt = {
      owner: validStellarKey,
      commodityType: 'Wheat',
      quantityKg: 5000,
      qualityGrade: 1,
      moistureBasisPoints: 1500, // 15.0% > 14.0% limit
      warehouseAddress: validStellarKey,
    };

    const parsed = WarehouseReceiptMintSchema.safeParse(receipt);
    expect(parsed.success).toBe(false);
  });

  it('validates parametric policy underwriting payload', () => {
    const policy = {
      farmer: validStellarKey,
      riskType: 'Drought',
      triggerThreshold: 45,
      payoutAmountUsd: 5000,
      durationDays: 90,
    };

    const parsed = UnderwritePolicySchema.safeParse(policy);
    expect(parsed.success).toBe(true);
  });
});
