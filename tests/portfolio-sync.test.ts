import { describe, it, expect, vi } from 'vitest';
import { ContractSyncService } from '../apps/web/src/services/contractSyncService';

describe('Multi-Contract Portfolio Synchronization Service', () => {
  const dummyFarmer = 'GDQWAAAHHJJJKKLLMMNNPPOOQQRRSSTTUUVVWWXXYYZZ112233445566';

  it('aggregates farmer portfolio metrics across all contracts simultaneously', async () => {
    const mockReputationClient = {
      getReputation: vi.fn().mockResolvedValue({ score: 720, tier: 'Gold' }),
    };

    const mockFinanceClient = {
      getLoansByBorrower: vi.fn().mockResolvedValue([
        { id: 1, principalAmount: 4000, status: 'Active' },
        { id: 2, principalAmount: 3000, status: 'Active' },
        { id: 3, principalAmount: 2000, status: 'Repaid' },
      ]),
    };

    const mockReceiptClient = {
      getReceiptsByOwner: vi.fn().mockResolvedValue([
        { id: 1, commodityType: 'Wheat', quantityKg: 5000 },
        { id: 2, commodityType: 'Maize', quantityKg: 10000 },
      ]),
    };

    const mockInsuranceClient = {
      getPoliciesByFarmer: vi.fn().mockResolvedValue([
        { id: 10, riskType: 'Drought', status: 'Active' },
      ]),
    };

    const syncService = new ContractSyncService(
      mockFinanceClient,
      mockReputationClient,
      mockReceiptClient,
      mockInsuranceClient
    );

    const snapshot = await syncService.fetchFarmerPortfolio(dummyFarmer);

    expect(snapshot.farmerAddress).toBe(dummyFarmer);
    expect(snapshot.reputationScore).toBe(720);
    expect(snapshot.creditTier).toBe('Gold');
    expect(snapshot.activeLoanCount).toBe(2);
    expect(snapshot.totalBorrowedAmount).toBe(7000);
    expect(snapshot.activeReceiptCount).toBe(2);
    expect(snapshot.activePolicyCount).toBe(1);
    expect(snapshot.lastSyncedTimestamp).toBeGreaterThan(0);
  });

  it('gracefully handles partial contract failure without rejecting entire snapshot', async () => {
    const mockReputationClient = {
      getReputation: vi.fn().mockRejectedValue(new Error('RPC rate limit')),
    };

    const syncService = new ContractSyncService(undefined, mockReputationClient);
    const snapshot = await syncService.fetchFarmerPortfolio(dummyFarmer);

    // Falls back to default safe baseline
    expect(snapshot.reputationScore).toBe(500);
    expect(snapshot.creditTier).toBe('Silver');
    expect(snapshot.activeLoanCount).toBe(0);
  });
});
