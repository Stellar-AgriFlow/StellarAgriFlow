import { describe, it, expect } from 'vitest';

export interface StakerRecord {
  member: string;
  stakedAmount: number;
}

export function distributeDividends(
  totalSurplusDividend: number,
  stakers: StakerRecord[]
): Map<string, number> {
  const result = new Map<string, number>();
  const totalStaked = stakers.reduce((acc, s) => acc + s.stakedAmount, 0);

  if (totalStaked <= 0 || totalSurplusDividend <= 0) {
    stakers.forEach((s) => result.set(s.member, 0));
    return result;
  }

  let allocated = 0;
  for (let i = 0; i < stakers.length; i++) {
    const s = stakers[i];
    if (i === stakers.length - 1) {
      // Allocate remainder to avoid rounding dust
      result.set(s.member, totalSurplusDividend - allocated);
    } else {
      const share = Math.floor((s.stakedAmount / totalStaked) * totalSurplusDividend);
      result.set(s.member, share);
      allocated += share;
    }
  }

  return result;
}

export function calculateSeasonalApy(yieldEarned: number, principal: number, daysStaked: number): number {
  if (principal <= 0 || daysStaked <= 0) return 0;
  const annualized = (yieldEarned / principal) * (365 / daysStaked) * 100;
  return Number(annualized.toFixed(2));
}

describe('Cooperative Dividend Yield & Surplus Distribution Math', () => {
  const stakers: StakerRecord[] = [
    { member: 'GDFARMER1', stakedAmount: 10000 },
    { member: 'GDFARMER2', stakedAmount: 20000 },
    { member: 'GDFARMER3', stakedAmount: 10000 },
  ];

  it('distributes collective surplus proportionally according to staked capital', () => {
    const surplus = 4000; // 40,000 total staked -> 10% dividend
    const dividends = distributeDividends(surplus, stakers);

    expect(dividends.get('GDFARMER1')).toBe(1000);
    expect(dividends.get('GDFARMER2')).toBe(2000);
    expect(dividends.get('GDFARMER3')).toBe(1000);
  });

  it('guarantees 100% of surplus is allocated with zero loss to dust rounding', () => {
    const oddSurplus = 3333;
    const dividends = distributeDividends(oddSurplus, stakers);

    let sum = 0;
    dividends.forEach((val) => {
      sum += val;
    });
    expect(sum).toBe(oddSurplus);
  });

  it('computes accurate seasonal APY based on holding duration', () => {
    // 500 earned on 10,000 in 90 days
    const apy = calculateSeasonalApy(500, 10000, 90);
    // (500 / 10000) * (365 / 90) * 100 = 5 * 4.0555 = 20.28%
    expect(apy).toBe(20.28);
  });

  it('handles empty or zero stake cohorts gracefully', () => {
    const emptyResult = distributeDividends(1000, []);
    expect(emptyResult.size).toBe(0);

    const zeroStakers = [
      { member: 'GDFARMER1', stakedAmount: 0 },
      { member: 'GDFARMER2', stakedAmount: 0 },
    ];
    const zeroResult = distributeDividends(1000, zeroStakers);
    expect(zeroResult.get('GDFARMER1')).toBe(0);
    expect(zeroResult.get('GDFARMER2')).toBe(0);
  });
});
