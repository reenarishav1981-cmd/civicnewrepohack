/**
 * CivicPulse Phase 6 — Recurrence & Chronic Infrastructure Failure Engine
 * Identifies persistent infrastructure defects where resolution efforts repeatedly recur.
 */

import { Incident } from "@/types";
import { RecurrenceAnalysis, ChronicFailureTier } from "./predictiveTypes";
import { calculateHaversineDistanceMeters } from "./hotspotEngine";

export const RECURRENCE_THRESHOLDS = {
  SITE_PROXIMITY_METERS: 350,
  TIER_LOW: 1,
  TIER_MODERATE: 3,
  TIER_HIGH: 5,
};

export function classifyFailureTier(repeatedCount: number): ChronicFailureTier {
  if (repeatedCount >= 6) return "CHRONIC";
  if (repeatedCount >= 4) return "HIGH";
  if (repeatedCount >= 2) return "MODERATE";
  return "LOW";
}

export function detectRecurrencePatterns(
  incidents: Incident[],
  proximityMeters: number = RECURRENCE_THRESHOLDS.SITE_PROXIMITY_METERS
): RecurrenceAnalysis[] {
  if (incidents.length === 0) return [];

  // Group by category and proximity
  const clusters: Incident[][] = [];
  const assigned = new Set<string>();

  for (const inc of incidents) {
    if (assigned.has(inc.id)) continue;

    const cluster: Incident[] = [inc];
    assigned.add(inc.id);

    for (const candidate of incidents) {
      if (assigned.has(candidate.id)) continue;

      // Must be same or compatible category
      const sameCat = inc.category.toLowerCase() === candidate.category.toLowerCase();
      if (!sameCat) continue;

      const dist = calculateHaversineDistanceMeters(
        inc.latitude,
        inc.longitude,
        candidate.latitude,
        candidate.longitude
      );

      if (dist <= proximityMeters) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    if (cluster.length >= 1) {
      clusters.push(cluster);
    }
  }

  // Convert clusters into RecurrenceAnalysis records
  const analyses: RecurrenceAnalysis[] = clusters.map((cluster, idx) => {
    const historicalIncidentCount = cluster.length;
    const repeatedIncidentCount = Math.max(0, historicalIncidentCount - 1);
    const relatedIncidentIds = cluster.map((i) => i.id);

    let reopenedCount = 0;
    cluster.forEach((i) => {
      if (i.reopenedAt || i.reopenedReason) reopenedCount++;
    });

    // Score: 0 to 100
    // Factors: repeated count (max 8) + reopen penalty
    const baseRepetitionScore = Math.min(75, repeatedIncidentCount * 15);
    const reopenBonus = Math.min(25, reopenedCount * 12);
    const recurrenceScore = Math.min(100, baseRepetitionScore + reopenBonus);

    const failureTier = classifyFailureTier(repeatedIncidentCount + (reopenedCount > 0 ? 1 : 0));
    const classification = failureTier.toLowerCase() as "low" | "moderate" | "high" | "chronic";

    const clusterLocationName = cluster[0].address || cluster[0].zone || `Zone-${idx + 1}`;
    const dominantCategory = cluster[0].category;

    const explanation = failureTier === "CHRONIC"
      ? `Critical chronic failure: ${historicalIncidentCount} recurring ${dominantCategory} incidents documented at ${clusterLocationName} (${reopenedCount} reopened post-resolution). Requires root-cause infrastructure overhaul.`
      : failureTier === "HIGH"
      ? `High recurrence alert: ${historicalIncidentCount} repeated ${dominantCategory} issues at ${clusterLocationName}. Prior repairs failed to contain subsequent deterioration.`
      : failureTier === "MODERATE"
      ? `Moderate recurrence: ${historicalIncidentCount} occurrences observed within ${proximityMeters}m.`
      : `Low recurrence: Isolated incident record at ${clusterLocationName}.`;

    return {
      locationClusterId: `rec-${cluster[0].zone?.toLowerCase().replace(/\s+/g, "-") || "loc"}-${idx + 1}`,
      historicalIncidentCount,
      repeatedIncidentCount,
      recurrenceCount: repeatedIncidentCount,
      recurrenceRate: Number((repeatedIncidentCount / Math.max(1, historicalIncidentCount)).toFixed(2)),
      recurrenceScore,
      failureTier,
      classification,
      relatedIncidentIds,
      reopenedCount,
      explanation,
    };
  });

  return analyses.sort((a, b) => b.recurrenceScore - a.recurrenceScore);
}
