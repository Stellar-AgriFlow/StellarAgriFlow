import { createHash } from 'node:crypto';

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
    return createHash('sha256').update(raw).digest('hex');
  }

  public initiateStellarLock(
    assetCode: string,
    amount: number,
    stellarSender: string,
    externalRecipient: string,
    targetChain: BridgeChain = 'POLYGON',
    stellarTxHash?: string
  ): CrossChainTransferRecord {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');
    if (!stellarSender.startsWith('G') && !stellarSender.startsWith('C')) {
      throw new Error(`Invalid Stellar sender address: ${stellarSender}`);
    }

    const nonce = ++this.nonceCounter;
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
      stellarTxHash: stellarTxHash || `tx_stellar_lock_${nonce}`,
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
    if (!record) throw new Error(`Transfer ${transferId} not found`);
    if (record.status !== 'LOCKED_ON_STELLAR') {
      throw new Error(`Invalid transition: transfer is in status ${record.status}`);
    }

    record.status = 'MINTED_ON_TARGET';
    record.externalTxHash = externalTxHash;
    return record;
  }

  public initiateInboundBurn(
    assetCode: string,
    amount: number,
    externalSender: string,
    stellarRecipient: string,
    sourceChain: BridgeChain = 'POLYGON',
    externalBurnTxHash: string
  ): CrossChainTransferRecord {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');
    if (!stellarRecipient.startsWith('G') && !stellarRecipient.startsWith('C')) {
      throw new Error(`Invalid Stellar recipient address: ${stellarRecipient}`);
    }

    const nonce = ++this.nonceCounter;
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
      externalTxHash: externalBurnTxHash,
      status: 'BURNED_ON_TARGET',
      nonce,
      messageHash,
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };

    this.transfers.set(transferId, record);
    return record;
  }

  public confirmStellarUnlock(transferId: string, stellarUnlockTxHash: string): CrossChainTransferRecord {
    const record = this.transfers.get(transferId);
    if (!record) throw new Error(`Transfer ${transferId} not found`);
    if (record.status !== 'BURNED_ON_TARGET') {
      throw new Error(`Invalid transition: transfer is in status ${record.status}`);
    }

    record.status = 'UNLOCKED_ON_STELLAR';
    record.stellarTxHash = stellarUnlockTxHash;
    return record;
  }

  public getTransfer(transferId: string): CrossChainTransferRecord | undefined {
    return this.transfers.get(transferId);
  }
}
