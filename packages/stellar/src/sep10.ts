import {
  Keypair,
  Transaction,
  WebAuth,
} from '@stellar/stellar-sdk';
import { STELLAR_TESTNET_CONFIG } from './config';

export interface Sep10ChallengeConfig {
  serverKeypair: Keypair;
  networkPassphrase?: string;
  homeDomain: string;
  webAuthDomain?: string;
  timeoutSeconds?: number;
}

export interface Sep10VerificationResult {
  valid: boolean;
  clientAccount: string;
  error?: string;
}

export class Sep10Auth {
  private serverKeypair: Keypair;
  private networkPassphrase: string;
  private homeDomain: string;
  private webAuthDomain: string;
  private timeoutSeconds: number;

  constructor(config: Sep10ChallengeConfig) {
    this.serverKeypair = config.serverKeypair;
    this.networkPassphrase =
      config.networkPassphrase || STELLAR_TESTNET_CONFIG.networkPassphrase;
    this.homeDomain = config.homeDomain;
    this.webAuthDomain = config.webAuthDomain || config.homeDomain;
    this.timeoutSeconds = config.timeoutSeconds || 300; // 5 minutes validity
  }

  /**
   * Generates a SEP-10 challenge transaction for a client account.
   */
  generateChallenge(clientPublicKey: string): string {
    const challengeTx = WebAuth.buildChallengeTx(
      this.serverKeypair,
      clientPublicKey,
      this.homeDomain,
      this.timeoutSeconds,
      this.networkPassphrase,
      this.webAuthDomain
    );
    return challengeTx;
  }

  /**
   * Signs a challenge transaction on behalf of a client account.
   */
  static signChallenge(
    challengeXdr: string,
    clientKeypair: Keypair,
    networkPassphrase: string = STELLAR_TESTNET_CONFIG.networkPassphrase
  ): string {
    const tx = new Transaction(challengeXdr, networkPassphrase);
    tx.sign(clientKeypair);
    return tx.toEnvelope().toXdr('base64').toString();
  }

  /**
   * Verifies that the challenge transaction has been signed by the client account.
   */
  verifyChallenge(
    challengeXdr: string,
    expectedClientPublicKey: string
  ): Sep10VerificationResult {
    try {
      const readResult = WebAuth.readChallengeTx(
        challengeXdr,
        this.serverKeypair.publicKey(),
        this.networkPassphrase,
        this.homeDomain,
        this.webAuthDomain
      );

      if (readResult.clientAccountID !== expectedClientPublicKey) {
        return {
          valid: false,
          clientAccount: expectedClientPublicKey,
          error: `Client account ID mismatch: expected ${expectedClientPublicKey}, got ${readResult.clientAccountID}`,
        };
      }

      const isSigned = WebAuth.verifyTxSignedBy(readResult.tx, expectedClientPublicKey);
      if (!isSigned) {
        return {
          valid: false,
          clientAccount: expectedClientPublicKey,
          error: 'Transaction not signed by client account',
        };
      }

      return {
        valid: true,
        clientAccount: expectedClientPublicKey,
      };
    } catch (err) {
      return {
        valid: false,
        clientAccount: expectedClientPublicKey,
        error: err instanceof Error ? err.message : 'SEP-10 verification failed',
      };
    }
  }
}
