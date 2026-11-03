import { describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { StellarKeyVault } from '../packages/stellar/src/keyManager';

describe('Stellar Key Vault Encryption (AES-256-GCM)', () => {
  const originalKeypair = Keypair.random();
  const secretKey = originalKeypair.secret();
  const passphrase = 'SuperSecureAgriPassphrase123!';

  it('encrypts secret key with random salt and IV', () => {
    const vault = StellarKeyVault.encryptSecretKey(secretKey, passphrase);

    expect(vault.ciphertext).toBeDefined();
    expect(vault.iv.length).toBe(24); // 12 bytes in hex
    expect(vault.salt.length).toBe(32); // 16 bytes in hex
    expect(vault.authTag.length).toBe(32); // 16 bytes in hex
    expect(vault.publicKey).toBe(originalKeypair.publicKey());
    expect(vault.ciphertext).not.toContain(secretKey);
  });

  it('successfully decrypts vault with correct passphrase and restores keypair', () => {
    const vault = StellarKeyVault.encryptSecretKey(secretKey, passphrase);
    const restoredKeypair = StellarKeyVault.decryptSecretKey(vault, passphrase);

    expect(restoredKeypair.publicKey()).toBe(originalKeypair.publicKey());
    expect(restoredKeypair.secret()).toBe(secretKey);
  });

  it('fails decryption and throws authentication error when incorrect passphrase is provided', () => {
    const vault = StellarKeyVault.encryptSecretKey(secretKey, passphrase);

    expect(() => {
      StellarKeyVault.decryptSecretKey(vault, 'WrongPassphrase!');
    }).toThrow();
  });
});
