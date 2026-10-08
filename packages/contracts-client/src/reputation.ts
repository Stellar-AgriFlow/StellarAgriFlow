import {
  Address,
  scValToNative,
} from '@stellar/stellar-sdk';
import { ReputationRecord } from '@agriflow/types';
import {
  AGRICULTURAL_REPUTATION_CONTRACT_ID,
} from '@agriflow/stellar';
import { BaseSorobanClient, BaseClientConfig } from './base';

export class ReputationClient extends BaseSorobanClient {
  constructor(
    config?: Partial<BaseClientConfig> | string
  ) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || AGRICULTURAL_REPUTATION_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  async getReputation(userAddress: string): Promise<ReputationRecord> {
    try {
      const defaultRecord: ReputationRecord = {
        user: userAddress,
        successfulTrades: 0,
        completedFinancing: 0,
        successfulRepayments: 0,
        completedEscrows: 0,
        reputationScore: 100,
        trustTier: 'Bronze',
        updatedAt: Date.now(),
      };

      return defaultRecord;
    } catch {
      return {
        user: userAddress,
        successfulTrades: 0,
        completedFinancing: 0,
        successfulRepayments: 0,
        completedEscrows: 0,
        reputationScore: 100,
        trustTier: 'Bronze',
        updatedAt: Date.now(),
      };
    }
  }

  calculateTrustTier(score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
    if (score >= 250) return 'Platinum';
    if (score >= 180) return 'Gold';
    if (score >= 130) return 'Silver';
    return 'Bronze';
  }
}

export const defaultReputationClient = new ReputationClient();
