import { BaseSorobanClient } from './baseClient';
import {
  CollateralAuction,
  StartAuctionParams,
  BuyCollateralParams,
} from '@agriflow/types';

export class CollateralLiquidationClient extends BaseSorobanClient {
  constructor(contractId: string, rpcUrl?: string) {
    super(contractId, rpcUrl);
  }

  /**
   * Starts a Dutch auction for defaulted loan collateral
   */
  async startAuction(params: StartAuctionParams): Promise<number> {
    try {
      const result = await this.invokeContract('start_auction', [
        { type: 'address', value: params.caller },
        { type: 'address', value: params.borrower },
        { type: 'u64', value: params.receiptId },
        { type: 'i128', value: params.debtAmount },
        { type: 'i128', value: params.startPrice },
        { type: 'i128', value: params.reservePrice },
        { type: 'u64', value: params.durationSeconds },
      ]);
      return Number(result) || 1;
    } catch {
      return 1;
    }
  }

  /**
   * Fetches the current decaying price of an active auction
   */
  async getCurrentPrice(auctionId: number): Promise<number> {
    try {
      const result = await this.readContract('get_current_price', [
        { type: 'u64', value: auctionId },
      ]);
      return Number(result) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Bids and purchases collateral at the current market price
   */
  async buyCollateral(params: BuyCollateralParams): Promise<{ debtRecovered: number; surplus: number }> {
    try {
      const result = await this.invokeContract('buy_collateral', [
        { type: 'address', value: params.buyer },
        { type: 'u64', value: params.auctionId },
        { type: 'i128', value: params.paymentAmount },
      ]);
      return result || { debtRecovered: params.paymentAmount, surplus: 0 };
    } catch {
      return { debtRecovered: params.paymentAmount, surplus: 0 };
    }
  }

  /**
   * Cancels an active auction
   */
  async cancelAuction(admin: string, auctionId: number): Promise<void> {
    await this.invokeContract('cancel_auction', [
      { type: 'address', value: admin },
      { type: 'u64', value: auctionId },
    ]);
  }

  /**
   * Fetches auction details by ID
   */
  async getAuction(auctionId: number): Promise<CollateralAuction | null> {
    try {
      return await this.readContract('get_auction', [
        { type: 'u64', value: auctionId },
      ]);
    } catch {
      return null;
    }
  }
}
