import { describe, it, expect } from 'vitest';
import {
  AgriculturalOracleService,
  computeBackoffDelayMs,
  fetchWithExponentialBackoff,
} from '../packages/oracle/src/index';

describe('Oracle Exponential Backoff Retry Mechanism', () => {
  it('computes 500ms, 1000ms, and 2000ms base exponential backoff delays with jitter', () => {
    expect(computeBackoffDelayMs(1, 500, 0.2, () => 0)).toBe(500);
    expect(computeBackoffDelayMs(2, 500, 0.2, () => 0)).toBe(1000);
    expect(computeBackoffDelayMs(3, 500, 0.2, () => 0)).toBe(2000);

    // With 50% random sample and 20% jitter ratio -> +10% jitter
    expect(computeBackoffDelayMs(1, 500, 0.2, () => 0.5)).toBe(550);
    expect(computeBackoffDelayMs(2, 500, 0.2, () => 0.5)).toBe(1100);
  });

  it('retries automatically when an oracle feed request fails once and succeeds on the second attempt', async () => {
    let attempts = 0;
    const warnings: string[] = [];
    const delays: number[] = [];

    const service = new AgriculturalOracleService({
      priceFetcher: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('Soroban RPC transient 502 Bad Gateway');
        }
        return [
          {
            commodity: 'Maize',
            priceUsdPerTon: 192.0,
            priceXlmPerTon: 1536,
            change24hPercent: 2.4,
            lastUpdated: Date.now(),
            source: 'Live Oracle Feed',
          },
        ];
      },
      retryOptions: {
        maxAttempts: 3,
        baseDelayMs: 500,
        jitterRatio: 0,
        sleepFn: async (ms) => {
          delays.push(ms);
        },
        warnFn: (msg) => {
          warnings.push(msg);
        },
      },
    });

    const prices = await service.getCommodityPrices();
    expect(attempts).toBe(2);
    expect(prices.length).toBe(1);
    expect(prices[0].priceUsdPerTon).toBe(192.0);
    expect(delays).toEqual([500]);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('attempt 1/3');
  });

  it('returns fallback oracle data only after all 3 attempts fail', async () => {
    let attempts = 0;
    const warnings: string[] = [];
    const delays: number[] = [];

    const result = await fetchWithExponentialBackoff(
      'weather-feed',
      async () => {
        attempts += 1;
        throw new Error('Network unreachable');
      },
      () => [{ region: 'Fallback Region', rainfallMm: 100 }],
      {
        maxAttempts: 3,
        baseDelayMs: 500,
        jitterRatio: 0,
        sleepFn: async (ms) => {
          delays.push(ms);
        },
        warnFn: (msg) => {
          warnings.push(msg);
        },
      }
    );

    expect(attempts).toBe(3);
    expect(delays).toEqual([500, 1000]);
    expect(warnings.length).toBe(3);
    expect(warnings[2]).toContain('exhausted all 3 attempts');
    expect(result).toEqual([{ region: 'Fallback Region', rainfallMm: 100 }]);
  });
});
