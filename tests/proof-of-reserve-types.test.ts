import { describe, it, expect } from 'vitest';
import { PhysicalSiloAuditAttestation, ProofOfReserveFeedSnapshot } from '../packages/types/src/proofOfReserve';

describe('Proof of Reserve Types', () => {
  it('instantiates valid PhysicalSiloAuditAttestation and ProofOfReserveFeedSnapshot', () => {
    const audit: PhysicalSiloAuditAttestation = {
      auditId: 'AUDIT-SILO-001',
      siloId: 'SILO-ELDORET-1',
      facilityName: 'Eldoret Hub Silo',
      locationCity: 'Eldoret',
      locationCountry: 'Kenya',
      commoditySymbol: 'MAIZE',
      commodityGrade: 'GRADE_1_PREMIUM',
      verifiedMetricTonnes: 1250,
      inspectorAddress: 'G' + 'A'.repeat(55),
      auditDateTimestamp: Date.now(),
      certificateIpfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    };

    const snapshot: ProofOfReserveFeedSnapshot = {
      snapshotId: 'SNAP-POR-100',
      timestamp: Date.now(),
      commoditySymbol: 'MAIZE',
      tokenContractId: 'C' + 'B'.repeat(55),
      circulatingTokenSupply: 1000,
      verifiedPhysicalTonnes: 1250,
      collateralizationRatio: 1.25,
      isSolvent: true,
      auditorCount: 3,
    };

    expect(audit.commodityGrade).toBe('GRADE_1_PREMIUM');
    expect(audit.verifiedMetricTonnes).toBe(1250);
    expect(snapshot.isSolvent).toBe(true);
    expect(snapshot.collateralizationRatio).toBe(1.25);
  });
});
