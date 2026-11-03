export type StellarNetworkName = 'testnet' | 'public' | 'futurenet';

export class StellarExpertHelper {
  private network: StellarNetworkName;

  constructor(network: StellarNetworkName = 'testnet') {
    this.network = network;
  }

  private getBaseUrl(): string {
    switch (this.network) {
      case 'public':
        return 'https://stellar.expert/explorer/public';
      case 'futurenet':
        return 'https://stellar.expert/explorer/futurenet';
      case 'testnet':
      default:
        return 'https://stellar.expert/explorer/testnet';
    }
  }

  /**
   * Generates explorer link for a Soroban contract
   */
  getContractUrl(contractId: string): string {
    return `${this.getBaseUrl()}/contract/${contractId}`;
  }

  /**
   * Generates explorer link for an account public key
   */
  getAccountUrl(publicKey: string): string {
    return `${this.getBaseUrl()}/account/${publicKey}`;
  }

  /**
   * Generates explorer link for a transaction hash
   */
  getTransactionUrl(txHash: string): string {
    return `${this.getBaseUrl()}/tx/${txHash}`;
  }

  /**
   * Generates explorer link for a closed ledger sequence
   */
  getLedgerUrl(ledgerSeq: number): string {
    return `${this.getBaseUrl()}/ledger/${ledgerSeq}`;
  }

  /**
   * Generates explorer link for an issued Stellar asset
   */
  getAssetUrl(assetCode: string, issuerAddress: string): string {
    return `${this.getBaseUrl()}/asset/${assetCode}-${issuerAddress}`;
  }

  /**
   * Truncates an address or transaction hash for clean UI presentation
   */
  static formatTruncated(str: string, prefixLen: number = 6, suffixLen: number = 4): string {
    if (!str || str.length <= prefixLen + suffixLen) return str;
    return `${str.slice(0, prefixLen)}...${str.slice(-suffixLen)}`;
  }
}
