import {
  TimeBoundValidator,
  TimeBoundWindow,
  TimeBoundEvaluation,
} from '../packages/contracts-client/src/timeBoundValidator';

export interface TimeboundSimulationResult {
  attempt1: { bounds: TimeBoundWindow; eval: TimeBoundEvaluation };
  attempt2Retry: { bounds: TimeBoundWindow; eval: TimeBoundEvaluation };
  recoveredSuccessfully: boolean;
}

export function simulateTimeboundEscrowLifecycle(): TimeboundSimulationResult {
  const baseTime = 1700000000;

  // Attempt 1: Transaction created with 60s validity, but submitted at t = baseTime + 120 (expired!)
  const initialBounds: TimeBoundWindow = {
    minTime: baseTime,
    maxTime: baseTime + 60,
  };
  const eval1 = TimeBoundValidator.evaluateTimeBounds(initialBounds, baseTime + 120);

  // Attempt 2: Re-generated fresh 300s window at t = baseTime + 120 -> active!
  const retryBounds = TimeBoundValidator.generateDefaultWindow(300, baseTime + 120);
  const eval2 = TimeBoundValidator.evaluateTimeBounds(retryBounds, baseTime + 120);

  return {
    attempt1: { bounds: initialBounds, eval: eval1 },
    attempt2Retry: { bounds: retryBounds, eval: eval2 },
    recoveredSuccessfully: eval1.status === 'EXPIRED' && eval2.status === 'ACTIVE',
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const res = simulateTimeboundEscrowLifecycle();
  console.log('--- Timebound Expiration & Recovery Simulation ---');
  console.log(JSON.stringify(res, null, 2));
}
