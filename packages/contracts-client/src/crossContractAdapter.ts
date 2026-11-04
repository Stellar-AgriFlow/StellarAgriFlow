export interface CrossContractInvocationNode {
  id: string;
  contractId: string;
  contractName?: string;
  functionName: string;
  args: unknown[];
  depth: number;
  cpuInstructionsUsed: number;
  memoryBytesUsed: number;
  status: 'SUCCESS' | 'REVERTED';
  returnValue?: unknown;
  errorMessage?: string;
  children: CrossContractInvocationNode[];
}

export interface InvocationTraceSummary {
  rootContractId: string;
  totalNodes: number;
  maxDepth: number;
  totalCpuInstructions: number;
  totalMemoryBytes: number;
  hasFailures: boolean;
  involvedContracts: string[];
}

export class CrossContractTracer {
  private rootNode: CrossContractInvocationNode | null = null;
  private currentStack: CrossContractInvocationNode[] = [];
  private nodeCounter = 0;

  public startInvocation(
    contractId: string,
    functionName: string,
    args: unknown[] = [],
    contractName?: string
  ): CrossContractInvocationNode {
    const depth = this.currentStack.length;

    // Guard against excessive recursion
    if (depth > 16) {
      throw new Error(`Cross-contract call stack depth limit exceeded (${depth})`);
    }

    // Detect reentrancy cycles
    const hasCycle = this.currentStack.some(
      (node) => node.contractId === contractId && node.functionName === functionName
    );
    if (hasCycle) {
      throw new Error(`Reentrancy detected: recursive call into ${contractId}::${functionName}`);
    }

    const node: CrossContractInvocationNode = {
      id: `call_${++this.nodeCounter}`,
      contractId,
      contractName,
      functionName,
      args,
      depth,
      cpuInstructionsUsed: 0,
      memoryBytesUsed: 0,
      status: 'SUCCESS',
      children: [],
    };

    if (this.currentStack.length > 0) {
      const parent = this.currentStack[this.currentStack.length - 1];
      parent.children.push(node);
    } else {
      this.rootNode = node;
    }

    this.currentStack.push(node);
    return node;
  }

  public completeInvocation(
    cpuInstructions: number,
    memoryBytes: number,
    returnValue?: unknown,
    error?: string
  ): void {
    if (this.currentStack.length === 0) {
      throw new Error('No active invocation to complete');
    }

    const node = this.currentStack.pop()!;
    node.cpuInstructionsUsed = cpuInstructions;
    node.memoryBytesUsed = memoryBytes;
    if (error) {
      node.status = 'REVERTED';
      node.errorMessage = error;
    } else {
      node.returnValue = returnValue;
    }
  }

  public getRootNode(): CrossContractInvocationNode | null {
    return this.rootNode;
  }

  public getSummary(): InvocationTraceSummary {
    if (!this.rootNode) {
      return {
        rootContractId: '',
        totalNodes: 0,
        maxDepth: 0,
        totalCpuInstructions: 0,
        totalMemoryBytes: 0,
        hasFailures: false,
        involvedContracts: [],
      };
    }

    let totalNodes = 0;
    let maxDepth = 0;
    let totalCpu = 0;
    let totalMem = 0;
    let hasFailures = false;
    const contractsSet = new Set<string>();

    const traverse = (node: CrossContractInvocationNode) => {
      totalNodes++;
      if (node.depth > maxDepth) maxDepth = node.depth;
      totalCpu += node.cpuInstructionsUsed;
      totalMem += node.memoryBytesUsed;
      contractsSet.add(node.contractId);
      if (node.status === 'REVERTED') hasFailures = true;

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(this.rootNode);

    return {
      rootContractId: this.rootNode.contractId,
      totalNodes,
      maxDepth,
      totalCpuInstructions: totalCpu,
      totalMemoryBytes: totalMem,
      hasFailures,
      involvedContracts: Array.from(contractsSet),
    };
  }
}
