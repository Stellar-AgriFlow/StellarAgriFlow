import {
  ProofOfReserveValidator,
  SiloPhysicalInventory,
  CirculatingTokenMetrics,
  ProofOfReserveEvaluation,
} from '../packages/contracts-client/src/proofOfReserveValidator';

export interface ProofOfReserveSimulationReport {
  timestamp: number;
  evaluatedCommodity: string;
  totalSilosCount: number;
  activeFreshSilosCount: number;
  evaluation: ProofOfReserveEvaluation;
  attestationDigest: string;
  isSolventAndVerified: boolean;
}

export function simulateProofOfReserveWorkflow(): ProofOfReserveSimulationReport {
  const currentTime = Math.floor(Date.now() / 1000);

  const silos: SiloPhysicalInventory[] = [
    {
      siloId: 'SILO-ELDORET-MAIN',
      facilityName: 'Eldoret Regional Grain Elevator',
      location: 'Uasin Gishu County, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 1450,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: currentTime - 86400 * 3, // 3 days ago
      inspectionCertificateHash: 'sha256_cert_eldoret_grain_2026',
    },
    {
      siloId: 'SILO-NAKURU-EAST',
      facilityName: 'Nakuru Silo Depot 2',
      location: 'Nakuru County, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 820,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: currentTime - 86400 * 7, // 7 days ago
      inspectionCertificateHash: 'sha256_cert_nakuru_grain_2026',
    },
    {
      siloId: 'SILO-KITALE-WEST',
      facilityName: 'Kitale Agricultural Hub Silo',
      location: 'Trans-Nzoia County, Kenya',
      commodityType: 'MAIZE',
      physicalMetricTonnes: 980,
      inspectorPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      inspectionTimestamp: currentTime - 86400 * 12, // 12 days ago
      inspectionCertificateHash: 'sha256_cert_kitale_grain_2026',
    },
  ];

  const circulatingTokens: CirculatingTokenMetrics = {
    tokenContractId: 'CMAIZETOKEN7777777777777777777777777777777777777777777777',
    assetCode: 'MAIZE',
    circulatingTokens: 3000, // 3,000 tokens in circulation
    metricTonnesPerToken: 1.0, // each token backed by 1 tonne
  };

  // Total physical = 1450 + 820 + 980 = 3250 tonnes
  // Required backing = 3000 tonnes
  // Collateralization = 3250 / 3000 = 108.33%
  const evaluation = ProofOfReserveValidator.evaluateCollateralization(silos, circulatingTokens, currentTime);
  const digest = ProofOfReserveValidator.generateAttestationDigest(evaluation);

  return {
    timestamp: currentTime,
    evaluatedCommodity: 'MAIZE',
    totalSilosCount: silos.length,
    activeFreshSilosCount: silos.length - evaluation.staleInventoriesCount,
    evaluation,
    attestationDigest: digest,
    isSolventAndVerified: evaluation.isFullyCollateralized && evaluation.collateralizationRatioPercent >= 100,
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const rep = simulateProofOfReserveWorkflow();
  console.log('--- Proof of Reserve Physical Silo Audit Simulation ---');
  console.log(JSON.stringify(rep, null, 2));
}
