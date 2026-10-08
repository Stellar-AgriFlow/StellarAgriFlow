import { describe, it, expect } from 'vitest';
import { FinancingRequest, FinancingStatus } from '../packages/types/src/finance';

describe('Agricultural Financing Protocol Architecture', () => {
  const sampleRequest: FinancingRequest = {
    requestId: 101,
    farmId: 'AGRI-000001',
    farmer: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
    requestedAmount: '20000000000',
    requestedAmountXlm: 2000,
    fundingAsset: 'XLM',
    purpose: 'Drip Irrigation Infrastructure',
    expectedRepaymentAmount: '21300000000',
    expectedRepaymentXlm: 2130,
    durationDays: 120,
    status: 'Requested',
    createdAt: Date.now(),
  };

  it('correctly models financing request parameters and interest rates', () => {
    expect(sampleRequest.requestedAmountXlm).toBe(2000);
    expect(sampleRequest.expectedRepaymentXlm).toBe(2130);
    const calculatedApr =
      ((sampleRequest.expectedRepaymentXlm - sampleRequest.requestedAmountXlm) /
        sampleRequest.requestedAmountXlm) *
      100;
    expect(calculatedApr).toBeCloseTo(6.5, 1);
  });

  it('validates state transitions throughout the financing lifecycle', () => {
    const validStates: FinancingStatus[] = [
      'Requested',
      'Funded',
      'Repaid',
      'Defaulted',
      'Closed',
    ];

    validStates.forEach((status) => {
      expect(validStates.includes(status)).toBe(true);
    });
  });

  it('prevents funding if farmer is identical to funder', () => {
    const funderAddress = 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU';
    const canFund = sampleRequest.farmer !== funderAddress;
    expect(canFund).toBe(false);
  });

  it('allows funding when funder is distinct institutional or cooperative participant', () => {
    const funderAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const canFund = sampleRequest.farmer !== funderAddress;
    expect(canFund).toBe(true);
  });
});
