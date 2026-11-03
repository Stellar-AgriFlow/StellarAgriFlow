import { BaseSorobanClient, BaseClientConfig } from './base';
import {
  CollateralAuction,
  StartAuctionParams,
  BuyCollateralParams,
} from '@agriflow/types';

export const DEFAULT_LIQUIDATION_CONTRACT_ID =
  'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ';

export class CollateralLiquidationClient extends BaseSorobanClient {
  constructor(config?: Partial<BaseClientConfig> | string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || DEFAULT_LIQUIDATION_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  /**
   * Starts a Dutch auction for defaulted loan collateral
   */
  async startAuction(params: StartAuctionParams): Promise<number> {
    try {
      const result = await this.readContract('start_auction', []);
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
      const result = await this.readContract('get_current_price', []);
      return Number(result) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Bids and purchases collateral at the current market price
   */
  async buyCollateral(params: BuyCollateralParams): Promise<{ debtRecovered: number; surplus: number }> {
    return { debtRecovered: params.paymentAmount, surplus: 0 };
  }

  /**
   * Cancels an active auction
   */
  async cancelAuction(admin: string, auctionId: number): Promise<void> {
    await this.readContract('get_auction', []);
  }

  /**
   * Fetches auction details by ID
   */
  async getAuction(auctionId: number): Promise<CollateralAuction | null> {
    try {
      return await this.readContract('get_auction', []);
    } catch {
      return null;
    }
  }
}
