import { describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { Sep10Auth } from '../packages/stellar/src/sep10';

describe('Stellar Web Authentication (SEP-10)', () => {
  const serverKeypair = Keypair.random();
  const clientKeypair = Keypair.random();
  const homeDomain = 'stellar-agriflow.org';

  const auth = new Sep10Auth({
    serverKeypair,
    homeDomain,
    timeoutSeconds: 300,
  });

  it('generates a valid SEP-10 challenge transaction in base64 XDR', () => {
    const challengeXdr = auth.generateChallenge(clientKeypair.publicKey());
    expect(typeof challengeXdr).toBe('string');
    expect(challengeXdr.length).toBeGreaterThan(100);
  });

  it('fails verification if client has not signed the challenge transaction', () => {
    const challengeXdr = auth.generateChallenge(clientKeypair.publicKey());
    const result = auth.verifyChallenge(challengeXdr, clientKeypair.publicKey());
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('successfully verifies when client signs the challenge transaction', () => {
    const challengeXdr = auth.generateChallenge(clientKeypair.publicKey());
    const signedXdr = Sep10Auth.signChallenge(challengeXdr, clientKeypair);
    const result = auth.verifyChallenge(signedXdr, clientKeypair.publicKey());
    expect(result.valid).toBe(true);
    expect(result.clientAccount).toBe(clientKeypair.publicKey());
  });

  it('rejects challenge if signed by an unrelated keypair', () => {
    const impostorKeypair = Keypair.random();
    const challengeXdr = auth.generateChallenge(clientKeypair.publicKey());
    const signedXdr = Sep10Auth.signChallenge(challengeXdr, impostorKeypair);
    const result = auth.verifyChallenge(signedXdr, clientKeypair.publicKey());
    expect(result.valid).toBe(false);
  });
});
