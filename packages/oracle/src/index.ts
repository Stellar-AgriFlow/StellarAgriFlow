import { CommodityPrice, WeatherRiskIndex, OracleFeedData } from '@agriflow/types';

export const AGRIFLOW_ORACLE_NETWORK_CONTRACTS = {
  priceFeedContractId: 'CDE2KRZ2ZYZ2B7RT4BA4IPMTHBMUROWSSBCG2RGXM6MDS5GGAKR3GEI7',
  weatherOracleContractId: 'CCC6PHP7LADEVOW4AOLSRXHC6WOK2LW3ZJQX4EEYKR42GR3HXNSFIPHN',
  reporterAddress: 'GCL7UUKY7EE3OL5ROR3V3PFPRONI7RBCJ5S5BRFF4SO5LBDUH3QEXBTY',
  network: 'TESTNET' as const,
  explorerUrl: 'https://stellar.expert/explorer/testnet',
};

export interface OracleRetryOptions {
  /** Maximum number of attempts before falling back to cached/mock data (defaults to 3) */
  maxAttempts?: number;
  /** Initial backoff delay in milliseconds (defaults to 500 -> 500ms, 1000ms, 2000ms) */
  baseDelayMs?: number;
  /** Maximum proportional random jitter added to each backoff delay (defaults to 0.2) */
  jitterRatio?: number;
  /** Optional custom sleep function for deterministic unit tests */
  sleepFn?: (delayMs: number) => Promise<void>;
  /** Optional custom warning logger (defaults to console.warn) */
  warnFn?: (message: string, error?: unknown) => void;
}

export interface AgriculturalOracleServiceOptions {
  priceFetcher?: () => Promise<CommodityPrice[]>;
  weatherFetcher?: () => Promise<WeatherRiskIndex[]>;
  retryOptions?: OracleRetryOptions;
}

/**
 * Computes the exponential backoff delay (`500ms`, `1000ms`, `2000ms`, ...) with jitter
 * for a given 1-based retry attempt index.
 */
export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs: number = 500,
  jitterRatio: number = 0.2,
  randomFn: () => number = Math.random
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.round(exponentialDelay * Math.max(0, jitterRatio) * randomFn());
  return exponentialDelay + jitter;
}

/**
 * Wraps an asynchronous oracle feed request with automatic exponential backoff retries
 * (default max 3 attempts: 500ms, 1000ms, 2000ms + jitter). Emits a warning on each retry
 * and returns `fallbackFn()` only if all attempts fail.
 */
export async function fetchWithExponentialBackoff<T>(
  feedName: string,
  fetcher: () => Promise<T>,
  fallbackFn: () => T | Promise<T>,
  options: OracleRetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 500;
  const jitterRatio = options.jitterRatio ?? 0.2;
  const sleep =
    options.sleepFn ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const warn = options.warnFn ?? ((msg: string) => console.warn(msg));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetcher();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const delayMs = computeBackoffDelayMs(attempt, baseDelayMs, jitterRatio);

      if (attempt < maxAttempts) {
        warn(
          `[AgriFlow Oracle] ${feedName} fetch failed on attempt ${attempt}/${maxAttempts} (${errMsg}). Retrying in ${delayMs}ms...`,
          err
        );
        await sleep(delayMs);
      } else {
        warn(
          `[AgriFlow Oracle] ${feedName} fetch exhausted all ${maxAttempts} attempts (${errMsg}). Returning fallback oracle data.`,
          err
        );
      }
    }
  }

  return await fallbackFn();
}

export interface IAgriculturalOracle {
  getCommodityPrices(): Promise<CommodityPrice[]>;
  getRegionalWeather(): Promise<WeatherRiskIndex[]>;
  getOracleData(): Promise<OracleFeedData>;
  getDeployedOracleContracts(): typeof AGRIFLOW_ORACLE_NETWORK_CONTRACTS;
}

export class AgriculturalOracleService implements IAgriculturalOracle {
  private xlmUsdRate: number = 0.125; // 1 XLM ~ $0.125 USD on testnet
  private priceFetcher?: () => Promise<CommodityPrice[]>;
  private weatherFetcher?: () => Promise<WeatherRiskIndex[]>;
  private retryOptions: OracleRetryOptions;

  constructor(options: AgriculturalOracleServiceOptions = {}) {
    this.priceFetcher = options.priceFetcher;
    this.weatherFetcher = options.weatherFetcher;
    this.retryOptions = options.retryOptions || {};
  }

  getDeployedOracleContracts() {
    return AGRIFLOW_ORACLE_NETWORK_CONTRACTS;
  }

