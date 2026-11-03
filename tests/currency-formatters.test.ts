import { describe, it, expect } from 'vitest';
import { SUPPORTED_FIAT_CURRENCIES } from '../apps/web/src/services/anchorClient';
import { PathPaymentRoutingService } from '../apps/web/src/services/pathPaymentRouting';

describe('African Fiat Currencies & Payment Path Routing', () => {
  it('includes all primary African agricultural currencies with valid minimum bounds', () => {
    const codes = SUPPORTED_FIAT_CURRENCIES.map((c) => c.code);
    expect(codes).toContain('NGN');
    expect(codes).toContain('KES');
    expect(codes).toContain('GHS');
    expect(codes).toContain('ZAR');

    const ngn = SUPPORTED_FIAT_CURRENCIES.find((c) => c.code === 'NGN')!;
    expect(ngn.symbol).toBe('₦');
    expect(ngn.minAmount).toBeGreaterThan(0);
    expect(ngn.maxAmount).toBeGreaterThan(ngn.minAmount);
  });

  it('calculates direct trading route when direct exchange rate exists', () => {
    const rateMap = {
      'USDC_KES': 130.5,
    };

    const route = PathPaymentRoutingService.findOptimalRoute('USDC', 'KES', 100, rateMap);

    expect(route.sourceAmount).toBe(100);
    expect(route.destinationAmount).toBe(13050);
    expect(route.path.length).toBe(0); // Direct route
    expect(route.estimatedSlippagePercent).toBe(0.1);
  });

  it('calculates multi-hop routing via XLM intermediate asset when no direct pair exists', () => {
    const rateMap = {
      'NGN_XLM': 0.005, // 1 NGN = 0.005 XLM
      'XLM_KES': 20.0,  // 1 XLM = 20 KES
    };

    const route = PathPaymentRoutingService.findOptimalRoute('NGN', 'KES', 10000, rateMap);

    expect(route.sourceAmount).toBe(10000);
    // 10000 * 0.005 * 20 = 1000 KES
    expect(route.destinationAmount).toBe(1000);
    expect(route.path).toEqual(['XLM']);
    expect(route.estimatedSlippagePercent).toBe(0.35);
  });
});
