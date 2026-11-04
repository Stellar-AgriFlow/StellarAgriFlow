import { describe, it, expect } from 'vitest';
import { PasskeySigner, WebAuthnCredential, WebAuthnSignatureData } from '../packages/contracts-client/src/passkeySigner';

describe('PasskeySigner', () => {
  const credential: WebAuthnCredential = {
    credentialId: 'cred_passkey_xyz123',
    publicKeyX: '11'.repeat(32),
    publicKeyY: '22'.repeat(32),
    algorithm: 'ES256',
  };

  it('computes sha256 clientDataHash and validates challenge', () => {
    const challenge = 'txn_challenge_base64url_string_77';
    const clientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge,
      origin: 'https://app.stellar-agriflow.io',
    });

    const hash = PasskeySigner.computeClientDataHash(clientDataJSON);
    expect(hash).toHaveLength(64); // 32 bytes in hex

    const isValid = PasskeySigner.verifyClientDataChallenge(clientDataJSON, challenge);
    expect(isValid).toBe(true);

    const isInvalid = PasskeySigner.verifyClientDataChallenge(clientDataJSON, 'wrong-challenge');
    expect(isInvalid).toBe(false);
  });

  it('parses ASN.1 DER signature into 32-byte R and S coordinate strings', () => {
    // Construct valid ASN.1 DER buffer:
    // 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
    const rBytes = Buffer.from('aa'.repeat(32), 'hex');
    const sBytes = Buffer.from('bb'.repeat(32), 'hex');

    const derBuffer = Buffer.concat([
      Buffer.from([0x30, 68]), // 2 + 32 + 2 + 32 = 68
      Buffer.from([0x02, 32]),
      rBytes,
      Buffer.from([0x02, 32]),
      sBytes,
    ]);

    const { r, s } = PasskeySigner.parseDerSignature(derBuffer);
    expect(r).toBe('aa'.repeat(32));
    expect(s).toBe('bb'.repeat(32));
  });

  it('encodes Soroban passkey auth payload', () => {
    const signatureData: WebAuthnSignatureData = {
      authenticatorData: 'ff'.repeat(37),
      clientDataJSON: JSON.stringify({
        type: 'webauthn.get',
        challenge: 'ch1',
      }),
      r: 'aa'.repeat(32),
      s: 'bb'.repeat(32),
    };

    const payload = PasskeySigner.encodeSorobanPasskeyAuth(credential, signatureData);
    expect(payload.authenticatorDataHex).toBe('ff'.repeat(37));
    expect(payload.signatureHex).toBe('aa'.repeat(32) + 'bb'.repeat(32));
    expect(payload.pubKeyXHex).toBe('11'.repeat(32));
    expect(payload.pubKeyYHex).toBe('22'.repeat(32));
  });
});
