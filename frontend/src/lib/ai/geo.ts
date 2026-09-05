/**
 * CivicPulse Geospatial Intelligence Module
 * Haversine distance calculation, proximity scoring, and spatial cluster detection.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Compute geographic proximity score (1.0 = 0m, 0.0 >= thresholdMeters)
 */
export function computeGeoProximityScore(
  distanceMeters: number,
  thresholdMeters: number = 600
): number {
  if (distanceMeters <= 0) return 1.0;
  if (distanceMeters >= thresholdMeters) return 0.0;
  
  // Smooth non-linear decay
  return Math.max(0, 1 - Math.pow(distanceMeters / thresholdMeters, 1.2));
}

/**
 * Check if a location is near a safety-sensitive anchor (School, Hospital, Metro)
 */
export interface SensitiveAnchor {
  name: string;
  type: 'school' | 'hospital' | 'transit' | 'market';
  lat: number;
  lng: number;
  sensitivityMultiplier: number;
}

export const KNOWN_CITY_ANCHORS: SensitiveAnchor[] = [
  { name: "St. Xavier's Model High School", type: "school", lat: 21.1702, lng: 72.8311, sensitivityMultiplier: 1.4 },
  { name: "City Civil Hospital & Trauma Center", type: "hospital", lat: 21.1755, lng: 72.8250, sensitivityMultiplier: 1.5 },
  { name: "Central Metro Intermodal Station", type: "transit", lat: 21.1820, lng: 72.8390, sensitivityMultiplier: 1.3 },
  { name: "APMC Agricultural & Wholesale Market", type: "market", lat: 21.1640, lng: 72.8450, sensitivityMultiplier: 1.2 },
];

export function findNearbySensitiveAnchor(lat: number, lng: number, radiusMeters: number = 400): SensitiveAnchor | null {
  for (const anchor of KNOWN_CITY_ANCHORS) {
    const dist = calculateHaversineDistance(lat, lng, anchor.lat, anchor.lng);
    if (dist <= radiusMeters) {
      return anchor;
    }
  }
  return null;
}
