import {
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import {
  InsurancePolicyRecord,
  PurchasePolicyParams,
} from '@agriflow/types';
import {
  PARAMETRIC_INSURANCE_CONTRACT_ID,
  getTxExplorerUrl,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export interface InsuranceTxResult {
  successful: boolean;
  policyId?: number;
  payoutAmountXlm?: number;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class ParametricInsuranceClient extends BaseSorobanClient {
  constructor(config?: Partial<BaseClientConfig> | string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || PARAMETRIC_INSURANCE_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async depositLiquidity(
    provider: string,
    amountXlm: number,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<InsuranceTxResult> {
    try {
      const amountStroops = BigInt(Math.round(amountXlm * 10_000_000));
      const args = [
        nativeToScVal(Address.fromString(provider)),
        nativeToScVal(amountStroops, { type: 'i128' }),
      ];

      const { txHash } = await this.invokeContract(
        'deposit_liquidity',
        args,
        provider,
        signer,
        onStateChange
      );

      return {
        successful: true,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to deposit liquidity',
      };
    }
  }

  async purchasePolicy(
    params: PurchasePolicyParams,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<InsuranceTxResult> {
    try {
      const payoutStroops = BigInt(Math.round(params.payoutAmountXlm * 10_000_000));
      const args = [
        nativeToScVal(Address.fromString(params.farmer)),
        nativeToScVal(params.region, { type: 'symbol' }),
        nativeToScVal(params.triggerDroughtIndex, { type: 'u32' }),
        nativeToScVal(payoutStroops, { type: 'i128' }),
        nativeToScVal(params.durationDays, { type: 'u32' }),
      ];

      const { result, txHash } = await this.invokeContract(
        'purchase_policy',
        args,
        params.farmer,
        signer,
        onStateChange
      );

      const policyId = scValToNative(result) as number;
      return {
        successful: true,
        policyId,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to purchase policy',
      };
    }
  }

  async triggerPolicyPayout(
    caller: string,
    policyId: number,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<InsuranceTxResult> {
    try {
      const args = [
        nativeToScVal(Address.fromString(caller)),
        nativeToScVal(policyId, { type: 'u32' }),
      ];

      const { result, txHash } = await this.invokeContract(
        'trigger_policy_payout',
        args,
        caller,
        signer,
        onStateChange
      );

      const payoutStroops = scValToNative(result) as bigint;
      const payoutAmountXlm = Number(payoutStroops) / 10_000_000;

      return {
        successful: true,
        policyId,
        payoutAmountXlm,
        txHash,
        explorerUrl: getTxExplorerUrl(txHash),
      };
    } catch (err) {
      return {
        successful: false,
        error: err instanceof Error ? err.message : 'Failed to trigger policy payout',
      };
    }
  }

  async getTotalLiquidity(): Promise<number> {
    try {
      const result = await this.readContract('get_total_liquidity', []);
      const stroops = scValToNative(result) as bigint;
      return Number(stroops) / 10_000_000;
    } catch {
      return 0;
    }
  }
}
