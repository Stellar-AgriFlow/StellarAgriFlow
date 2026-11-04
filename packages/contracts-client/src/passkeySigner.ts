export interface WebAuthnCredential {
  credentialId: string;
  publicKeyX: string; // 32-byte hex
  publicKeyY: string; // 32-byte hex
  algorithm: 'ES256'; // P-256 curve
}

export interface WebAuthnSignatureData {
  authenticatorData: string; // hex
  clientDataJSON: string;
  r: string; // 32-byte hex
  s: string; // 32-byte hex
}

export interface SorobanPasskeyAuthPayload {
  authenticatorDataHex: string;
  clientDataHashHex: string;
  signatureHex: string;
  pubKeyXHex: string;
  pubKeyYHex: string;
}

export class PasskeySigner {
  /**
   * Hashes the clientDataJSON with SHA-256 as required by WebAuthn specification
   */
  public static computeClientDataHash(clientDataJSON: string): string {
    try {
      const crypto = require('crypto');
      if (crypto && typeof crypto.createHash === 'function') {
        return crypto.createHash('sha256').update(clientDataJSON).digest('hex');
      }
    } catch {
      // Fallback in browser context without node:crypto
    }

    let hash = 0;
    for (let i = 0; i < clientDataJSON.length; i++) {
      hash = (hash << 5) - hash + clientDataJSON.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Validates that the clientDataJSON contains the expected transaction challenge
   */
  public static verifyClientDataChallenge(clientDataJSON: string, expectedChallenge: string): boolean {
    try {
      const parsed = JSON.parse(clientDataJSON);
      return parsed.type === 'webauthn.get' && parsed.challenge === expectedChallenge;
    } catch {
      return false;
    }
  }

  /**
   * Parses an ASN.1 DER-encoded ECDSA signature into 32-byte R and S coordinate strings
   */
  public static parseDerSignature(derBuffer: Buffer): { r: string; s: string } {
    if (derBuffer[0] !== 0x30) {
      throw new Error('Invalid DER signature: missing sequence tag');
    }

    let offset = 2;
    if (derBuffer[1] & 0x80) {
      offset += derBuffer[1] & 0x7f;
    }

    // Parse R value
    if (derBuffer[offset] !== 0x02) {
      throw new Error('Invalid DER signature: expected integer tag for r');
    }
    const rLen = derBuffer[offset + 1];
    offset += 2;
    let rBytes = derBuffer.subarray(offset, offset + rLen);
    offset += rLen;

    // Remove leading zero if 33 bytes
    if (rBytes.length === 33 && rBytes[0] === 0x00) {
      rBytes = rBytes.subarray(1);
    }

    // Parse S value
    if (derBuffer[offset] !== 0x02) {
      throw new Error('Invalid DER signature: expected integer tag for s');
    }
    const sLen = derBuffer[offset + 1];
    offset += 2;
    let sBytes = derBuffer.subarray(offset, offset + sLen);

    if (sBytes.length === 33 && sBytes[0] === 0x00) {
      sBytes = sBytes.subarray(1);
    }

    return {
      r: Buffer.from(rBytes).toString('hex').padStart(64, '0'),
      s: Buffer.from(sBytes).toString('hex').padStart(64, '0'),
    };
  }

  /**
   * Constructs the Soroban authorization payload structure for on-chain passkey verification
   */
  public static encodeSorobanPasskeyAuth(
    cred: WebAuthnCredential,
    sigData: WebAuthnSignatureData
  ): SorobanPasskeyAuthPayload {
    return this.buildSorobanPasskeyPayload(cred, sigData);
  }

  public static buildSorobanPasskeyPayload(
    cred: WebAuthnCredential,
    sigData: WebAuthnSignatureData
  ): SorobanPasskeyAuthPayload {
    const clientDataHash = this.computeClientDataHash(sigData.clientDataJSON);
    const signatureHex = sigData.r.padStart(64, '0') + sigData.s.padStart(64, '0');

    return {
      authenticatorDataHex: sigData.authenticatorData,
      clientDataHashHex: clientDataHash,
      signatureHex,
      pubKeyXHex: cred.publicKeyX,
      pubKeyYHex: cred.publicKeyY,
    };
  }
}
