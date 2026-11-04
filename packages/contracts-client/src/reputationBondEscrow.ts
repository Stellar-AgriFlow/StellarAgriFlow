export type BondStatus = 'ACTIVE' | 'RELEASED' | 'SLASHED' | 'DISPUTED';

export interface ReputationBondRecord {
  bondId: string;
  farmerAddress: string;
  buyerAddress: string;
  contractId: string;
  stakeAmount: number;
  status: BondStatus;
  slashedAmount: number;
  releasedAmount: number;
  slashingReason?: string;
  disputeNotes?: string;
  createdAtTimestamp: number;
  resolvedAtTimestamp?: number;
}

export class ReputationBondEscrow {
  private bonds: Map<string, ReputationBondRecord> = new Map();
  private bondCounter = 0;

  public depositBond(
    farmerAddress: string,
    buyerAddress: string,
    stakeAmount: number,
    contractId: string
  ): ReputationBondRecord {
    if (stakeAmount <= 0) {
      throw new Error('Stake amount must be greater than zero');
    }
    if (!farmerAddress.startsWith('G') && !farmerAddress.startsWith('C')) {
      throw new Error(`Invalid farmer address: ${farmerAddress}`);
    }

    const bondId = `BOND-AGRI-${++this.bondCounter}`;
    const record: ReputationBondRecord = {
      bondId,
      farmerAddress,
      buyerAddress,
      contractId,
      stakeAmount,
      status: 'ACTIVE',
      slashedAmount: 0,
      releasedAmount: 0,
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };

    this.bonds.set(bondId, record);
    return record;
  }

  public releaseBond(bondId: string): ReputationBondRecord {
    const bond = this.bonds.get(bondId);
    if (!bond) throw new Error(`Bond ${bondId} not found`);
    if (bond.status !== 'ACTIVE') {
      throw new Error(`Cannot release bond in status ${bond.status}`);
    }

    bond.status = 'RELEASED';
    bond.releasedAmount = bond.stakeAmount;
    bond.resolvedAtTimestamp = Math.floor(Date.now() / 1000);
    return bond;
  }

  public slashBond(
    bondId: string,
    slashFraction: number,
    reason: string
  ): { bond: ReputationBondRecord; penaltyAmount: number; returnedAmount: number } {
    const bond = this.bonds.get(bondId);
    if (!bond) throw new Error(`Bond ${bondId} not found`);
    if (bond.status !== 'ACTIVE') {
      throw new Error(`Cannot slash bond in status ${bond.status}`);
    }
    if (slashFraction <= 0 || slashFraction > 1.0) {
      throw new Error('Slash fraction must be between 0.01 and 1.0');
    }

    const penaltyAmount = Number((bond.stakeAmount * slashFraction).toFixed(2));
    const returnedAmount = Number((bond.stakeAmount - penaltyAmount).toFixed(2));

    bond.status = 'SLASHED';
    bond.slashedAmount = penaltyAmount;
    bond.releasedAmount = returnedAmount;
    bond.slashingReason = reason;
    bond.resolvedAtTimestamp = Math.floor(Date.now() / 1000);

    return {
      bond,
      penaltyAmount,
      returnedAmount,
    };
  }

  public getBond(bondId: string): ReputationBondRecord | undefined {
    return this.bonds.get(bondId);
  }
}
