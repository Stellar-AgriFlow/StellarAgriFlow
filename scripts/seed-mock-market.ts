/**
 * Automated Seed Script for AgriFlow Marketplace & Warehouse Vault
 */
export interface SeedListingItem {
  commodity: string;
  quantityKg: number;
  pricePerKgUsd: number;
  sellerAccount: string;
  moisturePercent: number;
  qualityGrade: number;
}

export const DEMO_MARKET_SEEDS: SeedListingItem[] = [
  {
    commodity: 'Wheat',
    quantityKg: 20000,
    pricePerKgUsd: 0.65,
    sellerAccount: 'GDFARMER_KENYA_001',
    moisturePercent: 12.5,
    qualityGrade: 1,
  },
  {
    commodity: 'White Maize',
    quantityKg: 50000,
    pricePerKgUsd: 0.42,
    sellerAccount: 'GDFARMER_NIGERIA_002',
    moisturePercent: 13.0,
    qualityGrade: 2,
  },
  {
    commodity: 'Soybeans',
    quantityKg: 15000,
    pricePerKgUsd: 1.15,
    sellerAccount: 'GDFARMER_GHANA_003',
    moisturePercent: 11.8,
    qualityGrade: 1,
  },
  {
    commodity: 'Arabica Coffee',
    quantityKg: 5000,
    pricePerKgUsd: 4.85,
    sellerAccount: 'GDFARMER_ETHIOPIA_004',
    moisturePercent: 10.5,
    qualityGrade: 1,
  },
];

export function generateSeedMarketplacePayloads(): SeedListingItem[] {
  return DEMO_MARKET_SEEDS;
}

if (require.main === module) {
  console.log(`Generated ${DEMO_MARKET_SEEDS.length} mock commodity listings for testnet:`);
  console.log(JSON.stringify(DEMO_MARKET_SEEDS, null, 2));
}
