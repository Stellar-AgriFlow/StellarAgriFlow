export interface AccountMergeParams {
  sourceAccount: string;
  destinationAccount: string;
}

export interface AccountMergeResult {
  sourceAccount: string;
  destinationAccount: string;
  estimatedReclaimedXlm: number;
  isValid: boolean;
  reason?: string;
}

export class AccountMergeRecovery {
  public static readonly BASE_RESERVE_XLM = 1.0;
  public static readonly SUBENTRY_RESERVE_XLM = 0.5;

  /**
   * Evaluates safety and validates parameters for reclaiming account reserves via AccountMerge
   */
  static planAccountMerge(
    params: AccountMergeParams,
    subentriesCount: number = 0,
    nativeBalanceXlm: number = 1.0
  ): AccountMergeResult {
    if (!params.sourceAccount || params.sourceAccount.length !== 56 || !params.sourceAccount.startsWith('G')) {
      return {
        sourceAccount: params.sourceAccount,
        destinationAccount: params.destinationAccount,
        estimatedReclaimedXlm: 0,
        isValid: false,
        reason: 'Invalid source Stellar public key',
      };
    }

    if (!params.destinationAccount || params.destinationAccount.length !== 56 || !params.destinationAccount.startsWith('G')) {
      return {
        sourceAccount: params.sourceAccount,
        destinationAccount: params.destinationAccount,
        estimatedReclaimedXlm: 0,
        isValid: false,
        reason: 'Invalid destination Stellar public key',
      };
    }

    if (params.sourceAccount === params.destinationAccount) {
      return {
        sourceAccount: params.sourceAccount,
        destinationAccount: params.destinationAccount,
        estimatedReclaimedXlm: 0,
        isValid: false,
        reason: 'Source and destination accounts cannot be identical',
      };
    }

    // When merging, the entire native XLM balance (including locked base reserves) transfers to destination
    const reclaimed = Math.max(0, nativeBalanceXlm);

    return {
      sourceAccount: params.sourceAccount,
      destinationAccount: params.destinationAccount,
      estimatedReclaimedXlm: Number(reclaimed.toFixed(7)),
      isValid: true,
    };
  }
}
