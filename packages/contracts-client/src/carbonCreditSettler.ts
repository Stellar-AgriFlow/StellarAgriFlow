import { computeSha256 } from './utils/crypto';

export type RegenerativePractice =
  | 'NO_TILL'
  | 'COVER_CROPPING'
  | 'BIOCHAR_AMENDMENT'
  | 'AGROFORESTRY'
  | 'ROTATIONAL_GRAZING';

export interface SoilCarbonVerification {
  verificationId: string;
  farmId: string;
  hectares: number;
  practice: RegenerativePractice;
  sampleDepthCm: number; // e.g. 30cm standard
  soilOrganicCarbonBaselinePercent: number;
  soilOrganicCarbonCurrentPercent: number;
  verifierPublicKey: string;
  verifiedAtTimestamp: number;
}

export interface CarbonCreditCertificate {
  certificateId: string;
  farmId: string;
  tonsCo2Sequestered: number;
  beneficiary: string;
  retiredAtTimestamp: number;
  memo: string;
  proofHash: string;
  isRetired: boolean;
}

export class CarbonCreditSettler {
  // Approximate standard IPCC / FAO soil organic carbon sequestration factors (tons CO2e / hectare / year)
  public static readonly SEQUESTRATION_FACTORS: Record<RegenerativePractice, number> = {
    NO_TILL: 1.2,
    COVER_CROPPING: 1.8,
    BIOCHAR_AMENDMENT: 3.5,
    AGROFORESTRY: 4.2,
    ROTATIONAL_GRAZING: 2.1,
  };

  public static calculateEstimatedTonsCo2(
    hectares: number,
    practice: RegenerativePractice,
    years: number = 1
  ): number {
    if (hectares <= 0 || years <= 0) return 0;
    const factor = this.SEQUESTRATION_FACTORS[practice] || 1.0;
    return Number((hectares * factor * years).toFixed(2));
  }

  public static calculateLabVerifiedTonsCo2(
    verification: SoilCarbonVerification,
    bulkDensityGramsPerCm3: number = 1.3 // standard agricultural topsoil bulk density
  ): number {
    const deltaSocPercent =
      verification.soilOrganicCarbonCurrentPercent - verification.soilOrganicCarbonBaselinePercent;
    if (deltaSocPercent <= 0 || verification.hectares <= 0) return 0;

    // Soil mass (tons per hectare) = 10,000 m2 * (depth in m) * (density in t/m3)
    const depthMeters = verification.sampleDepthCm / 100;
    const soilMassTonsPerHectare = 10000 * depthMeters * bulkDensityGramsPerCm3;

    // Carbon sequestered = soil mass * delta SOC fraction
    const carbonTonsPerHectare = soilMassTonsPerHectare * (deltaSocPercent / 100);

    // CO2 equivalent factor = 44 / 12 = 3.667
    const co2eTonsPerHectare = carbonTonsPerHectare * (44 / 12);

    return Number((co2eTonsPerHectare * verification.hectares).toFixed(2));
  }

  public static generateRetirementCertificate(
    farmId: string,
    tonsToRetire: number,
    beneficiary: string,
    memo: string,
    retiredAtTimestamp: number = Math.floor(Date.now() / 1000)
  ): CarbonCreditCertificate {
    if (tonsToRetire <= 0) {
      throw new Error('Tons to retire must be greater than zero');
    }
    if (!beneficiary.startsWith('G') && !beneficiary.startsWith('C')) {
      throw new Error(`Invalid beneficiary address: ${beneficiary}`);
    }

    const payload = `${farmId}:${tonsToRetire}:${beneficiary}:${retiredAtTimestamp}:${memo}`;
    const proofHash = computeSha256(payload);
    const certificateId = `CARBON-RET-${proofHash.substring(0, 12).toUpperCase()}`;

    return {
      certificateId,
      farmId,
      tonsCo2Sequestered: tonsToRetire,
      beneficiary,
      retiredAtTimestamp,
      memo,
      proofHash,
      isRetired: true,
    };
  }
}
