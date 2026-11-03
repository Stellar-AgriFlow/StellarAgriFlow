import {
  BatchPaymentEngine,
  PaymentInstruction,
  BatchPlan,
} from '../packages/contracts-client/src/batchPaymentEngine';

export interface BatchDisbursementResult {
  totalFarmers: number;
  totalSurplusDividends: number;
  plan: BatchPlan;
  executionStatus: 'COMPLETED' | 'FAILED';
  submittedTransactions: number;
}

export function runBatchDisbursementSimulation(
  farmerCount: number = 75,
  dividendPerFarmer: number = 120
): BatchDisbursementResult {
  const instructions: PaymentInstruction[] = [];

  for (let i = 1; i <= farmerCount; i++) {
    const address = 'G' + String(i).padStart(3, '0') + 'FARMER' + 'A'.repeat(46);
    instructions.push({
      destination: address,
      amount: dividendPerFarmer,
      assetCode: 'USDC',
      memo: `Seasonal Div Q1 #${i}`,
    });
  }

  const plan = BatchPaymentEngine.planDisbursement(instructions, 40);

  return {
    totalFarmers: farmerCount,
    totalSurplusDividends: farmerCount * dividendPerFarmer,
    plan,
    executionStatus: 'COMPLETED',
    submittedTransactions: plan.totalBatches,
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const result = runBatchDisbursementSimulation();
  console.log('--- Batch Dividend Payout Simulation Result ---');
  console.log(`Disbursing to ${result.totalFarmers} farmers across ${result.submittedTransactions} transactions.`);
  console.log(`Total Amount: ${result.totalSurplusDividends} USDC | Estimated Fee: ${result.plan.totalEstimatedFeeStroops} stroops.`);
}
