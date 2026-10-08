import {
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import {
  FinancingRequest,
  CreateFinancingRequestParams,
  FundFinancingParams,
  RepayFinancingParams,
} from '@agriflow/types';
import {
  AGRICULTURAL_FINANCE_CONTRACT_ID,
  getTxExplorerUrl,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export interface FinanceTxResult {
  successful: boolean;
  requestId?: number;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class FinanceClient extends BaseSorobanClient {
  constructor(
    config?: Partial<BaseClientConfig> | string
  ) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || AGRICULTURAL_FINANCE_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async createFinancingRequest(
    params: CreateFinancingRequestParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<FinanceTxResult> {
    try {
      const requestedAmountStroops = BigInt(
        Math.round(params.requestedAmountXlm * 10_000_000)
      );
      const interestRate = params.interestRatePercent || 5.0; // 5% default
      const expectedRepaymentStroops = BigInt(
        Math.round(
          params.requestedAmountXlm * (1 + interestRate / 100) * 10_000_000
        )
      );

      const args = [
        Address.fromString(params.farmer).toScVal(),
        nativeToScVal(params.farmId, { type: 'symbol' }),
        nativeToScVal(requestedAmountStroops, { type: 'i128' }),
        nativeToScVal(expectedRepaymentStroops, { type: 'i128' }),
        nativeToScVal(params.purpose.replace(/\s+/g, '_'), { type: 'symbol' }),
        nativeToScVal(params.durationDays, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.farmer,
        'create_financing_request',
        args,
        signer,
        onStateChange
      );

      const requestId = Math.floor(Date.now() / 1000) % 10000;
      return {
        successful: true,
        requestId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to create financing request',
      };
    }
  }

  async fundRequest(
    params: FundFinancingParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<FinanceTxResult> {
    try {
      const args = [
        Address.fromString(params.funder).toScVal(),
        nativeToScVal(params.requestId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.funder,
        'fund_request',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        requestId: params.requestId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to fund financing request',
      };
    }
  }

  async recordRepayment(
    params: RepayFinancingParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<FinanceTxResult> {
    try {
      const args = [
        Address.fromString(params.farmer).toScVal(),
        nativeToScVal(params.requestId, { type: 'u32' }),
      ];

      const res = await this.executeContractCall(
        params.farmer,
        'record_repayment',
        args,
        signer,
        onStateChange
      );

      return {
        successful: true,
        requestId: params.requestId,
        txHash: res.txHash,
        explorerUrl: getTxExplorerUrl(res.txHash),
      };
    } catch (err: any) {
      return {
        successful: false,
        error: err.message || 'Failed to record repayment',
      };
    }
  }
}

export const defaultFinanceClient = new FinanceClient();
