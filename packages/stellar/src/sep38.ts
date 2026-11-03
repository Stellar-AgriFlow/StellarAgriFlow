export interface Sep38Asset {
  asset: string;
  country_codes?: string[];
  sell_delivery_methods?: Array<{ name: string; description: string }>;
  buy_delivery_methods?: Array<{ name: string; description: string }>;
}

export interface Sep38PriceInfo {
  total_price: string;
  price: string;
  fee: {
    total: string;
    asset: string;
  };
}

export interface Sep38QuoteResponse {
  id: string;
  expires_at: string;
  total_price: string;
  price: string;
  sell_asset: string;
  sell_amount: string;
  buy_asset: string;
  buy_amount: string;
  fee: {
    total: string;
    asset: string;
  };
}

export class Sep38QuoteClient {
  private anchorQuoteEndpoint: string;

  constructor(anchorQuoteEndpoint: string) {
    this.anchorQuoteEndpoint = anchorQuoteEndpoint.replace(/\/$/, '');
  }

  /**
   * Calculates estimated conversion proceeds with fee and slippage buffer
   */
  calculateNetConversion(
    sellAmount: number,
    exchangeRate: number,
    feePercent: number = 0.5,
    slippageTolerancePercent: number = 0.5
  ): {
    grossBuyAmount: number;
    feeAmount: number;
    netBuyAmount: number;
    minimumReceived: number;
  } {
    if (sellAmount <= 0 || exchangeRate <= 0) {
      return { grossBuyAmount: 0, feeAmount: 0, netBuyAmount: 0, minimumReceived: 0 };
    }

    const grossBuyAmount = sellAmount * exchangeRate;
    const feeAmount = grossBuyAmount * (feePercent / 100);
    const netBuyAmount = grossBuyAmount - feeAmount;
    const minimumReceived = netBuyAmount * (1 - slippageTolerancePercent / 100);

    return {
      grossBuyAmount,
      feeAmount,
      netBuyAmount,
      minimumReceived,
    };
  }

  /**
   * Formats SEP-38 asset identification string
   * e.g. stellar:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
   * or iso4217:NGN / iso4217:KES
   */
  static formatStellarAsset(code: string, issuer?: string): string {
    if (code.toUpperCase() === 'XLM' || !issuer) {
      return 'stellar:native';
    }
    return `stellar:${code}:${issuer}`;
  }

  static formatFiatAsset(currencyCode: string): string {
    return `iso4217:${currencyCode.toUpperCase()}`;
  }
}
