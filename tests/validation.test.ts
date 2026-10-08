import { describe, it, expect } from 'vitest';
import {
  validateStellarAddress,
  validatePaymentAmount,
  validateMemo,
} from '../packages/stellar/src/validation';

describe('Stellar Address Validation', () => {
  const validTestnetAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

  it('accepts a valid Stellar Ed25519 public key', () => {
    const result = validateStellarAddress(validTestnetAddress);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects an empty or whitespace address', () => {
    const result = validateStellarAddress('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Recipient Stellar address is required');
  });

  it('rejects an address not starting with G', () => {
    const result = validateStellarAddress('SA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must start with the letter G');
  });

  it('rejects an address with incorrect length', () => {
    const result = validateStellarAddress('GA5ZSEJYB37JRC5AVCIA');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('56 characters');
  });

  it('rejects an address with invalid checksum characters', () => {
    // Replaced last character to break checksum
    const result = validateStellarAddress('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVM');
    expect(result.isValid).toBe(false);
  });
});

describe('Payment Amount Validation', () => {
  it('accepts valid positive numbers within available balance', () => {
    const result = validatePaymentAmount('10.5', '100.00');
    expect(result.isValid).toBe(true);
    expect(result.numericAmount).toBe(10.5);
  });

  it('rejects empty or whitespace amounts', () => {
    const result = validatePaymentAmount('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects zero or negative amounts', () => {
    expect(validatePaymentAmount('0').isValid).toBe(false);
    expect(validatePaymentAmount('-5').isValid).toBe(false);
  });

  it('rejects non-numeric inputs', () => {
    const result = validatePaymentAmount('abc');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('valid positive number');
  });

  it('rejects amounts exceeding 7 decimal places', () => {
    const result = validatePaymentAmount('1.12345678');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed 7 decimal places');
  });

  it('rejects amounts exceeding available balance', () => {
    const result = validatePaymentAmount('150', '100.00');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Insufficient XLM balance');
  });
});

describe('Transaction Memo Validation', () => {
  it('accepts valid memo within 28 bytes', () => {
    const result = validateMemo('AGRI:Farm Input');
    expect(result.isValid).toBe(true);
  });

  it('accepts empty memo', () => {
    const result = validateMemo('');
    expect(result.isValid).toBe(true);
  });

  it('rejects memo exceeding 28 bytes', () => {
    const longMemo = 'This memo is definitely longer than twenty-eight bytes!';
    const result = validateMemo(longMemo);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceeds 28 bytes');
  });
});
