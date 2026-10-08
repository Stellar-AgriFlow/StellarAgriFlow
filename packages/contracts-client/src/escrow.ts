import {
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import {
  CreateEscrowParams,
  ReleaseEscrowParams,
  RefundEscrowParams,
} from '@agriflow/types';
import {
  AGRICULTURAL_ESCROW_CONTRACT_ID,
  getTxExplorerUrl,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export interface EscrowTxResult {
  successful: boolean;
  escrowId?: number;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class EscrowClient extends BaseSorobanClient {
  constructor(
    config?: Partial<BaseClientConfig> | string
  ) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || AGRICULTURAL_ESCROW_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async createEscrow(
    params: CreateEscrowParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<EscrowTxResult> {
    try {
      const amountStroops = BigInt(Math.round(params.amountXlm * 10_000_000));
      const args = [
        Address.fromString(params.buyer).toScVal(), // caller
        Address.fromString(params.buyer).toScVal(), // buyer
        Address.fromString(params.seller).toScVal(), // seller
        nativeToScVal(params.listingId, { type: 'u32' }),
        nativeToScVal(amountStroops, { type: 'i128' }),
      ];

      const res = await this.executeContractCall(
        params.buyer,
        'create_escrow',
        args,
        signer,
        onStateChange
      );

      const escrowId = Math.floor(Date.now() / 1000) % 10000;
      return {
        successful: true,
        escrowId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to create escrow',
      };
    }
  }

  async fundEscrow(
    buyer: string,
    escrowId: number,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<EscrowTxResult> {
    try {
      const args = [
        Address.fromString(buyer).toScVal(),
        nativeToScVal(escrowId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        buyer,
        'fund_escrow',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        escrowId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to fund escrow',
      };
    }
  }

  async releaseFunds(
    params: ReleaseEscrowParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<EscrowTxResult> {
    try {
      const args = [
        Address.fromString(params.buyer).toScVal(),
        nativeToScVal(params.escrowId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.buyer,
        'release_funds',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        escrowId: params.escrowId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to release escrow funds',
      };
    }
  }

  async refundEscrow(
    params: RefundEscrowParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<EscrowTxResult> {
    try {
      const args = [
        Address.fromString(params.caller).toScVal(),
        nativeToScVal(params.escrowId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.caller,
        'refund_escrow',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        escrowId: params.escrowId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to refund escrow',
      };
    }
  }
}

export const defaultEscrowClient = new EscrowClient();
