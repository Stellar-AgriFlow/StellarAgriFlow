import { describe, it, expect } from 'vitest';
import { CarbonCreditSettler, SoilCarbonVerification } from '../packages/contracts-client/src/carbonCreditSettler';

describe('CarbonCreditSettler', () => {
  it('calculates practice-based sequestration estimates accurately', () => {
    // 50 hectares agroforestry over 2 years (4.2 factor) -> 50 * 4.2 * 2 = 420 tons CO2e
    const tons = CarbonCreditSettler.calculateEstimatedTonsCo2(50, 'AGROFORESTRY', 2);
    expect(tons).toBe(420);

    const biochar = CarbonCreditSettler.calculateEstimatedTonsCo2(20, 'BIOCHAR_AMENDMENT', 1);
    expect(biochar).toBe(70);
  });

  it('calculates lab-verified soil carbon sequestration from bulk density and SOC delta', () => {
    const verification: SoilCarbonVerification = {
      verificationId: 'VERIF-2026-SOIL-1',
      farmId: 'FARM-KENYA-001',
      hectares: 10,
      practice: 'COVER_CROPPING',
      sampleDepthCm: 30, // 0.3 m
      soilOrganicCarbonBaselinePercent: 1.2,
      soilOrganicCarbonCurrentPercent: 1.6, // +0.4% SOC
      verifierPublicKey: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      verifiedAtTimestamp: 1700000000,
    };

    const tons = CarbonCreditSettler.calculateLabVerifiedTonsCo2(verification, 1.3);
    // Depth: 0.3m, Mass/ha = 10,000 * 0.3 * 1.3 = 3900 t/ha
    // C sequestered/ha = 3900 * 0.004 = 15.6 t
    // CO2e/ha = 15.6 * (44/12) = 57.2 t
    // Total for 10 ha = 572 tons
    expect(tons).toBeGreaterThan(500);
    expect(tons).toBeLessThan(600);
  });

  it('generates cryptographic retirement certificate', () => {
    const cert = CarbonCreditSettler.generateRetirementCertificate(
      'FARM-KENYA-001',
      120.5,
      'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      'Voluntary corporate Scope 3 ESG compensation'
    );

    expect(cert.certificateId).toMatch(/^CARBON-RET-[A-Z0-9]{12}$/);
    expect(cert.tonsCo2Sequestered).toBe(120.5);
    expect(cert.isRetired).toBe(true);
    expect(cert.proofHash).toHaveLength(64);
  });
});
