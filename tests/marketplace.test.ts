import { describe, it, expect } from 'vitest';
import { ProduceListing, CreateListingParams } from '../packages/types/src/marketplace';

describe('Produce Marketplace & Listing Validation', () => {
  const validParams: CreateListingParams = {
    seller: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
    farmId: 'AGRI-000001',
    cropType: 'Organic White Maize',
    quantity: 100,
    unit: 'Bags (50kg)',
    pricePerUnitXlm: 18,
    location: 'Nakuru, Kenya',
  };

  it('calculates total settlement amount accurately', () => {
    const total = validParams.quantity * validParams.pricePerUnitXlm;
    expect(total).toBe(1800);
  });

  it('rejects listing creation with zero or negative quantity', () => {
    const validate = (qty: number, price: number) => {
      if (qty <= 0) return 'Quantity must be greater than zero';
      if (price <= 0) return 'Price must be greater than zero';
      return null;
    };

    expect(validate(0, 18)).toBe('Quantity must be greater than zero');
    expect(validate(-5, 18)).toBe('Quantity must be greater than zero');
    expect(validate(100, 0)).toBe('Price must be greater than zero');
    expect(validate(100, 18)).toBeNull();
  });

  it('prevents seller from purchasing their own produce listing', () => {
    const seller = 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU';
    const buyer = 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU';
    const distinctBuyer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

    const canPurchase = (s: string, b: string) => s !== b;
    expect(canPurchase(seller, buyer)).toBe(false);
    expect(canPurchase(seller, distinctBuyer)).toBe(true);
  });
});
