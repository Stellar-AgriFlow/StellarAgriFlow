import { ParametricInsuranceClient } from '@agriflow/contracts-client';
import {
  ParametricPolicy,
  CreatePolicyParams,
  DepositCapitalParams,
  WithdrawCapitalParams,
  LiquidityPoolStatus,
} from '@agriflow/types';

export class InsurancePoolService {
  private client: ParametricInsuranceClient;

  constructor(contractId: string, rpcUrl?: string) {
    this.client = new ParametricInsuranceClient(contractId, rpcUrl);
  }

  /**
   * Fetch current liquidity pool solvency status and reserve ratios
   */
  async getPoolStatus(userAddress?: string): Promise<LiquidityPoolStatus> {
    return this.client.getPoolStatus(userAddress);
  }

  /**
   * Underwrite a new parametric drought or flood weather insurance policy
   */
  async underwritePolicy(params: CreatePolicyParams) {
    return this.client.underwritePolicy(params);
  }

  /**
   * Fetch all policies owned by a specific farmer
   */
  async getFarmerPolicies(farmerAddress: string): Promise<ParametricPolicy[]> {
    return this.client.getPoliciesByFarmer(farmerAddress);
  }

  /**
   * Provide capital to the decentralized reinsurance pool and receive LP shares
   */
  async depositLiquidity(params: DepositCapitalParams) {
    return this.client.depositCapital(params);
  }

  /**
   * Withdraw capital from the reinsurance pool by burning proportional LP shares
   */
  async withdrawLiquidity(params: WithdrawCapitalParams) {
    return this.client.withdrawCapital(params);
  }

  /**
   * Execute automated oracle-triggered payout evaluation for a policy
   */
  async evaluateClaim(policyId: number, callerAddress: string) {
    return this.client.executeClaimPayout({ policyId, caller: callerAddress });
  }

  /**
   * Check if a policy is eligible for claim trigger evaluation
   */
  static isPolicyClaimable(policy: ParametricPolicy, currentTimestamp: number): boolean {
    return policy.status === 'Active' && currentTimestamp <= policy.expirationTime;
  }
}
