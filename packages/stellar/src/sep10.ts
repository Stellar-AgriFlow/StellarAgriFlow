import {
  Keypair,
  Networks,
  Transaction,
  TransactionBuilder,
  Utils,
} from '@stellar/stellar-sdk';
import { STELLAR_TESTNET_CONFIG } from './config';

export interface Sep10ChallengeConfig {
  serverKeypair: Keypair;
  networkPassphrase?: string;
  homeDomain: string;
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
  private timeoutSeconds: number;

  constructor(config: Sep10ChallengeConfig) {
    this.serverKeypair = config.serverKeypair;
    this.networkPassphrase =
      config.networkPassphrase || STELLAR_TESTNET_CONFIG.networkPassphrase;
    this.homeDomain = config.homeDomain;
    this.timeoutSeconds = config.timeoutSeconds || 300; // 5 minutes validity
  }

  /**
   * Generates a SEP-10 challenge transaction for a client account.
   */
  generateChallenge(clientPublicKey: string): string {
    const challengeTx = Utils.buildChallengeTx(
      this.serverKeypair,
      clientPublicKey,
      this.homeDomain,
      this.timeoutSeconds,
      this.networkPassphrase
    );
    return challengeTx;
  }

  /**
   * Verifies that the challenge transaction has been signed by the client account.
   */
  verifyChallenge(
    challengeXdr: string,
    expectedClientPublicKey: string
  ): Sep10VerificationResult {
    try {
      const tx = new Transaction(challengeXdr, this.networkPassphrase);
      const signers = Utils.readChallengeTx(
        challengeXdr,
        this.serverKeypair.publicKey(),
        this.networkPassphrase,
        this.homeDomain
      );

      const clientSigned = signers.matched.some(
        (signer: string) => signer === expectedClientPublicKey
      );

      if (!clientSigned) {
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
