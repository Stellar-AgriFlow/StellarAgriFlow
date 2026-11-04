import { describe, it, expect } from 'vitest';
import { ReputationBondEscrow } from '../packages/contracts-client/src/reputationBondEscrow';

describe('ReputationBondEscrow', () => {
  const farmer = 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL';
  const buyer = 'GCORGFARMER555KLSADJFOEWIRUDKL99';

  it('manages successful deposit and clean release of performance bond', () => {
    const escrow = new ReputationBondEscrow();

    const bond = escrow.depositBond(farmer, buyer, 1000, 'CONTRACT-FWD-101');
    expect(bond.status).toBe('ACTIVE');
    expect(bond.stakeAmount).toBe(1000);

    const released = escrow.releaseBond(bond.bondId);
    expect(released.status).toBe('RELEASED');
    expect(released.releasedAmount).toBe(1000);
    expect(released.slashedAmount).toBe(0);
  });

  it('correctly executes partial slashing for delivery shortfall', () => {
    const escrow = new ReputationBondEscrow();
    const bond = escrow.depositBond(farmer, buyer, 2000, 'CONTRACT-FWD-102');

    // 25% slash penalty for moisture defect
    const result = escrow.slashBond(bond.bondId, 0.25, 'Grain moisture exceeded 13.5% standard');

    expect(result.penaltyAmount).toBe(500);
    expect(result.returnedAmount).toBe(1500);
    expect(result.bond.status).toBe('SLASHED');
    expect(result.bond.slashingReason).toContain('moisture exceeded');
  });

  it('rejects invalid slash fraction', () => {
    const escrow = new ReputationBondEscrow();
    const bond = escrow.depositBond(farmer, buyer, 500, 'CONTRACT-FWD-103');

    expect(() => {
      escrow.slashBond(bond.bondId, 1.5, 'Invalid excess');
    }).toThrow(/between 0.01 and 1.0/);
  });
});
