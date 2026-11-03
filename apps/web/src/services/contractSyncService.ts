export interface FarmerPortfolioSnapshot {
  farmerAddress: string;
  reputationScore: number;
  creditTier: string;
  activeLoanCount: number;
  totalBorrowedAmount: number;
  activeReceiptCount: number;
  activePolicyCount: number;
  lastSyncedTimestamp: number;
}

export class ContractSyncService {
  constructor(
    private financeClient?: any,
    private reputationClient?: any,
    private receiptClient?: any,
    private insuranceClient?: any
  ) {}

  /**
   * Synchronizes portfolio across all 4 key smart contracts in parallel
   */
  async fetchFarmerPortfolio(farmerAddress: string): Promise<FarmerPortfolioSnapshot> {
    const timestamp = Date.now();

    const [reputationRes, loansRes, receiptsRes, policiesRes] = await Promise.allSettled([
      this.reputationClient?.getReputation?.(farmerAddress),
      this.financeClient?.getLoansByBorrower?.(farmerAddress),
      this.receiptClient?.getReceiptsByOwner?.(farmerAddress),
      this.insuranceClient?.getPoliciesByFarmer?.(farmerAddress),
    ]);

    const reputation = reputationRes.status === 'fulfilled' ? reputationRes.value : null;
    const loans = loansRes.status === 'fulfilled' ? loansRes.value || [] : [];
    const receipts = receiptsRes.status === 'fulfilled' ? receiptsRes.value || [] : [];
    const policies = policiesRes.status === 'fulfilled' ? policiesRes.value || [] : [];

    const activeLoans = loans.filter((l: any) => l.status === 'Active' || l.status === 1);
    const totalBorrowed = activeLoans.reduce((acc: number, curr: any) => acc + (curr.principalAmount || 0), 0);

    return {
      farmerAddress,
      reputationScore: reputation?.score ?? 500,
      creditTier: reputation?.tier ?? 'Silver',
      activeLoanCount: activeLoans.length,
      totalBorrowedAmount: totalBorrowed,
      activeReceiptCount: receipts.length,
      activePolicyCount: policies.length,
      lastSyncedTimestamp: timestamp,
    };
  }
}
