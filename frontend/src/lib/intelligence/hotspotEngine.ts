/**
 * CivicPulse Phase 6 — Civic Hotspot Detection Engine
 * Clusters real coordinates using Haversine distance and computes explainable hotspot risk scores.
 */

import { Incident, CitizenReport } from "@/types";
import { CivicHotspot, TrendDirection } from "./predictiveTypes";

export const HOTSPOT_CONFIG = {
  HOTSPOT_RADIUS_METERS: 400,
  HOTSPOT_MIN_INCIDENTS: 2,
  HOTSPOT_LOOKBACK_DAYS: 30,
};

/**
 * Calculates Great-Circle distance in meters using Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectCivicHotspots(
  incidents: Incident[],
  reports: CitizenReport[] = [],
  radiusMeters: number = HOTSPOT_CONFIG.HOTSPOT_RADIUS_METERS,
  nowDate: Date = new Date()
): CivicHotspot[] {
  if (incidents.length === 0) return [];

  const nowMs = nowDate.getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Filter incidents within lookback window
  const lookbackMs = HOTSPOT_CONFIG.HOTSPOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const validIncidents = incidents.filter((inc) => {
    if (!inc.latitude || !inc.longitude) return false;
    const age = nowMs - new Date(inc.createdAt).getTime();
    return age <= lookbackMs;
  });

  if (validIncidents.length === 0) return [];

  // Greedy centroid clustering
  const assigned = new Set<string>();
  const rawClusters: Incident[][] = [];

  for (const inc of validIncidents) {
    if (assigned.has(inc.id)) continue;

    const cluster: Incident[] = [inc];
    assigned.add(inc.id);

    for (const candidate of validIncidents) {
      if (assigned.has(candidate.id)) continue;

      const dist = calculateHaversineDistanceMeters(
        inc.latitude,
        inc.longitude,
        candidate.latitude,
        candidate.longitude
      );

      if (dist <= radiusMeters) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    rawClusters.push(cluster);
  }

  // Convert clusters with >= HOTSPOT_MIN_INCIDENTS into CivicHotspots
  // (Also include single critical incidents if priorityScore >= 80)
  const hotspots: CivicHotspot[] = [];

  rawClusters.forEach((cluster, idx) => {
    if (
      cluster.length < HOTSPOT_CONFIG.HOTSPOT_MIN_INCIDENTS &&
      !(cluster[0] && cluster[0].priorityScore >= 80)
    ) {
      return;
    }

    const incidentIds = cluster.map((i) => i.id);
    const avgLat = cluster.reduce((sum, i) => sum + i.latitude, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, i) => sum + i.longitude, 0) / cluster.length;

    // Connected reports
    const linkedReports = reports.filter((r) =>
      r.incidentId && incidentIds.includes(r.incidentId)
    );
    const totalReports = linkedReports.length + cluster.reduce((sum, i) => sum + (i.affectedCitizenEstimate || 1), 0);

    // Categories in cluster
    const catMap: Record<string, number> = {};
    let unresolvedCount = 0;
    let recentIncidentCount = 0;
    let totalPriority = 0;

    cluster.forEach((i) => {
      catMap[i.category] = (catMap[i.category] || 0) + 1;
      totalPriority += i.priorityScore || 50;

      const isResolved = i.status === "resolved" || i.status === "closed";
      if (!isResolved) unresolvedCount++;

      const age = nowMs - new Date(i.createdAt).getTime();
      if (age <= SEVEN_DAYS_MS) recentIncidentCount++;
    });

    const dominantCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";
    const dominantRatio = catMap[dominantCategory] / cluster.length;

    // Trend detection
    const recentRatio = recentIncidentCount / cluster.length;
    let trend: TrendDirection = "stable";
    if (recentRatio >= 0.5 && cluster.length >= 2) {
      trend = "rising";
    } else if (recentRatio <= 0.2 && unresolvedCount === 0) {
      trend = "declining";
    }

    // Hotspot Risk Score: Density + ActiveRatio + Recurrence + Severity + Trend
    const densityFactor = Math.min(1.0, cluster.length / 6);
    const activeFactor = unresolvedCount / cluster.length;
    const recurrenceFactor = dominantRatio * 0.7 + Math.min(0.3, (cluster.length - 1) * 0.1);
    const severityFactor = (totalPriority / (cluster.length * 100));
    const trendFactor = trend === "rising" ? 0.9 : trend === "stable" ? 0.5 : 0.2;

    const rawRisk = (
      0.30 * densityFactor +
      0.25 * activeFactor +
      0.20 * recurrenceFactor +
      0.15 * severityFactor +
      0.10 * trendFactor
    );

    const hotspotRiskScore = Math.min(100, Math.max(10, Math.round(rawRisk * 100)));

    // Confidence evaluation
    const sampleConfidence = Math.min(0.5, cluster.length * 0.12);
    const reportConfidence = Math.min(0.3, totalReports * 0.05);
    const confidence = Math.min(0.98, Number((0.2 + sampleConfidence + reportConfidence).toFixed(2)));

    const id = `hotspot-${cluster[0].zone?.toLowerCase().replace(/\s+/g, "-") || "cluster"}-${idx + 1}`;

    hotspots.push({
      hotspotId: id,
      id,
      latitude: Number(avgLat.toFixed(6)),
      longitude: Number(avgLng.toFixed(6)),
      radiusMeters,
      incidentCount: cluster.length,
      reportCount: totalReports,
      unresolvedCount,
      activeIncidentCount: unresolvedCount,
      dominantCategory,
      dominantCategories: [dominantCategory],
      recurrenceRate: Number(dominantRatio.toFixed(2)),
      trend,
      riskLevel: hotspotRiskScore >= 75 ? "critical" : hotspotRiskScore >= 50 ? "high" : hotspotRiskScore >= 25 ? "moderate" : "low",
      hotspotRiskScore,
      score: hotspotRiskScore,
      riskScore: Number((hotspotRiskScore / 100).toFixed(2)),
      confidence,
      relatedIncidentIds: incidentIds,
      explanation: `${cluster.length} incidents (${unresolvedCount} active) clustered within ${radiusMeters}m. Dominant category: ${dominantCategory} (${Math.round(dominantRatio * 100)}%). Trend: ${trend.toUpperCase()}.`,
    });
  });

  return hotspots.sort((a, b) => b.hotspotRiskScore - a.hotspotRiskScore);
}
