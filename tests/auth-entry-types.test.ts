import { describe, it, expect } from 'vitest';
import { SorobanAuthRecord, MultiAuthSessionRecord } from '../packages/types/src/authEntry';

describe('Auth Entry Types', () => {
  it('instantiates valid SorobanAuthRecord and MultiAuthSessionRecord structures', () => {
    const authRecord: SorobanAuthRecord = {
      id: 'auth-entry-001',
      credentials: {
        type: 'source_account',
        address: 'G' + 'A'.repeat(55),
        nonce: 10,
        signatureExpirationLedger: 12000,
      },
      rootInvocation: {
        contractId: 'C' + 'B'.repeat(55),
        functionName: 'release_escrow',
        args: [100, 'AGRI-CROP-1'],
        subInvocations: [
          {
            contractId: 'C' + 'C'.repeat(55),
            functionName: 'transfer',
            args: ['G' + 'A'.repeat(55), 'G' + 'D'.repeat(55), 100],
          },
        ],
      },
      signature: 'mock_base64_sig',
      signerPublicKey: 'G' + 'A'.repeat(55),
      isSigned: true,
      timestamp: Date.now(),
    };

    const session: MultiAuthSessionRecord = {
      sessionId: 'session-multi-123',
      description: 'Crop harvest cooperative settlement',
      status: 'READY',
      requiredSigners: ['G' + 'A'.repeat(55), 'G' + 'D'.repeat(55)],
      collectedSignaturesCount: 2,
      entries: [authRecord],
      createdAtLedger: 10000,
      expiresAtLedger: 12000,
    };

    expect(authRecord.credentials.type).toBe('source_account');
    expect(authRecord.rootInvocation.subInvocations).toHaveLength(1);
    expect(session.status).toBe('READY');
    expect(session.collectedSignaturesCount).toBe(2);
  });
});
