export interface GpsCoordinate {
  latitude: number; // -90 to +90
  longitude: number; // -180 to +180
}

export interface GeoFenceZone {
  zoneId: string;
  zoneName: string;
  polygon: GpsCoordinate[]; // Minimum 3 vertices
  metadata?: Record<string, string>;
}

export class GeoFenceValidator {
  public static readonly EARTH_RADIUS_KM = 6371;

  public static validateCoordinate(coord: GpsCoordinate): boolean {
    return (
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
    );
  }

  public static validateZonePolygon(polygon: GpsCoordinate[]): void {
    if (!polygon || polygon.length < 3) {
      throw new Error('Polygon must contain at least 3 vertices');
    }
    for (const pt of polygon) {
      if (!this.validateCoordinate(pt)) {
        throw new Error(`Invalid coordinate vertex: lat ${pt.latitude}, lon ${pt.longitude}`);
      }
    }
  }

  /**
   * Ray-casting algorithm to test whether a GPS point is located within a 2D bounding polygon
   */
  public static isPointInPolygon(point: GpsCoordinate, polygon: GpsCoordinate[]): boolean {
    this.validateZonePolygon(polygon);
    if (!this.validateCoordinate(point)) return false;

    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect =
        yi > point.latitude !== yj > point.latitude &&
        point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Calculates great-circle distance between two GPS coordinates using the Haversine formula
   */
  public static calculateHaversineDistanceKm(coord1: GpsCoordinate, coord2: GpsCoordinate): number {
    this.validateCoordinate(coord1);
    this.validateCoordinate(coord2);

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);

    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((this.EARTH_RADIUS_KM * c).toFixed(3));
  }

  /**
   * Checks if an agricultural weather station is within maximum allowable radius of a farm
   */
  public static isWithinRadius(
    stationCoord: GpsCoordinate,
    farmCoord: GpsCoordinate,
    maxRadiusKm: number
  ): { isWithin: boolean; actualDistanceKm: number } {
    const actualDistanceKm = this.calculateHaversineDistanceKm(stationCoord, farmCoord);
    return {
      isWithin: actualDistanceKm <= maxRadiusKm,
      actualDistanceKm,
    };
  }
}
