/**
 * CivicPulse Phase 6 — Pattern Analysis Engine
 * Analyzes historical incident activity, reporting velocity, and resolution reliability.
 * Deterministic and grounded in real database timestamps.
 */

import { Incident, CitizenReport } from "@/types";
import { PatternIntelligence, VelocityTrend } from "./predictiveTypes";

export function analyzeIncidentPatterns(
  incidents: Incident[],
  reports: CitizenReport[] = [],
  zoneId?: string,
  nowDate: Date = new Date()
): PatternIntelligence {
  const filteredIncidents = zoneId
    ? incidents.filter((i) => i.zone?.toLowerCase() === zoneId.toLowerCase())
    : incidents;

  const nowMs = nowDate.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

  // 1. Incident Frequency
  let frequency24h = 0;
  let frequency7d = 0;
  let frequency30d = 0;

  let resolvedCount = 0;
  let reopenedCount = 0;
  let unresolvedCount = 0;
  let totalResolutionTimeHours = 0;
  let resolvedWithTimeCount = 0;

  const categoryCounts: Record<string, number> = {};

  filteredIncidents.forEach((inc) => {
    const createdMs = new Date(inc.createdAt).getTime();
    const ageMs = Math.max(0, nowMs - createdMs);

    if (ageMs <= ONE_DAY_MS) frequency24h++;
    if (ageMs <= SEVEN_DAYS_MS) frequency7d++;
    if (ageMs <= THIRTY_DAYS_MS) frequency30d++;

    // Category concentration
    const cat = inc.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Resolution metrics
    const isResolved = inc.status === "resolved" || inc.status === "closed";
    const isReopened = !!inc.reopenedAt || !!inc.reopenedReason;

    if (isReopened) reopenedCount++;
    if (isResolved) {
      resolvedCount++;
      if (inc.updatedAt) {
        const updatedMs = new Date(inc.updatedAt).getTime();
        const diffHours = (updatedMs - createdMs) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours < 720) {
          totalResolutionTimeHours += diffHours;
          resolvedWithTimeCount++;
        }
      }
    } else {
      unresolvedCount++;
    }
  });

  // 2. Report Velocity (Compare last 24h reports vs historical daily baseline)
  const filteredReports = zoneId && filteredIncidents.length > 0
    ? reports.filter((r) => {
        const linked = filteredIncidents.some((i) => i.id === r.incidentId);
        return linked;
      })
    : reports;

  let reports24h = 0;
  let reports30d = 0;

  filteredReports.forEach((r) => {
    const rTime = new Date(r.createdAt).getTime();
    const age = Math.max(0, nowMs - rTime);
    if (age <= ONE_DAY_MS) reports24h++;
    if (age <= THIRTY_DAYS_MS) reports30d++;
  });

  // Daily baseline over 30 days (default to minimum 1 for ratio division)
  const baselineDailyReports = reports30d > 0
    ? Math.max(0.5, reports30d / 30)
    : Math.max(0.5, filteredReports.length / 14);

  const reportVelocity = reports24h;
  const velocityChangePercent = filteredReports.length === 0
    ? 0
    : Math.round(((reportVelocity - baselineDailyReports) / baselineDailyReports) * 100);

  let velocityTrend: VelocityTrend = "stable";
  if (filteredReports.length > 0) {
    if (velocityChangePercent >= 25) {
      velocityTrend = "increasing";
    } else if (velocityChangePercent <= -25) {
      velocityTrend = "decreasing";
    }
  }

  // 3. Category Concentration Breakdown
  const totalIncidents = filteredIncidents.length;
  const categoryConcentration = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const dominantCategory = categoryConcentration[0]?.category || "General";

  // 4. Resolution Failure Rate & Recurrence Rate
  const resolutionFailureRate = totalIncidents > 0
    ? Number((reopenedCount / Math.max(1, resolvedCount + reopenedCount)).toFixed(3))
    : 0;

  // Recurrence rate proxy: percentage of category concentration beyond single occurrence
  const repeatedIncidentCount = categoryConcentration.reduce(
    (acc, c) => (c.count > 1 ? acc + (c.count - 1) : acc),
    0
  );
  const recurrenceRate = totalIncidents > 0
    ? Number((repeatedIncidentCount / totalIncidents).toFixed(3))
    : 0;

  const avgResolutionTimeHours = resolvedWithTimeCount > 0
    ? Number((totalResolutionTimeHours / resolvedWithTimeCount).toFixed(1))
    : 24.0;

  // Sample-based confidence
  const trendConfidence = Math.min(
    1.0,
    Number((Math.min(10, totalIncidents) / 10 * 0.7 + (filteredReports.length > 5 ? 0.3 : 0.1)).toFixed(2))
  );

  return {
    zoneId,
    incidentCount: totalIncidents,
    reportCount: filteredReports.length,
    frequency24h,
    frequency7d,
    frequency30d,
    reportVelocity,
    velocityTrend,
    velocityChangePercent,
    dominantCategory,
    categoryConcentration,
    resolvedCount,
    reopenedCount,
    unresolvedCount,
    recurrenceRate,
    resolutionFailureRate,
    avgResolutionTimeHours,
    trendConfidence,
  };
}
