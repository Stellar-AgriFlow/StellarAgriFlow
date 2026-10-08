import { describe, it, expect } from 'vitest';
import { parseStellarError } from '../packages/stellar/src/errors';

describe('Stellar Error Parsing', () => {
  it('identifies user wallet rejection messages', () => {
    expect(parseStellarError('User denied transaction signature')).toBe(
      'Transaction was rejected in your wallet.'
    );
    expect(parseStellarError(new Error('User declined signature'))).toBe(
      'Transaction was rejected in your wallet.'
    );
  });

  it('identifies missing Freighter wallet installation', () => {
    expect(
      parseStellarError(new Error('Freighter wallet was not detected. Please install Freighter to continue.'))
    ).toBe('Freighter wallet was not detected. Please install Freighter to continue.');
  });

  it('maps Horizon op_underfunded to friendly message', () => {
    const horizonError = {
      response: {
        data: {
          extras: {
            result_codes: {
              operations: ['op_underfunded'],
            },
          },
        },
      },
    };
    expect(parseStellarError(horizonError)).toBe('Insufficient XLM balance for this transaction.');
  });

  it('maps Horizon op_no_destination to friendly activation message', () => {
    const horizonError = {
      response: {
        data: {
          extras: {
            result_codes: {
              operations: ['op_no_destination'],
            },
          },
        },
      },
    };
    expect(parseStellarError(horizonError)).toContain('Recipient account is not activated');
  });

  it('handles 404 account not found error', () => {
    const error404 = {
      response: {
        status: 404,
      },
    };
    expect(parseStellarError(error404)).toContain('Account not found on Stellar Testnet');
  });
});
