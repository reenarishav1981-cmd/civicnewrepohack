/**
 * CivicPulse Trend Analysis Engine
 * Compares current observation windows against historical baseline periods to identify emerging civic trends.
 */

import { Incident } from "@/types";
import { CivicTrend } from "./predictiveTypes";

export interface TrendAnalysisConfig {
  recentDays?: number; // default 7 days
  baselineDays?: number; // default 30 days
}

export function analyzeCivicTrends(
  incidents: Incident[],
  config: TrendAnalysisConfig = {}
): CivicTrend[] {
  if (!incidents || incidents.length === 0) {
    return [];
  }

  const recentDays = config.recentDays || 7;
  const baselineDays = config.baselineDays || 30;

  const now = Date.now();
  const recentCutoff = now - recentDays * 24 * 60 * 60 * 1000;
  const baselineCutoff = now - baselineDays * 24 * 60 * 60 * 1000;

  // Group by category
  const categoryStats: Record<string, { recent: number; baseline: number }> = {};

  for (const inc of incidents) {
    const time = new Date(inc.createdAt).getTime();
    if (!categoryStats[inc.category]) {
      categoryStats[inc.category] = { recent: 0, baseline: 0 };
    }

    if (time >= recentCutoff) {
      categoryStats[inc.category].recent++;
    } else if (time >= baselineCutoff) {
      categoryStats[inc.category].baseline++;
    }
  }

  const trends: CivicTrend[] = [];
  const baselineNormalizationFactor = recentDays / Math.max(1, baselineDays - recentDays);

  for (const [category, counts] of Object.entries(categoryStats)) {
    const normalizedBaseline = Math.round(counts.baseline * baselineNormalizationFactor * 10) / 10;
    let changePercentage = 0;

    if (normalizedBaseline > 0) {
      changePercentage = Math.round(((counts.recent - normalizedBaseline) / normalizedBaseline) * 100);
    } else if (counts.recent > 0) {
      changePercentage = counts.recent * 100;
    }

    let direction: "increasing" | "stable" | "decreasing" = "stable";
    if (changePercentage >= 20 && counts.recent >= 2) {
      direction = "increasing";
    } else if (changePercentage <= -20 && counts.baseline >= 2) {
      direction = "decreasing";
    }

    // Confidence scales with sample volume
    const totalSamples = counts.recent + counts.baseline;
    const confidence = Math.min(0.95, Math.max(0.40, 0.40 + totalSamples * 0.05));

    trends.push({
      category,
      currentCount: counts.recent,
      baselineCount: normalizedBaseline,
      changePercentage,
      direction,
      confidence: Math.round(confidence * 100) / 100
    });
  }

  // Sort by highest change percentage descending
  return trends.sort((a, b) => b.changePercentage - a.changePercentage);
}
