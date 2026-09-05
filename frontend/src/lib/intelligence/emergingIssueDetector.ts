/**
 * CivicPulse Phase 6 — Emerging Issue Detector
 * Detects abnormal surges in civic issues by comparing 7-day velocity against 30-day baselines.
 * Includes strict false-positive protection (N >= 3 and >= 50% increase required).
 */

import { Incident, CitizenReport } from "@/types";
import { EmergingIssue, EmergingSeverity } from "./predictiveTypes";

export const EMERGING_ISSUE_THRESHOLDS = {
  MIN_RECENT_REPORTS_FOR_ALERT: 3,
  MIN_INCREASE_PERCENT: 50,
  CRITICAL_INCREASE_PERCENT: 150,
  ESCALATING_INCREASE_PERCENT: 80,
};

export function detectEmergingIssues(
  incidents: Incident[],
  reports: CitizenReport[] = [],
  nowDate: Date = new Date()
): EmergingIssue[] {
  const nowMs = nowDate.getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Group by category
  interface CategoryWindowStats {
    category: string;
    recent7dCount: number;
    prior23dCount: number;
    total30dCount: number;
    zoneDistribution: Record<string, number>;
  }

  const catMap: Record<string, CategoryWindowStats> = {};

  // Incorporate incident counts
  incidents.forEach((inc) => {
    const age = nowMs - new Date(inc.createdAt).getTime();
    if (age > THIRTY_DAYS_MS) return;

    const cat = inc.category || "General";
    if (!catMap[cat]) {
      catMap[cat] = {
        category: cat,
        recent7dCount: 0,
        prior23dCount: 0,
        total30dCount: 0,
        zoneDistribution: {},
      };
    }

    catMap[cat].total30dCount++;
    if (age <= SEVEN_DAYS_MS) {
      catMap[cat].recent7dCount++;
    } else {
      catMap[cat].prior23dCount++;
    }

    const zone = inc.zone || "Central";
    catMap[cat].zoneDistribution[zone] = (catMap[cat].zoneDistribution[zone] || 0) + 1;
  });

  // Also count reports if provided
  reports.forEach((rep) => {
    const age = nowMs - new Date(rep.createdAt).getTime();
    if (age > THIRTY_DAYS_MS) return;

    const cat = rep.category || "General";
    if (!catMap[cat]) {
      catMap[cat] = {
        category: cat,
        recent7dCount: 0,
        prior23dCount: 0,
        total30dCount: 0,
        zoneDistribution: {},
      };
    }

    catMap[cat].total30dCount++;
    if (age <= SEVEN_DAYS_MS) {
      catMap[cat].recent7dCount++;
    } else {
      catMap[cat].prior23dCount++;
    }
  });

  const emergingIssues: EmergingIssue[] = [];

  Object.values(catMap).forEach((stat) => {
    // Baseline weekly volume: normalized from prior period or 30d total
    // Prior 23 days normalized to 7 days = prior23dCount * (7 / 23)
    const baselineVolume = Number(
      Math.max(1.0, (stat.prior23dCount / 23) * 7).toFixed(1)
    );
    const recentVolume = stat.recent7dCount;

    const increasePercent = Math.round(
      ((recentVolume - baselineVolume) / baselineVolume) * 100
    );

    // Find dominant zone
    const dominantZone = Object.entries(stat.zoneDistribution).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "Citywide";

    // False-positive suppression rule:
    // If recent reports < 3, suppress alert to WATCH state to avoid alert fatigue from isolated reports
    let severity: EmergingSeverity = "watch";
    let confidence = 0.35;

    if (
      recentVolume >= EMERGING_ISSUE_THRESHOLDS.MIN_RECENT_REPORTS_FOR_ALERT &&
      increasePercent >= EMERGING_ISSUE_THRESHOLDS.MIN_INCREASE_PERCENT
    ) {
      if (increasePercent >= EMERGING_ISSUE_THRESHOLDS.CRITICAL_INCREASE_PERCENT) {
        severity = "critical";
        confidence = 0.92;
      } else if (increasePercent >= EMERGING_ISSUE_THRESHOLDS.ESCALATING_INCREASE_PERCENT) {
        severity = "escalating";
        confidence = 0.82;
      } else {
        severity = "emerging";
        confidence = 0.72;
      }
    } else if (recentVolume < EMERGING_ISSUE_THRESHOLDS.MIN_RECENT_REPORTS_FOR_ALERT) {
      severity = "watch";
      confidence = Math.min(0.45, Number((recentVolume * 0.15).toFixed(2)));
    } else if (increasePercent <= 0) {
      severity = "watch";
      confidence = 0.5;
    }

    let explanation = "";
    if (severity === "critical") {
      explanation = `CRITICAL SURGE: ${stat.category} reports spiked by +${increasePercent}% in the last 7 days (${recentVolume} vs ${baselineVolume} baseline). Concentrated in ${dominantZone}. Immediate municipal deployment recommended.`;
    } else if (severity === "escalating") {
      explanation = `ESCALATING ALERT: ${stat.category} reports surged +${increasePercent}% over baseline in ${dominantZone}. Early containment intervention required.`;
    } else if (severity === "emerging") {
      explanation = `EMERGING ANOMALY: ${stat.category} activity increased +${increasePercent}% (${recentVolume} recent reports). Active monitoring initiated.`;
    } else {
      explanation = `WATCH STATE: ${stat.category} reporting volume (${recentVolume} reports) is within normal baseline thresholds or lacks sample depth (minimum 3 signals required for critical alert).`;
    }

    emergingIssues.push({
      category: stat.category,
      zoneId: dominantZone,
      locationCluster: dominantZone,
      baselineFrequency: baselineVolume,
      baselineVolume,
      recentFrequency: recentVolume,
      recentVolume,
      increasePercent,
      severity,
      confidence,
      explanation,
    });
  });

  // Sort: critical first, then escalating, emerging, watch
  const severityRank: Record<EmergingSeverity, number> = {
    critical: 4,
    escalating: 3,
    emerging: 2,
    watch: 1,
  };

  return emergingIssues.sort(
    (a, b) =>
      severityRank[b.severity] - severityRank[a.severity] ||
      b.increasePercent - a.increasePercent
  );
}
