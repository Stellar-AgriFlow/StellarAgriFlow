import { describe, it, expect } from 'vitest';
import { CrossChainBridgeAdapter } from '../packages/contracts-client/src/crossChainBridgeAdapter';

describe('CrossChainBridgeAdapter', () => {
  const stellarSender = 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL';
  const polygonRecipient = '0x71C83d376AEc5904F5C95c73B8652D40905D4180';

  it('handles outbound lock on Stellar and confirms mint on Polygon', () => {
    const bridge = new CrossChainBridgeAdapter();

    const lock = bridge.initiateStellarLock('CROP_MAIZE', 5000, stellarSender, polygonRecipient, 'POLYGON');
    expect(lock.status).toBe('LOCKED_ON_STELLAR');
    expect(lock.amount).toBe(5000);
    expect(lock.transferId).toMatch(/^BRIDGE-OUT-[A-Z0-9]{12}$/);

    const mint = bridge.confirmTargetMint(lock.transferId, '0xpoly_mint_hash_123');
    expect(mint.status).toBe('MINTED_ON_TARGET');
    expect(mint.externalTxHash).toBe('0xpoly_mint_hash_123');
  });

  it('handles inbound burn on Polygon and confirms unlock on Stellar', () => {
    const bridge = new CrossChainBridgeAdapter();

    const burn = bridge.initiateInboundBurn(
      'CROP_MAIZE',
      2500,
      polygonRecipient,
      stellarSender,
      'POLYGON',
      '0xpoly_burn_hash_456'
    );
    expect(burn.status).toBe('BURNED_ON_TARGET');
    expect(burn.transferId).toMatch(/^BRIDGE-IN-[A-Z0-9]{12}$/);

    const unlock = bridge.confirmStellarUnlock(burn.transferId, 'stellar_unlock_tx_789');
    expect(unlock.status).toBe('UNLOCKED_ON_STELLAR');
    expect(unlock.stellarTxHash).toBe('stellar_unlock_tx_789');
  });

  it('rejects invalid state transition', () => {
    const bridge = new CrossChainBridgeAdapter();
    const lock = bridge.initiateStellarLock('USDC', 100, stellarSender, polygonRecipient);

    expect(() => {
      bridge.confirmStellarUnlock(lock.transferId, 'invalid_unlock');
    }).toThrow(/Invalid transition/);
  });
});
