import { computeSha256 } from './utils/crypto';

export interface SiloPhysicalInventory {
  siloId: string;
  facilityName: string;
  location: string;
  commodityType: string;
  physicalMetricTonnes: number;
  inspectorPublicKey: string;
  inspectionTimestamp: number;
  inspectionCertificateHash: string;
}

export interface CirculatingTokenMetrics {
  tokenContractId: string;
  assetCode: string;
  circulatingTokens: number;
  metricTonnesPerToken: number; // e.g. 1 token = 1 metric tonne
}

export type ReserveHealthStatus =
  | 'OVER_COLLATERALIZED'
  | 'FULLY_COLLATERALIZED'
  | 'UNDER_COLLATERALIZED';

export interface ProofOfReserveEvaluation {
  commodityType: string;
  totalPhysicalMetricTonnes: number;
  requiredBackingMetricTonnes: number;
  collateralizationRatioPercent: number;
  isFullyCollateralized: boolean;
  surplusOrShortfallTonnes: number;
  status: ReserveHealthStatus;
  staleInventoriesCount: number;
  evaluatedAtTimestamp: number;
}

export class ProofOfReserveValidator {
  public static readonly DEFAULT_MAX_INSPECTION_AGE_SECONDS = 86400 * 30; // 30 days

  public static isInspectionFresh(
    inventory: SiloPhysicalInventory,
    currentTime: number = Math.floor(Date.now() / 1000),
    maxAgeSeconds: number = ProofOfReserveValidator.DEFAULT_MAX_INSPECTION_AGE_SECONDS
  ): boolean {
    return currentTime - inventory.inspectionTimestamp <= maxAgeSeconds;
  }

  public static evaluateCollateralization(
    inventories: SiloPhysicalInventory[],
    tokens: CirculatingTokenMetrics,
    currentTime: number = Math.floor(Date.now() / 1000)
  ): ProofOfReserveEvaluation {
    const relevantInventories = inventories.filter(
      (inv) => inv.commodityType.toUpperCase() === tokens.assetCode.toUpperCase()
    );

    let totalPhysical = 0;
    let staleCount = 0;

    for (const inv of relevantInventories) {
      if (this.isInspectionFresh(inv, currentTime)) {
        totalPhysical += inv.physicalMetricTonnes;
      } else {
        staleCount++;
      }
    }

    const requiredBacking = tokens.circulatingTokens * tokens.metricTonnesPerToken;
    const surplusOrShortfall = totalPhysical - requiredBacking;

    let ratioPercent = 100.0;
    if (requiredBacking > 0) {
      ratioPercent = Number(((totalPhysical / requiredBacking) * 100).toFixed(2));
    } else if (totalPhysical > 0) {
      ratioPercent = 999.99;
    }

    let status: ReserveHealthStatus = 'FULLY_COLLATERALIZED';
    if (ratioPercent > 100.0) {
      status = 'OVER_COLLATERALIZED';
    } else if (ratioPercent < 100.0) {
      status = 'UNDER_COLLATERALIZED';
    }

    return {
      commodityType: tokens.assetCode,
      totalPhysicalMetricTonnes: totalPhysical,
      requiredBackingMetricTonnes: requiredBacking,
      collateralizationRatioPercent: ratioPercent,
      isFullyCollateralized: ratioPercent >= 100.0,
      surplusOrShortfallTonnes: Number(surplusOrShortfall.toFixed(2)),
      status,
      staleInventoriesCount: staleCount,
      evaluatedAtTimestamp: currentTime,
    };
  }

  public static generateAttestationDigest(evaluation: ProofOfReserveEvaluation): string {
    const raw = `${evaluation.commodityType}:${evaluation.totalPhysicalMetricTonnes}:${evaluation.requiredBackingMetricTonnes}:${evaluation.collateralizationRatioPercent}:${evaluation.evaluatedAtTimestamp}`;
    return computeSha256(raw);
  }
}
