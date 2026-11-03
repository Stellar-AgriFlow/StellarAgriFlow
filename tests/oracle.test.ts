import { describe, it, expect } from 'vitest';
import { defaultOracleService, AGRIFLOW_ORACLE_NETWORK_CONTRACTS } from '../packages/oracle/src/index';

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

  it('exposes deployed Stellar Testnet contract addresses and verification explorer links', () => {
    const contracts = defaultOracleService.getDeployedOracleContracts();
    expect(contracts.priceFeedContractId).toBe('CDE2KRZ2ZYZ2B7RT4BA4IPMTHBMUROWSSBCG2RGXM6MDS5GGAKR3GEI7');
    expect(contracts.weatherOracleContractId).toBe('CCC6PHP7LADEVOW4AOLSRXHC6WOK2LW3ZJQX4EEYKR42GR3HXNSFIPHN');
    expect(contracts.network).toBe('TESTNET');
    expect(contracts.reporterAddress).toBe('GCL7UUKY7EE3OL5ROR3V3PFPRONI7RBCJ5S5BRFF4SO5LBDUH3QEXBTY');
  });
});
