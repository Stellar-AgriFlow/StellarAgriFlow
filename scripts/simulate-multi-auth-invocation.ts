import { Keypair } from '@stellar/stellar-sdk';
import { AuthEntryBuilder, MultiAuthCollector, SorobanAuthEntry } from '../packages/contracts-client/src/authEntrySigner';

export interface MultiAuthSimulationResult {
  sessionId: string;
  farmerPubkey: string;
  coopPubkey: string;
  step1Completed: boolean;
  step2Completed: boolean;
  totalAuthEntriesCompiled: number;
  success: boolean;
}

export function simulateMultiAuthLoanInvocation(): MultiAuthSimulationResult {
  const farmer = Keypair.random();
  const coopOfficer = Keypair.random();
  const cooperativeVaultContract = 'C' + 'A'.repeat(55);
  const currentLedger = 150000;

  const collector = new MultiAuthCollector();
  const session = collector.createSession(
    'coop-loan-batch-sim',
    'Seasonal fertilizer microloan co-authorization',
    [farmer.publicKey(), coopOfficer.publicKey()],
    currentLedger,
    100
  );

  // 1. Farmer signs their authorization entry
  const farmerAuth: SorobanAuthEntry = new AuthEntryBuilder()
    .setCredentials(farmer.publicKey(), 10, currentLedger + 80)
    .setRootInvocation(cooperativeVaultContract, 'accept_loan_terms', [
      { amount: 12000, durationMonths: 6, cropCollateral: 'MAIZE' },
    ])
    .sign(farmer);

  const step1 = collector.addAuthEntry(session.sessionId, farmerAuth, currentLedger + 1);

  // 2. Cooperative officer signs their authorization entry
  const coopAuth: SorobanAuthEntry = new AuthEntryBuilder()
    .setCredentials(coopOfficer.publicKey(), 42, currentLedger + 80)
    .setRootInvocation(cooperativeVaultContract, 'disburse_from_treasury', [
      { recipient: farmer.publicKey(), amount: 12000 },
    ])
    .sign(coopOfficer);

  const step2 = collector.addAuthEntry(session.sessionId, coopAuth, currentLedger + 2);

  // 3. Compile full multi-auth set for Soroban invocation
  const compiledEntries = collector.compileAuthorizationEntries(session.sessionId);

  return {
    sessionId: session.sessionId,
    farmerPubkey: farmer.publicKey(),
    coopPubkey: coopOfficer.publicKey(),
    step1Completed: step1.completed,
    step2Completed: step2.completed,
    totalAuthEntriesCompiled: compiledEntries.length,
    success: step1.completed === false && step2.completed === true && compiledEntries.length === 2,
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const res = simulateMultiAuthLoanInvocation();
  console.log('--- Multi-Auth Soroban Invocation Simulation ---');
  console.log(JSON.stringify(res, null, 2));
}
