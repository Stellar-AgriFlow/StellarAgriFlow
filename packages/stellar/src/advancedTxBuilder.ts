import {
  Account,
  TransactionBuilder,
  Transaction,
  Operation,
  Memo,
} from '@stellar/stellar-sdk';
import { STELLAR_BASE_FEE_STROOPS, STELLAR_TESTNET_CONFIG } from './config';

export class AdvancedTransactionBuilder {
  private account: Account;
  private networkPassphrase: string;
  private baseFee: number;
  private operations: any[] = [];
  private memo?: Memo;
  private timeoutSeconds: number = 180;

  constructor(
    account: Account,
    networkPassphrase: string = STELLAR_TESTNET_CONFIG.networkPassphrase,
    baseFee: number = STELLAR_BASE_FEE_STROOPS
  ) {
    this.account = account;
    this.networkPassphrase = networkPassphrase;
    this.baseFee = baseFee;
  }

  addOperation(op: any): this {
    this.operations.push(op);
    return this;
  }

  setMemoText(text: string): this {
    this.memo = Memo.text(text.slice(0, 28));
    return this;
  }

  setFee(feeStroops: number): this {
    this.baseFee = feeStroops;
    return this;
  }

  setTimeout(seconds: number): this {
    this.timeoutSeconds = seconds;
    return this;
  }

  build(): Transaction {
    const builder = new TransactionBuilder(this.account, {
      fee: this.baseFee.toString(),
      networkPassphrase: this.networkPassphrase,
    });

    if (this.memo) {
      builder.addMemo(this.memo);
    }

    builder.setTimeout(this.timeoutSeconds);

    for (const op of this.operations) {
      builder.addOperation(op);
    }

    return builder.build();
  }
}
