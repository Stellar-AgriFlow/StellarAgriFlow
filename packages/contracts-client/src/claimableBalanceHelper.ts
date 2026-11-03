export interface ClaimantCondition {
  claimant: string;
  notBeforeTimestamp?: number;
  notAfterTimestamp?: number;
}

export interface ClaimableBalancePlan {
  assetCode: string;
  amount: number;
  sponsor: string;
  claimants: ClaimantCondition[];
  isValid: boolean;
  reason?: string;
  predicateDescription: string;
}

export class ClaimableBalanceHelper {
  /**
   * Plans a Stellar Claimable Balance with conditional time-locked predicates
   */
  static planClaimableBalance(
    sponsor: string,
    assetCode: string,
    amount: number,
    claimants: ClaimantCondition[]
  ): ClaimableBalancePlan {
    if (!sponsor || sponsor.length !== 56 || !sponsor.startsWith('G')) {
      return {
        assetCode,
        amount,
        sponsor,
        claimants,
        isValid: false,
        reason: 'Invalid sponsor Stellar address',
        predicateDescription: 'Invalid',
      };
    }

    if (amount <= 0) {
      return {
        assetCode,
        amount,
        sponsor,
        claimants,
        isValid: false,
        reason: 'Claimable balance amount must be positive',
        predicateDescription: 'Invalid',
      };
    }

    if (!claimants || claimants.length === 0) {
      return {
        assetCode,
        amount,
        sponsor,
        claimants,
        isValid: false,
        reason: 'At least one claimant condition must be specified',
        predicateDescription: 'Invalid',
      };
    }

    for (const c of claimants) {
      if (!c.claimant || c.claimant.length !== 56 || !c.claimant.startsWith('G')) {
        return {
          assetCode,
          amount,
          sponsor,
          claimants,
          isValid: false,
          reason: `Invalid claimant address: ${c.claimant}`,
          predicateDescription: 'Invalid',
        };
      }
    }

    const descriptions = claimants.map((c) => {
      const parts: string[] = [`Claimant ${c.claimant.slice(0, 6)}...`];
      if (c.notBeforeTimestamp) parts.push(`Unlocks at ${new Date(c.notBeforeTimestamp * 1000).toISOString()}`);
      if (c.notAfterTimestamp) parts.push(`Expires at ${new Date(c.notAfterTimestamp * 1000).toISOString()}`);
      return parts.join(' | ');
    });

    return {
      assetCode,
      amount,
      sponsor,
      claimants,
      isValid: true,
      predicateDescription: descriptions.join('; '),
    };
  }
}