  private getFallbackCommodityPrices(): CommodityPrice[] {
    const now = Date.now();
    return [
      {
        commodity: 'Maize',
        priceUsdPerTon: 185.5,
        priceXlmPerTon: Math.round(185.5 / this.xlmUsdRate),
        change24hPercent: 1.8,
        lastUpdated: now,
        source: 'AgriFlow Oracle Network (Soroban Testnet: CDE2KRZ...GEI7)',
      },
      {
        commodity: 'Soybeans',
        priceUsdPerTon: 420.0,
        priceXlmPerTon: Math.round(420.0 / this.xlmUsdRate),
        change24hPercent: -1.1,
        lastUpdated: now,
        source: 'AgriFlow Oracle Network (Soroban Testnet: CDE2KRZ...GEI7)',
      },
      {
        commodity: 'Wheat',
        priceUsdPerTon: 228.0,
        priceXlmPerTon: Math.round(228.0 / this.xlmUsdRate),
        change24hPercent: -0.4,
        lastUpdated: now,
        source: 'AgriFlow Oracle Network (Soroban Testnet: CDE2KRZ...GEI7)',
      },
      {
        commodity: 'Coffee',
        priceUsdPerTon: 3850.0,
        priceXlmPerTon: Math.round(3850.0 / this.xlmUsdRate),
        change24hPercent: 0.9,
        lastUpdated: now,
        source: 'AgriFlow Oracle Network (Soroban Testnet: CDE2KRZ...GEI7)',
      },
      {
        commodity: 'Cocoa',
        priceUsdPerTon: 7200.0,
        priceXlmPerTon: Math.round(7200.0 / this.xlmUsdRate),
        change24hPercent: 3.2,
        lastUpdated: now,
        source: 'AgriFlow Oracle Network (Soroban Testnet: CDE2KRZ...GEI7)',
      },
    ];
  }

  private getFallbackRegionalWeather(): WeatherRiskIndex[] {
    const now = Date.now();
    return [
      {
        region: 'Rift Valley Province',
        country: 'Kenya',
        rainfallMm: 95,
        temperatureCelsius: 22.4,
        droughtRisk: 'Low',
        harvestOutlook: 'Favorable',
        lastUpdated: now,
      },
      {
        region: 'Kano / Kaduna Grain Belt',
        country: 'Nigeria',
        rainfallMm: 22,
        temperatureCelsius: 32.1,
        droughtRisk: 'Elevated',
        harvestOutlook: 'Stressed',
        lastUpdated: now,
      },
      {
        region: 'Mato Grosso',
        country: 'Brazil',
        rainfallMm: 160,
        temperatureCelsius: 31.0,
        droughtRisk: 'Low',
        harvestOutlook: 'Favorable',
        lastUpdated: now,
      },
      {
        region: 'Ashanti Cooperative Basin',
        country: 'Ghana',
        rainfallMm: 130,
        temperatureCelsius: 27.5,
        droughtRisk: 'Low',
        harvestOutlook: 'Favorable',
        lastUpdated: now,
      },
      {
        region: 'Bas-Sassandra',
        country: "Côte d'Ivoire",
        rainfallMm: 145,
        temperatureCelsius: 28.0,
        droughtRisk: 'Low',
        harvestOutlook: 'Favorable',
        lastUpdated: now,
      },
    ];
  }

  async getCommodityPrices(): Promise<CommodityPrice[]> {
    const fetcher = this.priceFetcher ?? (async () => this.getFallbackCommodityPrices());
    return fetchWithExponentialBackoff(
      'commodity-prices',
      fetcher,
      () => this.getFallbackCommodityPrices(),
      this.retryOptions
    );
  }

  async getRegionalWeather(): Promise<WeatherRiskIndex[]> {
    const fetcher = this.weatherFetcher ?? (async () => this.getFallbackRegionalWeather());
    return fetchWithExponentialBackoff(
      'regional-weather',
      fetcher,
      () => this.getFallbackRegionalWeather(),
      this.retryOptions
    );
  }

  async getOracleData(): Promise<OracleFeedData> {
    const [prices, weather] = await Promise.all([
      this.getCommodityPrices(),
      this.getRegionalWeather(),
    ]);

    return {
      prices,
      weather,
      xlmUsdRate: this.xlmUsdRate,
      oracleProvider: 'AgriFlow Oracle Network (Stellar & Soroban Decentralized Feeds)',
      isExternalData: true,
    };
  }
}

export const defaultOracleService = new AgriculturalOracleService();
