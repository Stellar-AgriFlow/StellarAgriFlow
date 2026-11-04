import { describe, it, expect } from 'vitest';
import { GeoFenceValidator, GpsCoordinate } from '../packages/contracts-client/src/geoFenceValidator';

describe('GeoFenceValidator', () => {
  // Bounding box around Nakuru agricultural region, Kenya:
  // (0.2° S to 0.4° S, 36.0° E to 36.2° E)
  const nakuruZonePolygon: GpsCoordinate[] = [
    { latitude: -0.2, longitude: 36.0 },
    { latitude: -0.2, longitude: 36.2 },
    { latitude: -0.4, longitude: 36.2 },
    { latitude: -0.4, longitude: 36.0 },
  ];

  it('detects coordinate point located strictly inside polygon zone', () => {
    const insidePoint: GpsCoordinate = { latitude: -0.3, longitude: 36.1 };
    expect(GeoFenceValidator.isPointInPolygon(insidePoint, nakuruZonePolygon)).toBe(true);
  });

  it('rejects coordinate point located outside polygon zone', () => {
    const outsidePoint: GpsCoordinate = { latitude: -1.286389, longitude: 36.817223 }; // Nairobi
    expect(GeoFenceValidator.isPointInPolygon(outsidePoint, nakuruZonePolygon)).toBe(false);
  });

  it('calculates Haversine distance between coordinates and verifies radius', () => {
    const nakuruStation: GpsCoordinate = { latitude: -0.283333, longitude: 36.066667 };
    const nearbyFarm: GpsCoordinate = { latitude: -0.300000, longitude: 36.100000 };

    const distance = GeoFenceValidator.calculateHaversineDistanceKm(nakuruStation, nearbyFarm);
    expect(distance).toBeGreaterThan(3);
    expect(distance).toBeLessThan(6); // ~4.1 km

    const check10km = GeoFenceValidator.isWithinRadius(nakuruStation, nearbyFarm, 10);
    expect(check10km.isWithin).toBe(true);

    const check2km = GeoFenceValidator.isWithinRadius(nakuruStation, nearbyFarm, 2);
    expect(check2km.isWithin).toBe(false);
  });

  it('throws for invalid polygon with fewer than 3 points', () => {
    expect(() => {
      GeoFenceValidator.isPointInPolygon(
        { latitude: 0, longitude: 0 },
        [{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }]
      );
    }).toThrow(/at least 3 vertices/);
  });
});
