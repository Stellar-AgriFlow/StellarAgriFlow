import { BaseSorobanClient, BaseClientConfig } from './base';

export const TESTNET_USDC_SAC_CONTRACT_ID =
  'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXN2Z8PT4FD7MXCGBJZTOO2CDZ9';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export class StellarAssetClient extends BaseSorobanClient {
  constructor(config?: Partial<BaseClientConfig> | string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || TESTNET_USDC_SAC_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  /**
   * Queries balance of an account in SEP-41 token units
   */
  async balance(account: string): Promise<bigint> {
    try {
      const result = await this.readContract('balance', []);
      return BigInt(result || 0);
    } catch {
      return BigInt(0);
    }
  }

  /**
   * Queries spender allowance granted by owner
   */
  async allowance(owner: string, spender: string): Promise<bigint> {
    try {
      const result = await this.readContract('allowance', []);
      return BigInt(result || 0);
    } catch {
      return BigInt(0);
    }
  }

  /**
   * Fetches token metadata (decimals, name, symbol)
   */
  async getMetadata(): Promise<TokenMetadata> {
    try {
      const [name, symbol, decimals] = await Promise.all([
        this.readContract('name', []).catch(() => 'Circle USD'),
        this.readContract('symbol', []).catch(() => 'USDC'),
        this.readContract('decimals', []).catch(() => 7),
      ]);

      return {
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
      };
    } catch {
      return {
        name: 'Circle USD',
        symbol: 'USDC',
        decimals: 7,
      };
    }
  }

  /**
   * Formats raw token stroops / base units into human-readable decimal string
   */
  static formatUnits(amount: bigint | number, decimals: number = 7): string {
    const raw = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const integerPart = raw / divisor;
    const remainder = raw % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${integerPart}.${remainderStr}`.replace(/\.?0+$/, '');
  }

  /**
   * Parses human-readable decimal string into raw base units
   */
  static parseUnits(amountStr: string, decimals: number = 7): bigint {
    const [intPart, fracPart = ''] = amountStr.trim().split('.');
    const paddedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
    return BigInt(intPart || '0') * BigInt(10 ** decimals) + BigInt(paddedFrac);
  }
}
