import { describe, it, expect } from 'vitest';
import {
  CONTRACT_BENCHMARKS,
  SOROBAN_MAINNET_LIMITS,
  calculateTotalEcosystemFootprint,
} from '../scripts/benchmark-soroban-costs';

describe('Soroban Smart Contract Resource Benchmarks', () => {
  it('covers all 9 core AgriFlow Soroban smart contracts', () => {
    const contracts = new Set(CONTRACT_BENCHMARKS.map((b) => b.contractName));
    expect(contracts.size).toBe(9);
    expect(contracts).toContain('farm-registry');
    expect(contracts).toContain('agricultural-finance');
    expect(contracts).toContain('agricultural-escrow');
    expect(contracts).toContain('agricultural-marketplace');
    expect(contracts).toContain('agricultural-reputation');
    expect(contracts).toContain('warehouse-receipt');
    expect(contracts).toContain('parametric-insurance');
    expect(contracts).toContain('collateral-liquidation');
    expect(contracts).toContain('cooperative-vault');
  });

  it('guarantees each contract stays strictly under 10% of mainnet CPU instruction ceiling', () => {
    const cpuThreshold = SOROBAN_MAINNET_LIMITS.MAX_CPU_INSTRUCTIONS * 0.1; // 10M
    for (const benchmark of CONTRACT_BENCHMARKS) {
      expect(benchmark.estimatedCpuInstructions).toBeLessThan(cpuThreshold);
      expect(benchmark.withinMainnetLimits).toBe(true);
    }
  });

  it('guarantees each contract stays strictly under 1% of mainnet memory ceiling', () => {
    const memoryThreshold = SOROBAN_MAINNET_LIMITS.MAX_MEMORY_BYTES * 0.01; // ~400 KB
    for (const benchmark of CONTRACT_BENCHMARKS) {
      expect(benchmark.memoryBytes).toBeLessThan(memoryThreshold);
    }
  });

  it('asserts aggregate ecosystem footprint is fully compliant with low-fee microfinance goals', () => {
    const footprint = calculateTotalEcosystemFootprint();
    expect(footprint.allCompliant).toBe(true);
    // Average fee below 20,000 stroops (0.002 XLM)
    expect(footprint.averageFeeStroops).toBeLessThan(20000);
  });
});
