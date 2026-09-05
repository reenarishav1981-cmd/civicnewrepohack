/**
 * CivicPulse Geospatial Hotspot Detection Module
 * Identifies spatial incident clusters with high density, recurring failures, and emerging risks.
 */

import { Incident } from "@/types";
import { calculateHaversineDistance } from "../ai/geo";
import { CivicHotspot, RiskLevel, TrendDirection } from "./predictiveTypes";
import { evaluateConfidence } from "./confidenceEngine";

export interface HotspotDetectionConfig {
  clusterRadiusMeters?: number; // default 500m
  recentWindowDays?: number; // default 7 days
  baselineWindowDays?: number; // default 30 days
  minIncidentsForHotspot?: number; // default 2
}

const DEFAULT_CONFIG: Required<HotspotDetectionConfig> = {
  clusterRadiusMeters: 500,
  recentWindowDays: 7,
  baselineWindowDays: 30,
  minIncidentsForHotspot: 2,
};

export function detectCivicHotspots(
  incidents: Incident[],
  config: HotspotDetectionConfig = {}
): CivicHotspot[] {
  if (!incidents || incidents.length === 0) {
    return [];
  }

  const { clusterRadiusMeters, recentWindowDays, baselineWindowDays, minIncidentsForHotspot } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const now = Date.now();
  const recentCutoff = now - recentWindowDays * 24 * 60 * 60 * 1000;
  const baselineCutoff = now - baselineWindowDays * 24 * 60 * 60 * 1000;

  // 1. Spatial Clustering (Greedy centroid agglomeration within radiusMeters)
  const clusters: Array<{
    centerLat: number;
    centerLng: number;
    incidentIds: string[];
    incidents: Incident[];
  }> = [];

  for (const inc of incidents) {
    if (typeof inc.latitude !== "number" || typeof inc.longitude !== "number") continue;

    let assignedCluster = clusters.find(c => {
      const dist = calculateHaversineDistance(c.centerLat, c.centerLng, inc.latitude, inc.longitude);
      return dist <= clusterRadiusMeters;
    });

    if (assignedCluster) {
      assignedCluster.incidents.push(inc);
      assignedCluster.incidentIds.push(inc.id);
      // Recalculate center centroid
      assignedCluster.centerLat =
        assignedCluster.incidents.reduce((s, i) => s + i.latitude, 0) / assignedCluster.incidents.length;
      assignedCluster.centerLng =
        assignedCluster.incidents.reduce((s, i) => s + i.longitude, 0) / assignedCluster.incidents.length;
    } else {
      clusters.push({
        centerLat: inc.latitude,
        centerLng: inc.longitude,
        incidentIds: [inc.id],
        incidents: [inc],
      });
    }
  }

  // Filter clusters meeting threshold
  const qualifyingClusters = clusters.filter(
    c => c.incidents.length >= minIncidentsForHotspot || c.incidents.some(i => i.priorityScore >= 80)
  );

  const hotspots: CivicHotspot[] = qualifyingClusters.map((cluster, idx) => {
    const total = cluster.incidents.length;
    const active = cluster.incidents.filter(i => i.status !== "resolved" && i.status !== "closed").length;

    // A. Density Score (Max 1.0, saturated at 6 incidents)
    const densityScore = Math.min(1.0, total / 6);

    // B. Active Incident Ratio
    const activeIncidentRatio = total > 0 ? active / total : 0;

    // C. Category Dominance & Recurrence Score
    const catCounts: Record<string, number> = {};
    for (const inc of cluster.incidents) {
      catCounts[inc.category] = (catCounts[inc.category] || 0) + 1;
    }
    const dominantCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    const topCategoryCount = catCounts[dominantCategories[0]] || 1;
    const recurrenceScore = Math.min(1.0, (topCategoryCount / total) * 0.7 + Math.min(0.3, (total - 1) * 0.1));

    // D. Severity Score
    const avgSeverity =
      cluster.incidents.reduce((s, i) => s + (i.priorityScore || 50), 0) / (total * 100);
    const severityScore = Math.min(1.0, Math.max(0.1, avgSeverity));

    // E. Temporal Trend (Recent vs Baseline)
    const recentCount = cluster.incidents.filter(i => new Date(i.createdAt).getTime() >= recentCutoff).length;
    const baselineCount = cluster.incidents.filter(
      i => new Date(i.createdAt).getTime() >= baselineCutoff && new Date(i.createdAt).getTime() < recentCutoff
    ).length;

    // Baseline normalized to 7 days
    const normalizedBaseline = (baselineCount / Math.max(1, baselineWindowDays - recentWindowDays)) * recentWindowDays;
    let trend: TrendDirection = "stable";
    let growthRate = 0;

    if (normalizedBaseline > 0) {
      growthRate = (recentCount - normalizedBaseline) / normalizedBaseline;
    } else if (recentCount >= 2) {
      growthRate = 1.0;
    }

    if (growthRate >= 0.30 && recentCount >= 2) {
      trend = "emerging";
    } else if (growthRate <= -0.30 && total >= 3) {
      trend = "declining";
    }

    const recentGrowthFactor = trend === "emerging" ? 0.9 : (trend === "stable" ? 0.5 : 0.2);

    // F. Composite Hotspot Risk Score
    // 0.30 * Density + 0.25 * ActiveRatio + 0.20 * Recurrence + 0.15 * Severity + 0.10 * RecentGrowth
    const riskScore = Math.min(
      1.0,
      Math.max(
        0.1,
        0.30 * densityScore +
        0.25 * activeIncidentRatio +
        0.20 * recurrenceScore +
        0.15 * severityScore +
        0.10 * recentGrowthFactor
      )
    );

    const normalizedRiskScore = Math.round(riskScore * 100) / 100;

    // G. Risk Level Classification
    let riskLevel: RiskLevel = "low";
    if (normalizedRiskScore >= 0.75) {
      riskLevel = "critical";
    } else if (normalizedRiskScore >= 0.55) {
      riskLevel = "high";
    } else if (normalizedRiskScore >= 0.35) {
      riskLevel = "moderate";
    }

    // H. Contributing Factors
    const contributingFactors = [
      {
        factor: "Incident Density",
        contribution: Math.round(densityScore * 30),
        explanation: `${total} incidents clustered within a ${clusterRadiusMeters}m radius.`
      },
      {
        factor: "Unresolved Ratio",
        contribution: Math.round(activeIncidentRatio * 25),
        explanation: `${active} of ${total} incidents (${Math.round(activeIncidentRatio * 100)}%) remain active in operations.`
      },
      {
        factor: "Category Concentration",
        contribution: Math.round(recurrenceScore * 20),
        explanation: `Dominant concentration of ${dominantCategories[0]} (${topCategoryCount} cases).`
      },
      {
        factor: "Hazard Severity",
        contribution: Math.round(severityScore * 15),
        explanation: `Average cluster hazard severity evaluated at ${Math.round(severityScore * 100)}/100.`
      },
      {
        factor: "Temporal Trajectory",
        contribution: Math.round(recentGrowthFactor * 10),
        explanation: trend === "emerging"
          ? `Accelerating signal volume (+${Math.round(growthRate * 100)}% during past ${recentWindowDays} days).`
          : (trend === "declining" ? "Signal volume is declining compared to historical baseline." : "Signal volume is holding steady.")
      }
    ];

    // Recommended Action
    let recommendedAction = "MONITOR";
    if (riskLevel === "critical") {
      recommendedAction = "EXECUTE COMPREHENSIVE AREA AUDIT & PRIORITY REPAIRS";
    } else if (riskLevel === "high") {
      recommendedAction = "DISPATCH MULTI-DISCIPLINARY FIELD INSPECTION";
    } else if (riskLevel === "moderate") {
      recommendedAction = "COORDINATE SCHEDULED MAINTENANCE SQUAD";
    }

    // Zone description
    const zoneName = cluster.incidents[0].zone || `Cluster Sector ${idx + 1}`;
    const explanation = `Zone '${zoneName}' is classified as ${riskLevel.toUpperCase()} RISK (Score: ${Math.round(normalizedRiskScore * 100)}/100): ${total} incidents recorded, ${Math.round(activeIncidentRatio * 100)}% active, with ${trend} signal growth.`;

    const conf = evaluateConfidence({
      evidenceCount: total,
      signalAgreement: topCategoryCount / total,
      hasPhotos: cluster.incidents.some(i => !!i.beforeEvidenceUrl)
    });

    return {
      id: `HOTSPOT-${idx + 1}-${Math.round(cluster.centerLat * 1000) % 10000}`,
      center: {
        latitude: Math.round(cluster.centerLat * 10000) / 10000,
        longitude: Math.round(cluster.centerLng * 10000) / 10000,
      },
      radiusMeters: clusterRadiusMeters,
      incidentCount: total,
      activeIncidentCount: active,
      recurrenceScore: Math.round(recurrenceScore * 100) / 100,
      severityScore: Math.round(severityScore * 100) / 100,
      densityScore: Math.round(densityScore * 100) / 100,
      riskScore: normalizedRiskScore,
      trend,
      dominantCategories,
      riskLevel,
      explanation,
      confidence: conf.score,
      contributingFactors,
      recommendedAction,
      incidentIds: cluster.incidentIds,
    };
  });

  // Sort descending by highest risk score
  return hotspots.sort((a, b) => b.riskScore - a.riskScore);
}
