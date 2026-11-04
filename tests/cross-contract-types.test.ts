import { describe, it, expect } from 'vitest';
import { CrossContractCallGraph, CrossContractCallFrame } from '../packages/types/src/crossContract';

describe('Cross Contract Types', () => {
  it('instantiates valid CrossContractCallGraph structure', () => {
    const frame1: CrossContractCallFrame = {
      frameId: 'f-1',
      contractId: 'C' + 'A'.repeat(55),
      contractName: 'AgriculturalMarketplace',
      functionName: 'purchase_crop',
      depth: 0,
      args: ['BATCH-42', 1500],
      returnValue: { success: true },
      status: 'SUCCESS',
      cpuInstructions: 450000,
      memoryBytes: 8192,
      timestamp: Date.now(),
    };

    const graph: CrossContractCallGraph = {
      transactionHash: 'a'.repeat(64),
      rootContractId: 'C' + 'A'.repeat(55),
      rootContractName: 'AgriculturalMarketplace',
      status: 'SUCCESS',
      frames: [frame1],
      maxDepth: 0,
      totalCpuInstructions: 450000,
      totalMemoryBytes: 8192,
      involvedContracts: ['C' + 'A'.repeat(55)],
      executionTimeMs: 140,
    };

    expect(graph.status).toBe('SUCCESS');
    expect(graph.frames).toHaveLength(1);
    expect(graph.totalCpuInstructions).toBe(450000);
  });
});
