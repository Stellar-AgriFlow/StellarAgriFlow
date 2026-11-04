import { createHash } from 'node:crypto';

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
    return createHash('sha256').update(clientDataJSON).digest('hex');
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

    let offset = 2; // skip tag (0x30) and length
    if (derBuffer[offset] !== 0x02) {
      throw new Error('Invalid DER signature: missing integer tag for R');
    }
    offset++;

    const rLen = derBuffer[offset++];
    let rBuf = derBuffer.subarray(offset, offset + rLen);
    offset += rLen;

    // Remove leading zero byte added to prevent negative two's complement
    if (rBuf.length === 33 && rBuf[0] === 0x00) {
      rBuf = rBuf.subarray(1);
    }

    if (derBuffer[offset++] !== 0x02) {
      throw new Error('Invalid DER signature: missing integer tag for S');
    }

    const sLen = derBuffer[offset++];
    let sBuf = derBuffer.subarray(offset, offset + sLen);

    if (sBuf.length === 33 && sBuf[0] === 0x00) {
      sBuf = sBuf.subarray(1);
    }

    // Pad to 32 bytes if needed
    const rHex = rBuf.toString('hex').padStart(64, '0');
    const sHex = sBuf.toString('hex').padStart(64, '0');

    return { r: rHex, s: sHex };
  }

  /**
   * Encodes Passkey signature payload for Soroban secp256r1 host invocation
   */
  public static encodeSorobanPasskeyAuth(
    credential: WebAuthnCredential,
    signatureData: WebAuthnSignatureData
  ): SorobanPasskeyAuthPayload {
    const clientDataHashHex = this.computeClientDataHash(signatureData.clientDataJSON);
    const signatureHex = signatureData.r + signatureData.s;

    return {
      authenticatorDataHex: signatureData.authenticatorData,
      clientDataHashHex,
      signatureHex,
      pubKeyXHex: credential.publicKeyX.padStart(64, '0'),
      pubKeyYHex: credential.publicKeyY.padStart(64, '0'),
    };
  }
}
