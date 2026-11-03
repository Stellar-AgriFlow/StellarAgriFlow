import {
  ClaimableBalanceHelper,
  ClaimableBalancePlan,
} from '../packages/contracts-client/src/claimableBalanceHelper';

export interface EscrowSimulationResult {
  tradeId: number;
  plan: ClaimableBalancePlan;
  status: 'PENDING_INSPECTION' | 'RELEASED_TO_SELLER' | 'REFUNDED_TO_BUYER';
  inspectionPassed: boolean;
}

export function simulateClaimableBalanceEscrow(
  passedInspection: boolean = true
): EscrowSimulationResult {
  const buyer = 'G' + 'BUYER' + 'A'.repeat(50);
  const seller = 'G' + 'SELLER' + 'B'.repeat(49);
  const now = Math.floor(Date.now() / 1000);

  const plan = ClaimableBalanceHelper.planClaimableBalance(buyer, 'USDC', 8500, [
    {
      claimant: seller,
      notBeforeTimestamp: now + 72 * 3600, // 72 hours inspection lock
      notAfterTimestamp: now + 14 * 86400, // 14 days
    },
    {
      claimant: buyer,
      notBeforeTimestamp: now + 14 * 86400, // Refund after 14 days
    },
  ]);

  return {
    tradeId: 401,
    plan,
    status: passedInspection ? 'RELEASED_TO_SELLER' : 'REFUNDED_TO_BUYER',
    inspectionPassed: passedInspection,
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const res = simulateClaimableBalanceEscrow(true);
  console.log('--- Claimable Balance Escrow Simulation ---');
  console.log(JSON.stringify(res, null, 2));
}
