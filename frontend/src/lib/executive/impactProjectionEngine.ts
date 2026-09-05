/**
 * CivicPulse Phase 8 — Impact Projection Engine
 * Deterministic operational scenario modeling comparing "Current Trajectory" vs "Intervention Scenario".
 * STRICT HONEST AI RULE: Clearly labeled as operational scenario models; never claims future prophecy.
 */

import { Incident } from "@/types";
import { ImpactProjectionResult, ScenarioPoint } from "./executiveTypes";
import { mapCategoryToDepartment } from "./departmentPerformanceEngine";

export const PROJECTION_DISCLAIMER =
  "Operational scenario projection derived deterministically from recent incident velocity and historical resolution throughput. Not a predictive guarantee.";

/**
 * Calculates deterministic 48-hour counterfactual trajectories for an operational department
 */
export function projectOperationalTrajectory(
  department: string,
  incidents: Incident[]
): ImpactProjectionResult {
  const deptIncidents = incidents.filter(
    (inc) => mapCategoryToDepartment(inc.category) === department
  );

  const totalCount = deptIncidents.length;

  // 1. INSUFFICIENT DATA GUARD
  if (totalCount < 3) {
    return {
      department,
      currentBacklog: deptIncidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
      status: "INSUFFICIENT_DATA",
      confidence: 0.0,
      historicalDaysAnalyzed: 0,
      disclaimer: PROJECTION_DISCLAIMER,
      currentTrajectory: {
        scenarioName: "CURRENT_TRAJECTORY",
        description: "Insufficient historical record volume to construct reliable 48h trajectory.",
        points: [],
        backlog48h: 0,
        slaRisk48h: 0,
      },
      interventionScenario: {
        scenarioName: "INTERVENTION_SCENARIO",
        description: "Insufficient data to model intervention throughput delta.",
        points: [],
        backlog48h: 0,
        slaRisk48h: 0,
        assumedCapacityBoost: "+0%",
      },
    };
  }

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  let activeBacklog = 0;
  let resolvedCount = 0;
  let arrivalRate24h = 0;
  let throughputRate24h = 0;
  let currentSLABreaches = 0;

  let earliestTime = now;

  deptIncidents.forEach((inc) => {
    const createdMs = new Date(inc.createdAt).getTime();
    const updatedMs = new Date(inc.updatedAt).getTime();
    if (createdMs < earliestTime) earliestTime = createdMs;

    const isResolved = inc.status === "resolved" || inc.status === "closed";

    if (now - createdMs <= ONE_DAY_MS) {
      arrivalRate24h++;
    }

    if (isResolved) {
      resolvedCount++;
      if (now - updatedMs <= ONE_DAY_MS) {
        throughputRate24h++;
      }
    } else {
      activeBacklog++;
      // If unresolved and open for > 48h, count as existing SLA risk
      if (now - createdMs > 48 * 60 * 60 * 1000) {
        currentSLABreaches++;
      }
    }
  });

  const historicalDays = Math.max(1, Math.round((now - earliestTime) / ONE_DAY_MS));

  // Minimum baseline fallback rates to avoid divide-by-zero or static freezes
  const effectiveArrival = Math.max(arrivalRate24h, 1.5);
  const effectiveThroughput = Math.max(throughputRate24h, 1.0);

  // Confidence Calculation
  const confidence = Number(
    Math.min(0.95, 0.40 + 0.10 * Math.min(6, historicalDays)).toFixed(2)
  );

  // 2. Scenario 1: Current Trajectory (Without Intervention)
  // Backlog_48h = CurrentBacklog + 2 * (Arrival - Throughput)
  const netDrift24h = effectiveArrival - effectiveThroughput;
  const rawBacklog48h = Math.round(activeBacklog + 2 * netDrift24h);
  const backlog48hCurrent = Math.max(1, rawBacklog48h);
  const slaRisk48hCurrent = Math.round(currentSLABreaches + Math.max(0, netDrift24h * 1.5));

  const currentPoints: ScenarioPoint[] = [
    { hoursFromNow: 0, projectedBacklog: activeBacklog, projectedSLARisks: currentSLABreaches },
    { hoursFromNow: 12, projectedBacklog: Math.round(activeBacklog + 0.5 * netDrift24h), projectedSLARisks: currentSLABreaches },
    { hoursFromNow: 24, projectedBacklog: Math.round(activeBacklog + netDrift24h), projectedSLARisks: Math.round(currentSLABreaches + 0.7 * netDrift24h) },
    { hoursFromNow: 36, projectedBacklog: Math.round(activeBacklog + 1.5 * netDrift24h), projectedSLARisks: Math.round(currentSLABreaches + 1.1 * netDrift24h) },
    { hoursFromNow: 48, projectedBacklog: backlog48hCurrent, projectedSLARisks: slaRisk48hCurrent },
  ];

  // 3. Scenario 2: Intervention Scenario (With Capacity Boost)
  // Model assumption: +80% throughput boost from dispatched reserve capacity (1.8 * Throughput)
  const netDriftIntervention = effectiveArrival - 1.8 * effectiveThroughput;
  const rawBacklog48hIntervention = Math.round(activeBacklog + 2 * netDriftIntervention);
  const backlog48hIntervention = Math.max(0, rawBacklog48hIntervention);
  const slaRisk48hIntervention = Math.max(0, Math.round(currentSLABreaches * 0.5));

  const interventionPoints: ScenarioPoint[] = [
    { hoursFromNow: 0, projectedBacklog: activeBacklog, projectedSLARisks: currentSLABreaches },
    { hoursFromNow: 12, projectedBacklog: Math.max(0, Math.round(activeBacklog + 0.5 * netDriftIntervention)), projectedSLARisks: currentSLABreaches },
    { hoursFromNow: 24, projectedBacklog: Math.max(0, Math.round(activeBacklog + netDriftIntervention)), projectedSLARisks: Math.round(currentSLABreaches * 0.8) },
    { hoursFromNow: 36, projectedBacklog: Math.max(0, Math.round(activeBacklog + 1.5 * netDriftIntervention)), projectedSLARisks: Math.round(currentSLABreaches * 0.6) },
    { hoursFromNow: 48, projectedBacklog: backlog48hIntervention, projectedSLARisks: slaRisk48hIntervention },
  ];

  return {
    department,
    currentBacklog: activeBacklog,
    status: "AVAILABLE",
    confidence,
    historicalDaysAnalyzed: historicalDays,
    disclaimer: PROJECTION_DISCLAIMER,
    currentTrajectory: {
      scenarioName: "CURRENT_TRAJECTORY",
      description: `Without intervention, incident arrival velocity (${effectiveArrival.toFixed(1)}/day) exceeds historical throughput (${effectiveThroughput.toFixed(1)}/day), expanding active backlog from ${activeBacklog} to ${backlog48hCurrent}.`,
      points: currentPoints,
      backlog48h: backlog48hCurrent,
      slaRisk48h: slaRisk48hCurrent,
    },
    interventionScenario: {
      scenarioName: "INTERVENTION_SCENARIO",
      description: `With approved reserve capacity rebalance, daily throughput rises to ${(1.8 * effectiveThroughput).toFixed(1)}/day, contracting backlog from ${activeBacklog} down to ${backlog48hIntervention}.`,
      points: interventionPoints,
      backlog48h: backlog48hIntervention,
      slaRisk48h: slaRisk48hIntervention,
      assumedCapacityBoost: "+80% Throughput via Reserve Squad",
    },
  };
}

/**
 * Generates impact projections across all active municipal departments
 */
export function generateAllImpactProjections(incidents: Incident[]): ImpactProjectionResult[] {
  const departments = [
    "Public Works / Road Infrastructure",
    "Water Supply & Sewerage",
    "Public Health & Solid Waste",
    "Electrical & Energy",
    "Disaster Management & Emergency Response",
  ];

  return departments.map((d) => projectOperationalTrajectory(d, incidents));
}
