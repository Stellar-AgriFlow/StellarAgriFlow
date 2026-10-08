import { describe, it, expect } from 'vitest';
import { FarmPassport, FarmStatus } from '../packages/types/src/passport';

export interface FarmPassportFormInput {
  country: string;
  region: string;
  crop: string;
  farmSizeHectares: string;
  expectedYieldTons: string;
}

export function validateFarmPassportInput(input: FarmPassportFormInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.country || input.country.trim().length === 0) {
    errors.country = 'Country is required';
  } else if (input.country.trim().length > 60) {
    errors.country = 'Country name cannot exceed 60 characters';
  }

  if (!input.region || input.region.trim().length === 0) {
    errors.region = 'Region/State/Province is required';
  } else if (input.region.trim().length > 60) {
    errors.region = 'Region name cannot exceed 60 characters';
  }

  if (!input.crop || input.crop.trim().length === 0) {
    errors.crop = 'Primary agricultural crop is required';
  } else if (input.crop.trim().length > 50) {
    errors.crop = 'Crop name cannot exceed 50 characters';
  }

  const sizeNum = parseFloat(input.farmSizeHectares);
  if (!input.farmSizeHectares || isNaN(sizeNum)) {
    errors.farmSizeHectares = 'Farm size must be a valid number';
  } else if (sizeNum <= 0) {
    errors.farmSizeHectares = 'Farm size must be greater than zero hectares';
  } else if (sizeNum > 1000000) {
    errors.farmSizeHectares = 'Farm size exceeds maximum realistic threshold (1M ha)';
  }

  const yieldNum = parseFloat(input.expectedYieldTons);
  if (!input.expectedYieldTons || isNaN(yieldNum)) {
    errors.expectedYieldTons = 'Expected yield must be a valid number';
  } else if (yieldNum <= 0) {
    errors.expectedYieldTons = 'Expected yield must be greater than zero tons';
  } else if (yieldNum > 10000000) {
    errors.expectedYieldTons = 'Expected yield exceeds realistic threshold (10M tons)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

describe('Farm Passport Form & Data Validation', () => {
  const validInput: FarmPassportFormInput = {
    country: 'Kenya',
    region: 'Nakuru County',
    crop: 'Maize',
    farmSizeHectares: '25.5',
    expectedYieldTons: '110.0',
  };

  it('validates a complete and correct agricultural input payload', () => {
    const result = validateFarmPassportInput(validInput);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('rejects empty fields', () => {
    const result = validateFarmPassportInput({
      country: '',
      region: '   ',
      crop: '',
      farmSizeHectares: '',
      expectedYieldTons: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.country).toBeDefined();
    expect(result.errors.region).toBeDefined();
    expect(result.errors.crop).toBeDefined();
    expect(result.errors.farmSizeHectares).toBeDefined();
    expect(result.errors.expectedYieldTons).toBeDefined();
  });

  it('rejects non-numeric farm size or negative yield', () => {
    const result = validateFarmPassportInput({
      ...validInput,
      farmSizeHectares: 'invalid_number',
      expectedYieldTons: '-5.0',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.farmSizeHectares).toContain('valid number');
    expect(result.errors.expectedYieldTons).toContain('greater than zero');
  });

  it('verifies FarmPassport data structure conforms to protocol specifications', () => {
    const passport: FarmPassport = {
      farmId: 'AGRI-000001',
      owner: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      country: 'Nigeria',
      region: 'Kaduna',
      crop: 'Soybeans',
      farmSizeHectares: 50,
      expectedYieldTons: 150,
      registrationTimestamp: Date.now(),
      status: 'Active',
      txHash: '016b501af3eb125c4f713e657046606334c3cc441c9acac555d986a3e2433a8e',
    };

    expect(passport.farmId.startsWith('AGRI-')).toBe(true);
    expect(passport.owner.startsWith('G')).toBe(true);
    expect(passport.status).toBe('Active');
    expect(passport.txHash).toBeDefined();
  });
});
