import { describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { AuthEntryBuilder, MultiAuthCollector } from '../packages/contracts-client/src/authEntrySigner';

describe('AuthEntrySigner & MultiAuthCollector', () => {
  const alice = Keypair.random();
  const bob = Keypair.random();
  const contractId = 'C' + 'A'.repeat(55);

  it('correctly builds and signs Soroban authorization entry', () => {
    const builder = new AuthEntryBuilder();
    builder
      .setCredentials(alice.publicKey(), 1, 1000)
      .setRootInvocation(contractId, 'disburse_loan', [{ amount: 5000 }]);

    const signedEntry = builder.sign(alice);

    expect(signedEntry.isSigned).toBe(true);
    expect(signedEntry.signature).toBeDefined();
    expect(signedEntry.credentials.address).toBe(alice.publicKey());
    expect(signedEntry.rootInvocation.functionName).toBe('disburse_loan');
  });

  it('rejects signing if keypair does not match address', () => {
    const builder = new AuthEntryBuilder();
    builder
      .setCredentials(alice.publicKey(), 1, 1000)
      .setRootInvocation(contractId, 'disburse_loan', []);

    expect(() => builder.sign(bob)).toThrow(/does not match/);
  });

  it('coordinates multi-auth collection across farmer and cooperative', () => {
    const collector = new MultiAuthCollector();
    const session = collector.createSession(
      'loan-multiauth-101',
      'Loan co-signature for cooperative credit',
      [alice.publicKey(), bob.publicKey()],
      500,
      200
    );

    expect(session.requiredSigners).toHaveLength(2);

    // Alice signs
    const aliceEntry = new AuthEntryBuilder()
      .setCredentials(alice.publicKey(), 1, 700)
      .setRootInvocation(contractId, 'agree_terms', [{ termsId: 'TERMS-99' }])
      .sign(alice);

    const step1 = collector.addAuthEntry('loan-multiauth-101', aliceEntry, 550);
    expect(step1.completed).toBe(false);
    expect(step1.missingSigners).toEqual([bob.publicKey()]);

    // Bob signs
    const bobEntry = new AuthEntryBuilder()
      .setCredentials(bob.publicKey(), 5, 700)
      .setRootInvocation(contractId, 'authorize_treasury_payout', [{ termsId: 'TERMS-99' }])
      .sign(bob);

    const step2 = collector.addAuthEntry('loan-multiauth-101', bobEntry, 560);
    expect(step2.completed).toBe(true);
    expect(step2.missingSigners).toHaveLength(0);

    const finalEntries = collector.compileAuthorizationEntries('loan-multiauth-101');
    expect(finalEntries).toHaveLength(2);
  });

  it('rejects expired session entries', () => {
    const collector = new MultiAuthCollector();
    collector.createSession('session-exp', 'Test expiry', [alice.publicKey()], 500, 100);

    const aliceEntry = new AuthEntryBuilder()
      .setCredentials(alice.publicKey(), 1, 700)
      .setRootInvocation(contractId, 'test_fn', [])
      .sign(alice);

    expect(() => collector.addAuthEntry('session-exp', aliceEntry, 650)).toThrow(/has expired/);
  });
});
