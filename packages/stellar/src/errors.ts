export function parseStellarError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  if (typeof error === 'string') {
    if (error.toLowerCase().includes('reject') || error.toLowerCase().includes('user denied')) {
      return 'Transaction was rejected in your wallet.';
    }
    return error;
  }

  const errObj = error as Record<string, any>;

  // Check message strings
  const message = errObj.message || errObj.error || '';
  if (typeof message === 'string') {
    const lower = message.toLowerCase();
    if (lower.includes('reject') || lower.includes('denied') || lower.includes('declined') || lower.includes('cancel')) {
      return 'Transaction was rejected in your wallet.';
    }
    if (lower.includes('freighter') && (lower.includes('not installed') || lower.includes('not found') || lower.includes('missing'))) {
      return 'Freighter wallet was not detected. Please install Freighter to continue.';
    }
    if (lower.includes('not found') || lower.includes('status code 404')) {
      return 'Account not found on Stellar Testnet. Please fund your account using the Stellar Friendbot.';
    }
  }

  // Horizon error responses
  const response = errObj.response?.data;
  if (response?.extras?.result_codes) {
    const codes = response.extras.result_codes;
    const opCodes: string[] = codes.operations || [];

    if (opCodes.includes('op_underfunded')) {
      return 'Insufficient XLM balance for this transaction.';
    }
    if (opCodes.includes('op_no_destination')) {
      return 'Recipient account is not activated on Stellar Testnet. Send at least 1 XLM to fund and activate the account.';
    }
    if (opCodes.includes('op_src_no_trust') || opCodes.includes('op_no_trust')) {
      return 'Missing required trustline for this asset.';
    }
    if (codes.transaction === 'tx_insufficient_balance') {
      return 'Insufficient XLM balance for transaction fee and reserve requirements.';
    }
    if (codes.transaction === 'tx_bad_seq') {
      return 'Account sequence number out of sync. Please retry.';
    }
  }

  // HTTP status
  if (errObj.response?.status === 404) {
    return 'Account not found on Stellar Testnet. Fund your account with Friendbot to activate it.';
  }

  return message || 'Transaction failed. Please check your network connection and try again.';
}
