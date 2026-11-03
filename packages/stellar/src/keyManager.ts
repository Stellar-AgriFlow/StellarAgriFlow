import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

export interface EncryptedKeyVault {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
  publicKey: string;
}

export class StellarKeyVault {
  /**
   * Encrypts a Stellar secret key using AES-256-GCM and a user-provided passphrase
   */
  static encryptSecretKey(secretKey: string, passphrase: string): EncryptedKeyVault {
    const keypair = Keypair.fromSecret(secretKey);
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(passphrase, salt, 32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(secretKey, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
      salt: salt.toString('hex'),
      publicKey: keypair.publicKey(),
    };
  }

  /**
   * Decrypts an encrypted vault back to the Stellar Keypair
   */
  static decryptSecretKey(vault: EncryptedKeyVault, passphrase: string): Keypair {
    const salt = Buffer.from(vault.salt, 'hex');
    const key = crypto.scryptSync(passphrase, salt, 32);
    const iv = Buffer.from(vault.iv, 'hex');
    const authTag = Buffer.from(vault.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(vault.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return Keypair.fromSecret(decrypted);
  }
}
