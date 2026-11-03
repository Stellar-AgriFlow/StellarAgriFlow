import { Keypair } from '@stellar/stellar-sdk';

export interface ChannelAccountItem {
  keypair: Keypair;
  isBusy: boolean;
  lastUsedTimestamp: number;
}

export class StellarChannelPool {
  private channels: ChannelAccountItem[] = [];

  constructor(secretKeys: string[] = []) {
    for (const secret of secretKeys) {
      try {
        const kp = Keypair.fromSecret(secret);
        this.channels.push({
          keypair: kp,
          isBusy: false,
          lastUsedTimestamp: 0,
        });
      } catch (err) {
        console.warn('Skipping invalid channel secret key', err);
      }
    }
  }

  addChannel(keypair: Keypair): void {
    this.channels.push({
      keypair,
      isBusy: false,
      lastUsedTimestamp: 0,
    });
  }

  /**
   * Acquires an idle channel account for exclusive transaction signing
   */
  acquireChannel(): Keypair | null {
    const idleChannel = this.channels.find((c) => !c.isBusy);
    if (!idleChannel) return null;

    idleChannel.isBusy = true;
    idleChannel.lastUsedTimestamp = Date.now();
    return idleChannel.keypair;
  }

  /**
   * Releases a channel account back into the available pool
   */
  releaseChannel(publicKey: string): void {
    const channel = this.channels.find((c) => c.keypair.publicKey() === publicKey);
    if (channel) {
      channel.isBusy = false;
    }
  }

  getPoolStatus(): { totalChannels: number; availableChannels: number } {
    return {
      totalChannels: this.channels.length,
      availableChannels: this.channels.filter((c) => !c.isBusy).length,
    };
  }
}
