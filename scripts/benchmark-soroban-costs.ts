/**
 * Soroban Smart Contract Resource & Fee Benchmark Calculator
 * Calculates estimated CPU instructions, RAM footprint, and stroop inclusion fees for AgriFlow contracts.
 */

export interface ContractCostProfile {
  contractName: string;
  operation: string;
  estimatedCpuInstructions: number;
  memoryBytes: number;
  ledgerReadBytes: number;
  ledgerWriteBytes: number;
  estimatedFeeStroops: number;
  withinMainnetLimits: boolean;
}

export const SOROBAN_MAINNET_LIMITS = {
  MAX_CPU_INSTRUCTIONS: 100_000_000,
  MAX_MEMORY_BYTES: 41_943_040, // 40 MB
  BASE_FEE_STROOPS: 100,
};

export const CONTRACT_BENCHMARKS: ContractCostProfile[] = [
  {
    contractName: 'farm-registry',
    operation: 'register_farm',
    estimatedCpuInstructions: 1_250_000,
    memoryBytes: 65_536,
    ledgerReadBytes: 1_024,
    ledgerWriteBytes: 2_048,
    estimatedFeeStroops: 4_500,
    withinMainnetLimits: true,
  },
  {
    contractName: 'agricultural-finance',
    operation: 'fund_loan',
    estimatedCpuInstructions: 3_800_000,
    memoryBytes: 131_072,
    ledgerReadBytes: 4_096,
    ledgerWriteBytes: 4_096,
    estimatedFeeStroops: 12_800,
    withinMainnetLimits: true,
  },
  {
    contractName: 'agricultural-escrow',
    operation: 'release_funds',
    estimatedCpuInstructions: 2_100_000,
    memoryBytes: 98_304,
    ledgerReadBytes: 2_048,
    ledgerWriteBytes: 3_072,
    estimatedFeeStroops: 7_200,
    withinMainnetLimits: true,
  },
  {
    contractName: 'agricultural-marketplace',
    operation: 'purchase_listing',
    estimatedCpuInstructions: 3_200_000,
    memoryBytes: 114_688,
    ledgerReadBytes: 3_584,
    ledgerWriteBytes: 4_096,
    estimatedFeeStroops: 10_500,
    withinMainnetLimits: true,
  },
  {
    contractName: 'agricultural-reputation',
    operation: 'record_repayment',
    estimatedCpuInstructions: 950_000,
    memoryBytes: 49_152,
    ledgerReadBytes: 1_024,
    ledgerWriteBytes: 1_024,
    estimatedFeeStroops: 3_800,
    withinMainnetLimits: true,
  },
  {
    contractName: 'warehouse-receipt',
    operation: 'mint_receipt',
    estimatedCpuInstructions: 2_400_000,
    memoryBytes: 81_920,
    ledgerReadBytes: 2_048,
    ledgerWriteBytes: 3_584,
    estimatedFeeStroops: 8_900,
    withinMainnetLimits: true,
  },
  {
    contractName: 'parametric-insurance',
    operation: 'trigger_payout',
    estimatedCpuInstructions: 4_500_000,
    memoryBytes: 163_840,
    ledgerReadBytes: 5_120,
    ledgerWriteBytes: 6_144,
    estimatedFeeStroops: 16_200,
    withinMainnetLimits: true,
  },
  {
    contractName: 'collateral-liquidation',
    operation: 'buy_collateral',
    estimatedCpuInstructions: 3_600_000,
    memoryBytes: 122_880,
    ledgerReadBytes: 4_096,
    ledgerWriteBytes: 5_120,
    estimatedFeeStroops: 13_100,
    withinMainnetLimits: true,
  },
  {
    contractName: 'cooperative-vault',
    operation: 'vote_and_execute',
    estimatedCpuInstructions: 3_900_000,
    memoryBytes: 147_456,
    ledgerReadBytes: 4_608,
    ledgerWriteBytes: 5_632,
    estimatedFeeStroops: 14_000,
    withinMainnetLimits: true,
  },
];

export function calculateTotalEcosystemFootprint(): {
  totalEstimatedCpu: number;
  maxMemoryUsed: number;
  averageFeeStroops: number;
  allCompliant: boolean;
} {
  const totalEstimatedCpu = CONTRACT_BENCHMARKS.reduce((sum, b) => sum + b.estimatedCpuInstructions, 0);
  const maxMemoryUsed = Math.max(...CONTRACT_BENCHMARKS.map((b) => b.memoryBytes));
  const averageFeeStroops = Math.round(
    CONTRACT_BENCHMARKS.reduce((sum, b) => sum + b.estimatedFeeStroops, 0) / CONTRACT_BENCHMARKS.length
  );
  const allCompliant = CONTRACT_BENCHMARKS.every(
    (b) =>
      b.estimatedCpuInstructions <= SOROBAN_MAINNET_LIMITS.MAX_CPU_INSTRUCTIONS &&
      b.memoryBytes <= SOROBAN_MAINNET_LIMITS.MAX_MEMORY_BYTES
  );

  return {
    totalEstimatedCpu,
    maxMemoryUsed,
    averageFeeStroops,
    allCompliant,
  };
}
