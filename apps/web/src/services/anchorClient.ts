import { Sep24Client, Sep38Client, Sep38QuoteRequest, Sep38QuoteResponse } from '@agriflow/stellar';

export interface SupportedFiatCurrency {
  code: string;
  symbol: string;
  name: string;
  stellarAsset: string;
  minAmount: number;
  maxAmount: number;
}

export const SUPPORTED_FIAT_CURRENCIES: SupportedFiatCurrency[] = [
  {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    stellarAsset: 'NGNC',
    minAmount: 1000,
    maxAmount: 50000000,
  },
  {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    stellarAsset: 'KESC',
    minAmount: 500,
    maxAmount: 20000000,
  },
  {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    stellarAsset: 'GHSC',
    minAmount: 50,
    maxAmount: 5000000,
  },
  {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    stellarAsset: 'ZARC',
    minAmount: 100,
    maxAmount: 1000000,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    stellarAsset: 'USDC',
    minAmount: 10,
    maxAmount: 100000,
  },
];

export class AgriFlowAnchorService {
  private sep24: Sep24Client;
  private sep38: Sep38Client;

  constructor(
    sep24TransferServerUrl: string = 'https://anchor.stellar-agriflow.org/sep24',
    sep38QuoteServerUrl: string = 'https://anchor.stellar-agriflow.org/sep38'
  ) {
    this.sep24 = new Sep24Client(sep24TransferServerUrl);
    this.sep38 = new Sep38Client(sep38QuoteServerUrl);
  }

  /**
   * Request a guaranteed pricing quote to convert fiat currency to Stellar USDC/EURC or vice versa
   */
  async getExchangeQuote(
    request: Sep38QuoteRequest,
    authToken?: string
  ): Promise<Sep38QuoteResponse> {
    return this.sep38.requestFirmQuote(request, authToken);
  }

  /**
   * Initiate an interactive SEP-24 deposit bridge for local mobile money / bank transfer
   */
  async initiateFiatDeposit(params: {
    assetCode: string;
    account: string;
    amount?: string;
    authToken?: string;
  }) {
    return this.sep24.initiateInteractiveDeposit({
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
    }, params.authToken);
  }

  /**
   * Initiate an interactive SEP-24 withdrawal to pay out local fiat currency to bank or mobile money
   */
  async initiateFiatWithdrawal(params: {
    assetCode: string;
    account: string;
    amount?: string;
    authToken?: string;
  }) {
    return this.sep24.initiateInteractiveWithdrawal({
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
    }, params.authToken);
  }

  /**
   * Track the status of an ongoing SEP-24 deposit or withdrawal transaction
   */
  async checkTransactionStatus(txId: string, authToken?: string) {
    return this.sep24.getTransactionStatus(txId, authToken);
  }

  /**
   * Retrieve list of supported local currencies for agricultural trade settlement
   */
  getSupportedCurrencies(): SupportedFiatCurrency[] {
    return SUPPORTED_FIAT_CURRENCIES;
  }
}
