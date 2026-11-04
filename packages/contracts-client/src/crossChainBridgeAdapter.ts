import { computeSha256 } from './utils/crypto';

export type BridgeChain = 'STELLAR_SOROBAN' | 'ETHEREUM' | 'POLYGON' | 'ARBITRUM' | 'SOLANA';

export type BridgeTransferStatus =
  | 'PENDING_LOCK'
  | 'LOCKED_ON_STELLAR'
  | 'MINTED_ON_TARGET'
  | 'BURNED_ON_TARGET'
  | 'UNLOCKED_ON_STELLAR'
  | 'FAILED';

export interface CrossChainTransferRecord {
  transferId: string;
  sourceChain: BridgeChain;
  targetChain: BridgeChain;
  assetCode: string;
  amount: number;
  senderAddress: string;
  recipientAddress: string;
  stellarTxHash?: string;
  externalTxHash?: string;
  status: BridgeTransferStatus;
  nonce: number;
  messageHash: string;
  createdAtTimestamp: number;
}

export class CrossChainBridgeAdapter {
  private transfers: Map<string, CrossChainTransferRecord> = new Map();
  private nonceCounter = 0;

  public computeMessageHash(
    sourceChain: BridgeChain,
    targetChain: BridgeChain,
    assetCode: string,
    amount: number,
    sender: string,
    recipient: string,
    nonce: number
  ): string {
    const raw = `${sourceChain}:${targetChain}:${assetCode}:${amount}:${sender}:${recipient}:${nonce}`;
    return computeSha256(raw);
  }

  public initiateStellarLock(
    assetCode: string,
    amount: number,
    stellarSender: string,
    externalRecipient: string,
    targetChain: BridgeChain = 'ETHEREUM'
  ): CrossChainTransferRecord {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    if (!stellarSender.startsWith('G') && !stellarSender.startsWith('C')) {
      throw new Error('Invalid Stellar sender address');
    }
    if (!externalRecipient) {
      throw new Error('External recipient cannot be empty');
    }

    this.nonceCounter++;
    const nonce = this.nonceCounter;
    const messageHash = this.computeMessageHash(
      'STELLAR_SOROBAN',
      targetChain,
      assetCode,
      amount,
      stellarSender,
      externalRecipient,
      nonce
    );

    const transferId = `BRIDGE-OUT-${messageHash.substring(0, 12).toUpperCase()}`;

    const record: CrossChainTransferRecord = {
      transferId,
      sourceChain: 'STELLAR_SOROBAN',
      targetChain,
      assetCode,
      amount,
      senderAddress: stellarSender,
      recipientAddress: externalRecipient,
      status: 'LOCKED_ON_STELLAR',
      nonce,
      messageHash,
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };

    this.transfers.set(transferId, record);
    return record;
  }

  public confirmTargetMint(transferId: string, externalTxHash: string): CrossChainTransferRecord {
    const record = this.transfers.get(transferId);
    if (!record) {
      throw new Error(`Transfer ID not found: ${transferId}`);
    }
    if (record.status !== 'LOCKED_ON_STELLAR') {
      throw new Error(`Invalid status transition from ${record.status} to MINTED_ON_TARGET`);
    }

    record.externalTxHash = externalTxHash;
    record.status = 'MINTED_ON_TARGET';
    return record;
  }

  public initiateInboundBurn(
    assetCode: string,
    amount: number,
    externalSender: string,
    stellarRecipient: string,
    sourceChain: BridgeChain,
    externalTxHash: string
  ): CrossChainTransferRecord {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    if (!stellarRecipient.startsWith('G') && !stellarRecipient.startsWith('C')) {
      throw new Error('Invalid Stellar recipient address');
    }

    this.nonceCounter++;
    const nonce = this.nonceCounter;
    const messageHash = this.computeMessageHash(
      sourceChain,
      'STELLAR_SOROBAN',
      assetCode,
      amount,
      externalSender,
      stellarRecipient,
      nonce
    );

    const transferId = `BRIDGE-IN-${messageHash.substring(0, 12).toUpperCase()}`;

    const record: CrossChainTransferRecord = {
      transferId,
      sourceChain,
      targetChain: 'STELLAR_SOROBAN',
      assetCode,
      amount,
      senderAddress: externalSender,
      recipientAddress: stellarRecipient,
      externalTxHash,
      status: 'BURNED_ON_TARGET',
      nonce,
      messageHash,
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };

    this.transfers.set(transferId, record);
    return record;
  }

  public confirmStellarUnlock(transferId: string, stellarTxHash: string): CrossChainTransferRecord {
    const record = this.transfers.get(transferId);
    if (!record) {
      throw new Error(`Transfer ID not found: ${transferId}`);
    }
    if (record.status !== 'BURNED_ON_TARGET') {
      throw new Error(`Invalid transition: cannot unlock transfer with status ${record.status}`);
    }

    record.stellarTxHash = stellarTxHash;
    record.status = 'UNLOCKED_ON_STELLAR';
    return record;
  }

  public initiateStellarUnlock(
    assetCode: string,
    amount: number,
    externalSender: string,
    stellarRecipient: string,
    sourceChain: BridgeChain,
    externalTxHash: string
  ): CrossChainTransferRecord {
    return this.initiateInboundBurn(assetCode, amount, externalSender, stellarRecipient, sourceChain, externalTxHash);
  }

  public getTransfer(transferId: string): CrossChainTransferRecord | undefined {
    return this.transfers.get(transferId);
  }
}
