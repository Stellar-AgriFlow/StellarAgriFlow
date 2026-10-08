import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Networks,
  Transaction,
} from '@stellar/stellar-sdk';
import {
  PaymentFormData,
  TransactionExecutionResult,
  PaymentReceipt,
} from '@agriflow/types';
import { STELLAR_TESTNET_CONFIG, STELLAR_BASE_FEE_STROOPS } from './config';
import { getHorizonServer } from './horizon';
import { getTxExplorerUrl } from './explorer';
import { parseStellarError } from './errors';

export interface BuildPaymentOptions {
  senderPublicKey: string;
  paymentData: PaymentFormData;
  networkPassphrase?: string;
  horizonUrl?: string;
}

export async function buildPaymentTransactionXdr({
  senderPublicKey,
  paymentData,
  networkPassphrase = STELLAR_TESTNET_CONFIG.networkPassphrase,
  horizonUrl = STELLAR_TESTNET_CONFIG.horizonUrl,
}: BuildPaymentOptions): Promise<string> {
  const server = getHorizonServer(horizonUrl);
  const sourceAccount = await server.loadAccount(senderPublicKey);

  // Check if destination account exists
  let isDestinationFunded = true;
  try {
    await server.loadAccount(paymentData.recipientAddress);
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      isDestinationFunded = false;
    }
  }

  // Format memo: "AGRI:Purpose" truncated to max 28 bytes
  const memoText = paymentData.memo
    ? paymentData.memo.slice(0, 28)
    : `AGRI:${paymentData.purpose.slice(0, 20)}`;

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: STELLAR_BASE_FEE_STROOPS,
    networkPassphrase,
  })
    .addMemo(Memo.text(memoText))
    .setTimeout(180);

  if (isDestinationFunded) {
    txBuilder.addOperation(
      Operation.payment({
        destination: paymentData.recipientAddress,
        asset: Asset.native(),
        amount: paymentData.amount,
      })
    );
  } else {
    // If destination does not exist, use createAccount
    txBuilder.addOperation(
      Operation.createAccount({
        destination: paymentData.recipientAddress,
        startingBalance: paymentData.amount,
      })
    );
  }

  const transaction = txBuilder.build();
  return transaction.toXDR();
}

export async function submitSignedTransaction(
  signedXdr: string,
  paymentData: PaymentFormData,
  senderPublicKey: string,
  networkPassphrase = STELLAR_TESTNET_CONFIG.networkPassphrase,
  horizonUrl = STELLAR_TESTNET_CONFIG.horizonUrl
): Promise<TransactionExecutionResult> {
  const server = getHorizonServer(horizonUrl);

  try {
    const transaction = new Transaction(signedXdr, networkPassphrase);
    const response = await server.submitTransaction(transaction);

    const receipt: PaymentReceipt = {
      hash: response.hash,
      ledger: response.ledger,
      createdAt: (response as any).created_at || new Date().toISOString(),
      sourceAccount: senderPublicKey,
      destinationAccount: paymentData.recipientAddress,
      amount: paymentData.amount,
      asset: 'XLM',
      purpose: paymentData.purpose,
      explorerUrl: getTxExplorerUrl(response.hash),
    };

    return {
      successful: true,
      hash: response.hash,
      ledger: response.ledger,
      receipt,
    };
  } catch (err: any) {
    const errorMessage = parseStellarError(err);
    return {
      successful: false,
      error: errorMessage,
    };
  }
}
