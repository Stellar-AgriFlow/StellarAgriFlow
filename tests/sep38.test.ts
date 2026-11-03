import { describe, it, expect } from 'vitest';
import { Sep38QuoteClient } from '../packages/stellar/src/sep38';

describe('SEP-38 Cross-Asset Anchor Quotes & Pricing', () => {
  const client = new Sep38QuoteClient('https://anchor.stellar-agriflow.org/sep38');

  it('calculates net proceeds with default fee and slippage tolerance', () => {
    // 1000 USDC converted to NGN at rate 1600 NGN/USDC
    const result = client.calculateNetConversion(1000, 1600, 0.5, 0.5);

    expect(result.grossBuyAmount).toBe(1600000);
    // 0.5% fee
    expect(result.feeAmount).toBe(8000);
    // net = 1600000 - 8000 = 1592000
    expect(result.netBuyAmount).toBe(1592000);
    // 0.5% slippage on 1592000 = 1592000 * 0.995 = 1584040
    expect(result.minimumReceived).toBe(1584040);
  });

  it('safely handles zero or negative amount and exchange rate', () => {
    const zeroAmount = client.calculateNetConversion(0, 1600);
    expect(zeroAmount.netBuyAmount).toBe(0);
    expect(zeroAmount.minimumReceived).toBe(0);

    const negativeRate = client.calculateNetConversion(100, -50);
    expect(negativeRate.netBuyAmount).toBe(0);
  });

  it('formats SEP-38 Stellar native asset identification string', () => {
    expect(Sep38QuoteClient.formatStellarAsset('XLM')).toBe('stellar:native');
    expect(Sep38QuoteClient.formatStellarAsset('xlm')).toBe('stellar:native');
  });

  it('formats SEP-38 issued asset identification string with issuer public key', () => {
    const issuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    expect(Sep38QuoteClient.formatStellarAsset('USDC', issuer)).toBe(
      `stellar:USDC:${issuer}`
    );
  });

  it('formats SEP-38 ISO4217 fiat currency string', () => {
    expect(Sep38QuoteClient.formatFiatAsset('ngn')).toBe('iso4217:NGN');
    expect(Sep38QuoteClient.formatFiatAsset('KES')).toBe('iso4217:KES');
    expect(Sep38QuoteClient.formatFiatAsset('zar')).toBe('iso4217:ZAR');
  });
});
