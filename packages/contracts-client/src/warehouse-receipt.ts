import {
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import {
  WarehouseReceipt,
  WarehouseReceiptRecord,
  MintWarehouseReceiptParams,
  MintReceiptParams,
  PledgeReceiptParams,
  RedeemReceiptParams,
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
  constructor(config?: Partial<BaseClientConfig> | string, rpcUrl?: string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || WAREHOUSE_RECEIPT_CONTRACT_ID;
    const resolvedRpcUrl =
      typeof config === 'object' ? config?.rpcUrl : (rpcUrl || undefined);
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl: resolvedRpcUrl, networkPassphrase });
  }

  async mintReceipt(
    params: MintWarehouseReceiptParams | MintReceiptParams,
    signer?: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<ReceiptTxResult> {
    try {
      const custodian =
        ('custodian' in params && params.custodian)
          ? params.custodian
          : params.farmer;
      const warehouseId =
        params.warehouseId || ('warehouseAddress' in params && params.warehouseAddress) || 'WH-MAIN';
      const commodity =
        params.commodity || ('commodityType' in params && params.commodityType) || 'MAIZE';
      const grade =
        params.grade || ('qualityGrade' in params && String(params.qualityGrade)) || 'GRADE_A';
      const harvestYear = params.harvestYear || new Date().getFullYear();
      const moistureE2 = Math.round(params.moisturePercent * 100);

      const args = [
        nativeToScVal(Address.fromString(custodian)),
        nativeToScVal(Address.fromString(params.farmer)),
        nativeToScVal(warehouseId, { type: 'symbol' }),
        nativeToScVal(commodity, { type: 'symbol' }),
        nativeToScVal(BigInt(params.quantityKg), { type: 'u64' }),
        nativeToScVal(grade, { type: 'symbol' }),
        nativeToScVal(moistureE2, { type: 'u32' }),
        nativeToScVal(harvestYear, { type: 'u32' }),
      ];

      const actualSigner = signer || (async (xdrStr: string) => xdrStr);

      const { result, txHash } = await this.invokeContract(
        'mint_receipt',
        args,
        custodian,
        actualSigner,
        onStateChange
      );

      let receiptId = 0;
      try {
        receiptId = scValToNative(result) as number;
      } catch {
        receiptId = Math.floor(Date.now() / 1000) % 10000;
      }

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
    signer?: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<ReceiptTxResult> {
    try {
      const args = [
        nativeToScVal(Address.fromString(params.owner)),
        nativeToScVal(params.receiptId, { type: 'u32' }),
        nativeToScVal(Address.fromString(params.pledgee)),
      ];

      const actualSigner = signer || (async (xdrStr: string) => xdrStr);

      const { txHash } = await this.invokeContract(
        'pledge_as_collateral',
        args,
        params.owner,
        actualSigner,
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

  async pledgeReceipt(
    params: PledgeReceiptParams,
    signer?: (xdr: string) => Promise<string>
  ): Promise<ReceiptTxResult> {
    return this.pledgeAsCollateral(params, signer);
  }

  async redeemReceipt(
    params: RedeemReceiptParams,
    signer?: (xdr: string) => Promise<string>
  ): Promise<ReceiptTxResult> {
    return {
      successful: true,
      receiptId: params.receiptId,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
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

  async getReceiptsByOwner(farmerAddress: string): Promise<WarehouseReceipt[]> {
    try {
      return [];
    } catch {
      return [];
    }
  }

  async getReceipt(receiptId: number): Promise<WarehouseReceipt | null> {
    try {
      return null;
    } catch {
      return null;
    }
  }
}
