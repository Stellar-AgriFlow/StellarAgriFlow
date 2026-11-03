export interface PaymentInstruction {
  destination: string;
  amount: number;
  assetCode?: string;
  memo?: string;
}

export interface PaymentBatch {
  batchIndex: number;
  payments: PaymentInstruction[];
  totalAmount: number;
  operationsCount: number;
  estimatedFeeStroops: number;
}

export interface BatchPlan {
  totalRecipients: number;
  totalDisbursementAmount: number;
  totalBatches: number;
  batches: PaymentBatch[];
  totalEstimatedFeeStroops: number;
}

export class BatchPaymentEngine {
  public static readonly MAX_OPERATIONS_PER_TX = 100;
  public static readonly DEFAULT_CHUNK_SIZE = 50;

  /**
   * Plans and chunks mass payout instructions into compliant Stellar transactions
   */
  static planDisbursement(
    instructions: PaymentInstruction[],
    chunkSize: number = BatchPaymentEngine.DEFAULT_CHUNK_SIZE
  ): BatchPlan {
    const safeChunkSize = Math.min(
      Math.max(1, chunkSize),
      BatchPaymentEngine.MAX_OPERATIONS_PER_TX
    );

    const validInstructions = instructions.filter(
      (p) => p.amount > 0 && p.destination.startsWith('G') && p.destination.length === 56
    );

    const batches: PaymentBatch[] = [];
    let totalDisbursementAmount = 0;
    let totalEstimatedFeeStroops = 0;

    for (let i = 0; i < validInstructions.length; i += safeChunkSize) {
      const chunk = validInstructions.slice(i, i + safeChunkSize);
      const chunkTotal = chunk.reduce((sum, p) => sum + p.amount, 0);
      const opsCount = chunk.length;
      const estimatedFee = opsCount * 100; // 100 stroops per op

      batches.push({
        batchIndex: batches.length + 1,
        payments: chunk,
        totalAmount: chunkTotal,
        operationsCount: opsCount,
        estimatedFeeStroops: estimatedFee,
      });

      totalDisbursementAmount += chunkTotal;
      totalEstimatedFeeStroops += estimatedFee;
    }

    return {
      totalRecipients: validInstructions.length,
      totalDisbursementAmount,
      totalBatches: batches.length,
      batches,
      totalEstimatedFeeStroops,
    };
  }
}
