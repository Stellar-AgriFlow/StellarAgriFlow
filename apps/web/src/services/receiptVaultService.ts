import { WarehouseReceiptClient } from '@agriflow/contracts-client';
import { WarehouseReceipt, MintReceiptParams, PledgeReceiptParams, RedeemReceiptParams } from '@agriflow/types';

export class ReceiptVaultService {
  private client: WarehouseReceiptClient;

  constructor(contractId: string, rpcUrl?: string) {
    this.client = new WarehouseReceiptClient(contractId, rpcUrl);
  }

  /**
   * Fetch all receipts owned by a given farmer or cooperative address
   */
  async getFarmerReceipts(farmerAddress: string): Promise<WarehouseReceipt[]> {
    return this.client.getReceiptsByOwner(farmerAddress);
  }

  /**
   * Fetch a single warehouse receipt by ID
   */
  async getReceiptDetails(receiptId: number): Promise<WarehouseReceipt | null> {
    return this.client.getReceipt(receiptId);
  }

  /**
   * Mint and tokenize an Electronic Negotiable Warehouse Receipt (e-NWR)
   */
  async depositCommodity(params: MintReceiptParams) {
    return this.client.mintReceipt(params);
  }

  /**
   * Pledge a receipt as collateral for a decentralized agricultural loan
   */
  async pledgeReceiptAsCollateral(params: PledgeReceiptParams) {
    return this.client.pledgeReceipt(params);
  }

  /**
   * Redeem and burn an unencumbered warehouse receipt to pick up physical grain
   */
  async redeemPhysicalProduce(params: RedeemReceiptParams) {
    return this.client.redeemReceipt(params);
  }

  /**
   * Check if a warehouse receipt is active and unencumbered (free to trade or pledge)
   */
  static isReceiptTradeable(receipt: WarehouseReceipt): boolean {
    return receipt.status === 'Active' && !receipt.encumberedTo;
  }
}
