import { describe, it, expect } from 'vitest';
import { Keypair } from '@stellar/stellar-sdk';
import { StellarChannelPool } from '../packages/stellar/src/channelAccounts';

describe('Stellar Channel Account Pool', () => {
  it('acquires and releases channel accounts successfully', () => {
    const kp1 = Keypair.random();
    const kp2 = Keypair.random();

    const pool = new StellarChannelPool();
    pool.addChannel(kp1);
    pool.addChannel(kp2);

    expect(pool.getPoolStatus().totalChannels).toBe(2);
    expect(pool.getPoolStatus().availableChannels).toBe(2);

    // Acquire first channel
    const acquired1 = pool.acquireChannel();
    expect(acquired1?.publicKey()).toBe(kp1.publicKey());
    expect(pool.getPoolStatus().availableChannels).toBe(1);

    // Acquire second channel
    const acquired2 = pool.acquireChannel();
    expect(acquired2?.publicKey()).toBe(kp2.publicKey());
    expect(pool.getPoolStatus().availableChannels).toBe(0);

    // Third acquire returns null as all channels are busy
    const acquired3 = pool.acquireChannel();
    expect(acquired3).toBeNull();

    // Release first channel
    pool.releaseChannel(kp1.publicKey());
    expect(pool.getPoolStatus().availableChannels).toBe(1);

    const reacquired = pool.acquireChannel();
    expect(reacquired?.publicKey()).toBe(kp1.publicKey());
  });
});
