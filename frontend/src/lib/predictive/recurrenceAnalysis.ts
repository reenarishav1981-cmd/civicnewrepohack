/**
 * CivicPulse Recurrence Pattern Analysis Module
 * Detects chronic infrastructure failures and recurring civic distress across physical sites.
 */

import { Incident } from "@/types";
import { calculateHaversineDistance } from "../ai/geo";
import { RecurrencePattern, RecurrencePersistence } from "./predictiveTypes";

export interface RecurrenceConfig {
  proximityThresholdMeters?: number; // default 300m
  minOccurrencesForPattern?: number; // default 2
}

const DEFAULT_CONFIG: Required<RecurrenceConfig> = {
  proximityThresholdMeters: 300,
  minOccurrencesForPattern: 2,
};

export function analyzeRecurrencePatterns(
  incidents: Incident[],
  config: RecurrenceConfig = {}
): RecurrencePattern[] {
  if (!incidents || incidents.length < 2) {
    return [];
  }

  const { proximityThresholdMeters, minOccurrencesForPattern } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Group incidents by spatial proximity and compatible category
  const groups: Array<{
    category: string;
    centerLat: number;
    centerLng: number;
    address?: string;
    incidents: Incident[];
  }> = [];

  for (const inc of incidents) {
    if (typeof inc.latitude !== "number" || typeof inc.longitude !== "number") continue;

    let matchedGroup = groups.find(g => {
      const isCategoryMatch =
        g.category.toLowerCase() === inc.category.toLowerCase() ||
        (g.category.includes("Road") && inc.category.includes("Road")) ||
        (g.category.includes("Water") && inc.category.includes("Water")) ||
        (g.category.includes("Drainage") && inc.category.includes("Drainage"));

      if (!isCategoryMatch) return false;
      const dist = calculateHaversineDistance(g.centerLat, g.centerLng, inc.latitude, inc.longitude);
      return dist <= proximityThresholdMeters;
    });

    if (matchedGroup) {
      matchedGroup.incidents.push(inc);
      // Recalculate centroid
      matchedGroup.centerLat =
        matchedGroup.incidents.reduce((s, i) => s + i.latitude, 0) / matchedGroup.incidents.length;
      matchedGroup.centerLng =
        matchedGroup.incidents.reduce((s, i) => s + i.longitude, 0) / matchedGroup.incidents.length;
      if (!matchedGroup.address && inc.address) {
        matchedGroup.address = inc.address;
      }
    } else {
      groups.push({
        category: inc.category,
        centerLat: inc.latitude,
        centerLng: inc.longitude,
        address: inc.address,
        incidents: [inc],
      });
    }
  }

  // Filter for repeated occurrences
  const patterns: RecurrencePattern[] = [];

  for (const group of groups) {
    if (group.incidents.length < minOccurrencesForPattern) continue;

    // Sort chronologically ascending
    const sorted = [...group.incidents].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const count = sorted.length;
    const firstDate = new Date(sorted[0].createdAt);
    const lastDate = new Date(sorted[count - 1].createdAt);
    const totalSpanDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageIntervalDays = Math.round((totalSpanDays / Math.max(1, count - 1)) * 10) / 10;

    // Classification of persistence
    let suspectedPersistence: RecurrencePersistence = "temporary";
    if (count >= 5) {
      suspectedPersistence = "chronic";
    } else if (count >= 3) {
      suspectedPersistence = "recurring";
    }

    // Recurrence Score (0.0 to 1.0)
    // Considers count (up to 6 incidents) and compactness of recurrence intervals
    const countScore = Math.min(0.6, (count / 6) * 0.6);
    const intervalCompactness = averageIntervalDays <= 7 ? 0.4 : (averageIntervalDays <= 21 ? 0.25 : 0.15);
    const recurrenceScore = Math.min(1.0, Math.round((countScore + intervalCompactness) * 100) / 100);

    // Trend Direction: Check if intervals between consecutive incidents are getting shorter
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (count >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < count; i++) {
        const d1 = new Date(sorted[i - 1].createdAt).getTime();
        const d2 = new Date(sorted[i].createdAt).getTime();
        intervals.push(Math.max(0.1, (d2 - d1) / (1000 * 60 * 60 * 24)));
      }
      const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
      const secondHalf = intervals.slice(Math.floor(intervals.length / 2));
      const avg1 = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

      if (avg2 < avg1 * 0.75) {
        trend = "increasing"; // Shorter intervals -> recurrence accelerating
      } else if (avg2 > avg1 * 1.35) {
        trend = "decreasing";
      }
    }

    const locDesc = group.address || `Coordinates (${group.centerLat.toFixed(4)}, ${group.centerLng.toFixed(4)})`;
    let explanation = `${count} repeated ${group.category} incidents observed near ${locDesc} over ${Math.round(totalSpanDays)} days (Average interval: ${averageIntervalDays} days). Classified as ${suspectedPersistence.toUpperCase()} failure.`;
    if (suspectedPersistence === "chronic") {
      explanation += ` Chronic failure pattern indicates that standard surface repair is insufficient; foundational engineering audit recommended.`;
    }

    patterns.push({
      id: `REC-${group.category.substring(0, 3).toUpperCase()}-${Math.round(group.centerLat * 1000) % 1000}`,
      category: group.category,
      location: {
        latitude: Math.round(group.centerLat * 10000) / 10000,
        longitude: Math.round(group.centerLng * 10000) / 10000,
        address: group.address,
      },
      occurrenceCount: count,
      firstObservedAt: firstDate.toISOString(),
      lastObservedAt: lastDate.toISOString(),
      averageIntervalDays,
      recurrenceScore,
      trend,
      suspectedPersistence,
      explanation,
      relatedIncidentIds: sorted.map(i => i.id),
    });
  }

  // Sort descending by highest recurrence score
  return patterns.sort((a, b) => b.recurrenceScore - a.recurrenceScore);
}
