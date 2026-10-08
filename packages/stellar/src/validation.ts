import { StrKey } from '@stellar/stellar-sdk';

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AmountValidationResult {
  isValid: boolean;
  numericAmount?: number;
  error?: string;
}

export function validateStellarAddress(address: string): AddressValidationResult {
  const trimmed = (address || '').trim();

  if (!trimmed) {
    return { isValid: false, error: 'Recipient Stellar address is required.' };
  }

  if (!trimmed.startsWith('G')) {
    return { isValid: false, error: 'Stellar public keys must start with the letter G.' };
  }

  if (trimmed.length !== 56) {
    return { isValid: false, error: `Invalid length (${trimmed.length} chars). Stellar public keys are 56 characters.` };
  }

  try {
    const isValid = StrKey.isValidEd25519PublicKey(trimmed);
    if (!isValid) {
      return { isValid: false, error: 'Invalid Stellar public key format or checksum.' };
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: 'Invalid Stellar public key.' };
  }
}

export function validatePaymentAmount(amount: string, availableBalance?: string): AmountValidationResult {
  const trimmed = (amount || '').trim();

  if (!trimmed) {
    return { isValid: false, error: 'Payment amount is required.' };
  }

  const num = Number(trimmed);
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Amount must be a valid positive number.' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than 0 XLM.' };
  }

  // Check decimal precision (Stellar supports up to 7 decimal places)
  const parts = trimmed.split('.');
  if (parts.length > 1 && parts[1].length > 7) {
    return { isValid: false, error: 'Stellar amounts cannot exceed 7 decimal places.' };
  }

  if (availableBalance !== undefined) {
    const max = Number(availableBalance);
    if (!isNaN(max) && num > max) {
      return {
        isValid: false,
        numericAmount: num,
        error: `Insufficient XLM balance for this transaction. Maximum spendable is ${max.toFixed(4)} XLM.`,
      };
    }
  }

  return { isValid: true, numericAmount: num };
}

export function validateMemo(memo?: string): { isValid: boolean; error?: string } {
  if (!memo) return { isValid: true };
  const byteLength = new TextEncoder().encode(memo).length;
  if (byteLength > 28) {
    return { isValid: false, error: `Memo exceeds 28 bytes (${byteLength} bytes).` };
  }
  return { isValid: true };
}
