import { describe, it, expect } from 'vitest';
import { defaultOracleService } from '../packages/oracle/src/index';

describe('Agricultural Oracle Architecture', () => {
  it('retrieves live commodity prices for all supported agricultural assets', async () => {
    const prices = await defaultOracleService.getCommodityPrices();
    expect(prices.length).toBeGreaterThanOrEqual(5);

    const maize = prices.find((p) => p.commodity === 'Maize');
    expect(maize).toBeDefined();
    expect(maize?.priceUsdPerTon).toBeGreaterThan(0);
    expect(maize?.priceXlmPerTon).toBeGreaterThan(0);
    expect(maize?.source).toBeDefined();

    const coffee = prices.find((p) => p.commodity === 'Coffee');
    expect(coffee).toBeDefined();
    expect(coffee?.priceUsdPerTon).toBeGreaterThan(1000);
  });

  it('retrieves regional agricultural weather indices', async () => {
    const weather = await defaultOracleService.getRegionalWeather();
    expect(weather.length).toBeGreaterThanOrEqual(5);

    const kenya = weather.find((w) => w.country === 'Kenya');
    expect(kenya).toBeDefined();
    expect(kenya?.rainfallMm).toBeGreaterThan(0);
    expect(kenya?.temperatureCelsius).toBeGreaterThan(0);
    expect(['Low', 'Moderate', 'Elevated', 'High']).toContain(kenya?.droughtRisk);
  });

  it('explicitly labels oracle data as external reference data', async () => {
    const feed = await defaultOracleService.getOracleData();
    expect(feed.isExternalData).toBe(true);
    expect(feed.oracleProvider).toContain('AgriFlow');
  });
});
