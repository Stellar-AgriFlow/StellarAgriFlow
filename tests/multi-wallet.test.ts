import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_WALLETS,
  getAdapterForProvider,
  FreighterWalletAdapter,
  XBullWalletAdapter,
  AlbedoWalletAdapter,
  HanaWalletAdapter,
  TestnetPreviewWalletAdapter,
} from '../apps/web/src/services/walletAdapter';
import { WalletProvider } from '../packages/types/src/wallet';

describe('Multi-Wallet Integration & Adapter Registry', () => {
  it('lists all supported wallet providers with complete metadata', () => {
    expect(SUPPORTED_WALLETS.length).toBeGreaterThanOrEqual(4);

    const freighter = SUPPORTED_WALLETS.find((w) => w.id === 'FREIGHTER');
    expect(freighter).toBeDefined();
    expect(freighter?.name).toBe('Freighter');
    expect(freighter?.downloadUrl).toContain('freighter.app');

    const xbull = SUPPORTED_WALLETS.find((w) => w.id === 'XBULL');
    expect(xbull).toBeDefined();
    expect(xbull?.name).toBe('xBull Wallet');

    const albedo = SUPPORTED_WALLETS.find((w) => w.id === 'ALBEDO');
    expect(albedo).toBeDefined();
    expect(albedo?.name).toBe('Albedo');

    const hana = SUPPORTED_WALLETS.find((w) => w.id === 'HANA');
    expect(hana).toBeDefined();
    expect(hana?.name).toBe('Hana Wallet');
  });

  it('instantiates the proper adapter for each supported wallet type', () => {
    const freighterAdapter = getAdapterForProvider('FREIGHTER');
    expect(freighterAdapter).toBeInstanceOf(FreighterWalletAdapter);
    expect(freighterAdapter.id).toBe('FREIGHTER');
    expect(freighterAdapter.name).toBe('Freighter');

    const xbullAdapter = getAdapterForProvider('XBULL');
    expect(xbullAdapter).toBeInstanceOf(XBullWalletAdapter);
    expect(xbullAdapter.id).toBe('XBULL');

    const albedoAdapter = getAdapterForProvider('ALBEDO');
    expect(albedoAdapter).toBeInstanceOf(AlbedoWalletAdapter);
    expect(albedoAdapter.id).toBe('ALBEDO');

    const hanaAdapter = getAdapterForProvider('HANA');
    expect(hanaAdapter).toBeInstanceOf(HanaWalletAdapter);
    expect(hanaAdapter.id).toBe('HANA');

    const testnetAdapter = getAdapterForProvider('TESTNET_DEMO');
    expect(testnetAdapter).toBeInstanceOf(TestnetPreviewWalletAdapter);
    expect(testnetAdapter.id).toBe('TESTNET_DEMO');
  });

  it('safely handles isAvailable checks in non-browser environments', async () => {
    const freighter = new FreighterWalletAdapter();
    const xbull = new XBullWalletAdapter();
    const albedo = new AlbedoWalletAdapter();

    expect(await freighter.isAvailable()).toBe(false);
    expect(await xbull.isAvailable()).toBe(false);
    expect(await albedo.isAvailable()).toBe(true);
  });

  it('supports connection on testnet preview adapter with valid Stellar address', async () => {
    const adapter = getAdapterForProvider('TESTNET_DEMO');
    const address = await adapter.connect();
    expect(address).toBeDefined();
    expect(address.startsWith('G')).toBe(true);
    expect(address.length).toBe(56);

    const pubKey = await adapter.getPublicKey();
    expect(pubKey).toBe(address);
  });

  it('handles simulated transaction signing on testnet preview adapter', async () => {
    const adapter = getAdapterForProvider('TESTNET_DEMO');
    const dummyXdr = 'AAAAAGBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU';
    const signed = await adapter.signTransaction(dummyXdr);
    expect(signed).toBe(dummyXdr);
  });
});
