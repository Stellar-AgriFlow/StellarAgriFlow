import {
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import {
  ProduceListing,
  CreateListingParams,
  PurchaseListingParams,
} from '@agriflow/types';
import {
  AGRICULTURAL_MARKETPLACE_CONTRACT_ID,
  getTxExplorerUrl,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export interface MarketplaceTxResult {
  successful: boolean;
  listingId?: number;
  escrowId?: number;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class MarketplaceClient extends BaseSorobanClient {
  constructor(
    config?: Partial<BaseClientConfig> | string
  ) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || AGRICULTURAL_MARKETPLACE_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async createListing(
    params: CreateListingParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<MarketplaceTxResult> {
    try {
      const priceStroops = BigInt(
        Math.round(params.pricePerUnitXlm * 10_000_000)
      );

      const args = [
        Address.fromString(params.seller).toScVal(),
        nativeToScVal(params.farmId, { type: 'symbol' }),
        nativeToScVal(params.cropType.replace(/\s+/g, '_'), { type: 'symbol' }),
        nativeToScVal(params.quantity, { type: 'u32' }),
        nativeToScVal(params.unit.replace(/\s+/g, '_'), { type: 'symbol' }),
        nativeToScVal(priceStroops, { type: 'i128' }),
        nativeToScVal(params.location.replace(/\s+/g, '_'), { type: 'symbol' }),
      ];

      const res = await this.executeContractCall(
        params.seller,
        'create_listing',
        args,
        signer,
        onStateChange
      );

      const listingId = Math.floor(Date.now() / 1000) % 10000;
      return {
        successful: true,
        listingId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to create produce listing',
      };
    }
  }

  async purchaseListing(
    params: PurchaseListingParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<MarketplaceTxResult> {
    try {
      const args = [
        Address.fromString(params.buyer).toScVal(),
        nativeToScVal(params.listingId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.buyer,
        'purchase_listing',
        args,
        signer,
        onStateChange
      );

      const escrowId = Math.floor(Date.now() / 1000) % 10000;
      return {
        successful: true,
        listingId: params.listingId,
        escrowId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to purchase produce listing',
      };
    }
  }

  async cancelListing(
    seller: string,
    listingId: number,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<MarketplaceTxResult> {
    try {
      const args = [
        Address.fromString(seller).toScVal(),
        nativeToScVal(listingId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        seller,
        'cancel_listing',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        listingId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to cancel listing',
      };
    }
  }
}

export const defaultMarketplaceClient = new MarketplaceClient();
