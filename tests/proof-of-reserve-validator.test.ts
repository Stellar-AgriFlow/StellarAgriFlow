import { describe, it, expect } from 'vitest';
import {
  ProofOfReserveValidator,
  SiloPhysicalInventory,
  CirculatingTokenMetrics,
} from '../packages/contracts-client/src/proofOfReserveValidator';

describe('ProofOfReserveValidator', () => {
  const baseTime = 1700000000;

  const silos: SiloPhysicalInventory[] = [
    {
      siloId: 'SILO-ELDORET-01',
      facilityName: 'Eldoret National Cereals Silo A',
      location: 'Eldoret, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 600,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: baseTime - 3600 * 24 * 5, // 5 days ago (fresh)
      inspectionCertificateHash: 'hash_cert_eldoret_1',
    },
    {
      siloId: 'SILO-NAKURU-02',
      facilityName: 'Nakuru Grain Reserve Silo B',
      location: 'Nakuru, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 450,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: baseTime - 3600 * 24 * 10, // 10 days ago (fresh)
      inspectionCertificateHash: 'hash_cert_nakuru_2',
    },
    {
      siloId: 'SILO-MOMBASA-OLD',
      facilityName: 'Mombasa Port Silo C',
      location: 'Mombasa, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 200,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: baseTime - 3600 * 24 * 45, // 45 days ago (> 30 days STALE!)
      inspectionCertificateHash: 'hash_cert_mombasa_old',
    },
  ];

  it('correctly evaluates over-collateralized proof of reserve and filters stale audits', () => {
    // 1000 tokens circulating, 1 token = 1 metric tonne -> 1000 required backing
    // Fresh physical = 600 + 450 = 1050 tonnes (stale 200 excluded)
    // Ratio = 1050 / 1000 = 105.0%
    const tokenMetrics: CirculatingTokenMetrics = {
      tokenContractId: 'C' + 'A'.repeat(55),
      assetCode: 'MAIZE',
      circulatingTokens: 1000,
      metricTonnesPerToken: 1.0,
    };

    const evaluation = ProofOfReserveValidator.evaluateCollateralization(silos, tokenMetrics, baseTime);

    expect(evaluation.isFullyCollateralized).toBe(true);
    expect(evaluation.status).toBe('OVER_COLLATERALIZED');
    expect(evaluation.totalPhysicalMetricTonnes).toBe(1050);
    expect(evaluation.requiredBackingMetricTonnes).toBe(1000);
    expect(evaluation.collateralizationRatioPercent).toBe(105.0);
    expect(evaluation.surplusOrShortfallTonnes).toBe(50);
    expect(evaluation.staleInventoriesCount).toBe(1);

    const digest = ProofOfReserveValidator.generateAttestationDigest(evaluation);
    expect(digest).toHaveLength(64);
  });

  it('detects under-collateralization when required tokens exceed physical reserves', () => {
    const tokenMetrics: CirculatingTokenMetrics = {
      tokenContractId: 'C' + 'A'.repeat(55),
      assetCode: 'MAIZE',
      circulatingTokens: 1500, // 1500 required > 1050 fresh physical
      metricTonnesPerToken: 1.0,
    };

    const evaluation = ProofOfReserveValidator.evaluateCollateralization(silos, tokenMetrics, baseTime);

    expect(evaluation.isFullyCollateralized).toBe(false);
    expect(evaluation.status).toBe('UNDER_COLLATERALIZED');
    expect(evaluation.collateralizationRatioPercent).toBe(70.0); // 1050 / 1500 = 70%
    expect(evaluation.surplusOrShortfallTonnes).toBe(-450);
  });
});
