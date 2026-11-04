import { describe, it, expect } from 'vitest';
import { CrossContractTracer } from '../packages/contracts-client/src/crossContractAdapter';

describe('CrossContractTracer', () => {
  const marketplaceContract = 'C' + 'A'.repeat(55);
  const escrowContract = 'C' + 'B'.repeat(55);
  const reputationContract = 'C' + 'C'.repeat(55);

  it('accurately records nested cross-contract invocations and summarizes metrics', () => {
    const tracer = new CrossContractTracer();

    // 1. Root call: Marketplace::execute_purchase
    tracer.startInvocation(marketplaceContract, 'execute_purchase', [1001, 500], 'Marketplace');

    // 2. Child call 1: Escrow::lock_funds
    tracer.startInvocation(escrowContract, 'lock_funds', [500], 'Escrow');
    tracer.completeInvocation(150_000, 4096, { escrowLocked: true });

    // 3. Child call 2: Reputation::increment_score
    tracer.startInvocation(reputationContract, 'increment_score', ['GUSER1', 5], 'Reputation');
    tracer.completeInvocation(80_000, 2048, { newScore: 85 });

    // Complete root call
    tracer.completeInvocation(300_000, 8192, { purchaseId: 999 });

    const root = tracer.getRootNode();
    expect(root).not.toBeNull();
    expect(root?.children).toHaveLength(2);
    expect(root?.children[0].functionName).toBe('lock_funds');
    expect(root?.children[1].functionName).toBe('increment_score');

    const summary = tracer.getSummary();
    expect(summary.totalNodes).toBe(3);
    expect(summary.maxDepth).toBe(1);
    expect(summary.hasFailures).toBe(false);
    expect(summary.involvedContracts).toHaveLength(3);
    expect(summary.totalCpuInstructions).toBe(530_000);
    expect(summary.totalMemoryBytes).toBe(14336);
  });

  it('prevents direct reentrancy loop', () => {
    const tracer = new CrossContractTracer();
    tracer.startInvocation(marketplaceContract, 'execute_purchase');

    expect(() => {
      tracer.startInvocation(marketplaceContract, 'execute_purchase');
    }).toThrow(/Reentrancy detected/);
  });
});
