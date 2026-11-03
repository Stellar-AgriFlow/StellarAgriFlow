import {
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import {
  WarehouseReceiptRecord,
  MintWarehouseReceiptParams,
  PledgeReceiptParams,
  TransferReceiptParams,
} from '@agriflow/types';
import {
  WAREHOUSE_RECEIPT_CONTRACT_ID,
  getTxExplorerUrl,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export interface ReceiptTxResult {
  successful: boolean;
  receiptId?: number;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class WarehouseReceiptClient extends BaseSorobanClient {
  constructor(config?: Partial<BaseClientConfig> | string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || WAREHOUSE_RECEIPT_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async mintReceipt(
    params: MintWarehouseReceiptParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<ReceiptTxResult> {
    try {
      const moistureE2 = Math.round(params.moisturePercent * 100);
      const args = [
        nativeToScVal(Address.fromString(params.custodian)),
        nativeToScVal(Address.fromString(params.farmer)),
        nativeToScVal(params.warehouseId, { type: 'symbol' }),
        nativeToScVal(params.commodity, { type: 'symbol' }),
        nativeToScVal(BigInt(params.quantityKg), { type: 'u64' }),
        nativeToScVal(params.grade, { type: 'symbol' }),
        nativeToScVal(moistureE2, { type: 'u32' }),
        nativeToScVal(params.harvestYear, { type: 'u32' }),
      ];

      const { result, txHash } = await this.invokeContract(
        'mint_receipt',
        args,
        params.custodian,
        signer,
        onStateChange
      );

      const receiptId = scValToNative(result) as number;
      return {
        successful: true,
        receiptId,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to mint receipt',
      };
    }
  }

  async pledgeAsCollateral(
    params: PledgeReceiptParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<ReceiptTxResult> {
    try {
      const args = [
        nativeToScVal(Address.fromString(params.owner)),
        nativeToScVal(params.receiptId, { type: 'u32' }),
        nativeToScVal(Address.fromString(params.pledgee)),
      ];

      const { txHash } = await this.invokeContract(
        'pledge_as_collateral',
        args,
        params.owner,
        signer,
        onStateChange
      );

      return {
        successful: true,
        receiptId: params.receiptId,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to pledge receipt',
      };
    }
  }

  async transferReceipt(
    params: TransferReceiptParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<ReceiptTxResult> {
    try {
      const args = [
        nativeToScVal(Address.fromString(params.currentOwner)),
        nativeToScVal(params.receiptId, { type: 'u32' }),
        nativeToScVal(Address.fromString(params.newOwner)),
      ];

      const { txHash } = await this.invokeContract(
        'transfer_receipt',
        args,
        params.currentOwner,
        signer,
        onStateChange
      );

      return {
        successful: true,
        receiptId: params.receiptId,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to transfer receipt',
      };
    }
  }

  async getReceiptCount(): Promise<number> {
    try {
      const result = await this.readContract('get_receipt_count', []);
      return scValToNative(result) as number;
    } catch {
      return 0;
    }
  }
}
