import { describe, it, expect } from 'vitest';

export function calculateDutchAuctionPrice(
  startPrice: number,
  reservePrice: number,
  startTime: number,
  durationSeconds: number,
  currentTime: number
): number {
  if (currentTime <= startTime) return startPrice;
  const elapsed = currentTime - startTime;
  if (elapsed >= durationSeconds) return reservePrice;

  const priceDiff = startPrice - reservePrice;
  const decay = (priceDiff * elapsed) / durationSeconds;
  return Math.round(startPrice - decay);
}

describe('Dutch Auction Mathematical Price Decay', () => {
  const startPrice = 10000;
  const reservePrice = 4000;
  const startTime = 1000;
  const duration = 1200; // 20 minutes

  it('returns starting price when elapsed time is zero or negative', () => {
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 1000)).toBe(10000);
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 900)).toBe(10000);
  });

  it('calculates linear decay at 25%, 50%, and 75% time intervals', () => {
    // 25% elapsed (300s): decay = 6000 * 0.25 = 1500 => price = 8500
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 1300)).toBe(8500);

    // 50% elapsed (600s): decay = 6000 * 0.50 = 3000 => price = 7000
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 1600)).toBe(7000);

    // 75% elapsed (900s): decay = 6000 * 0.75 = 4500 => price = 5500
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 1900)).toBe(5500);
  });

  it('strictly clamps to reserve price floor when time reaches or exceeds duration', () => {
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 2200)).toBe(4000);
    expect(calculateDutchAuctionPrice(startPrice, reservePrice, startTime, duration, 5000)).toBe(4000);
  });
});
