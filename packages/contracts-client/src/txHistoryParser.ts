export interface AgriDomainTransaction {
  hash: string;
  action: string;
  category: 'FINANCE' | 'ESCROW' | 'MARKETPLACE' | 'REGISTRY' | 'RWA' | 'INSURANCE' | 'OTHER';
  summary: string;
  timestamp: string;
  isSuccessful: boolean;
  contractId?: string;
}

export class TransactionHistoryParser {
  /**
   * Parses contract function invocation into human-readable agricultural domain event
   */
  static parseFunctionCall(fnName: string, args: Record<string, any> = {}): {
    action: string;
    category: AgriDomainTransaction['category'];
    summary: string;
  } {
    switch (fnName) {
      case 'apply_loan':
      case 'request_financing':
        return {
          action: 'Apply for Microloan',
          category: 'FINANCE',
          summary: `Requested loan of $${args.amount ?? 'N/A'} for agricultural inputs`,
        };
      case 'repay_loan':
        return {
          action: 'Repay Loan',
          category: 'FINANCE',
          summary: `Repaid $${args.amount ?? 'N/A'} towards loan #${args.loanId ?? ''}`,
        };
      case 'create_escrow':
        return {
          action: 'Initiate Escrow',
          category: 'ESCROW',
          summary: `Created trade escrow for $${args.amount ?? 'N/A'} with inspection gating`,
        };
      case 'release_funds':
        return {
          action: 'Release Escrow',
          category: 'ESCROW',
          summary: `Released funds to commodity seller for escrow #${args.escrowId ?? ''}`,
        };
      case 'mint_receipt':
        return {
          action: 'Mint Warehouse Receipt',
          category: 'RWA',
          summary: `Tokenized ${args.quantityKg ?? 'N/A'} kg of ${args.commodityType ?? 'crop'} in custodian warehouse`,
        };
      case 'pledge_receipt':
        return {
          action: 'Pledge Collateral',
          category: 'RWA',
          summary: `Pledged warehouse receipt #${args.receiptId ?? ''} as loan collateral`,
        };
      case 'purchase_policy':
        return {
          action: 'Underwrite Insurance',
          category: 'INSURANCE',
          summary: `Underwrote parametric climate coverage against drought/flood`,
        };
      case 'trigger_claim':
        return {
          action: 'Claim Insurance Payout',
          category: 'INSURANCE',
          summary: `Executed automated oracle-verified parametric payout`,
        };
      default:
        return {
          action: fnName,
          category: 'OTHER',
          summary: `Contract invocation: ${fnName}`,
        };
    }
  }
}
