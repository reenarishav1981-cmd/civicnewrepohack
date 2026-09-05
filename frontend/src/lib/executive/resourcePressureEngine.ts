/**
 * CivicPulse Phase 8 — Resource Pressure Engine
 * Calculates deterministic 0-100 municipal operational pressure score with exact factor attribution.
 */

import { Incident, FieldTeam } from "@/types";
import { RecurrenceAnalysis } from "../intelligence/predictiveTypes";
import { ResourcePressureResult, PressureLevel, PressureFactorItem } from "./executiveTypes";
import { getDepartmentSLAHours } from "./departmentPerformanceEngine";

export function evaluatePressureLevel(score: number): PressureLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}

/**
 * Computes deterministic operational pressure score and factor contribution breakdown
 */
export function calculateResourcePressure(
  incidents: Incident[],
  teams: FieldTeam[] = [],
  recurrence: RecurrenceAnalysis[] = []
): ResourcePressureResult {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  let activeBacklog = 0;
  let velocity24h = 0;
  let criticalCount = 0;
  let resolvedCount = 0;
  let slaBreaches = 0;

  incidents.forEach((inc) => {
    const isResolved = inc.status === "resolved" || inc.status === "closed";
    const createdMs = new Date(inc.createdAt).getTime();
    const updatedMs = new Date(inc.updatedAt).getTime();

    if (now - createdMs <= ONE_DAY_MS) {
      velocity24h++;
    }

    if (inc.priority === "critical" || (inc.priorityScore && inc.priorityScore >= 75)) {
      criticalCount++;
    }

    if (isResolved) {
      resolvedCount++;
      const durationHours = Math.max(1, (updatedMs - createdMs) / (1000 * 60 * 60));
      const maxSLA = getDepartmentSLAHours(inc.category);
      if (durationHours > maxSLA) {
        slaBreaches++;
      }
    } else {
      activeBacklog++;
    }
  });

  const totalTeams = teams.length;
  const dispatchedTeams = teams.filter((t) => t.status === "dispatched" || t.status === "busy").length;
  const chronicSites = recurrence.filter((r) => r.failureTier === "CHRONIC" || r.failureTier === "HIGH").length;

  const slaBreachRate = resolvedCount > 0 ? slaBreaches / resolvedCount : (activeBacklog > 5 ? 0.30 : 0.0);

  // 1. Normalized Factor Components [0.0, 1.0]
  const P_backlog = Math.min(1.0, activeBacklog / 20);
  const P_velocity = Math.min(1.0, velocity24h / 10);
  const P_sla = Math.min(1.0, slaBreachRate);
  const P_utilization = dispatchedTeams / Math.max(1, totalTeams);
  const P_critical = Math.min(1.0, criticalCount / 5);
  const P_recurrence = Math.min(1.0, chronicSites / 4);

  // 2. Exact Mathematical Contributions (Weights sum to 100)
  const c_backlog = Math.round(100 * 0.25 * P_backlog);
  const c_velocity = Math.round(100 * 0.20 * P_velocity);
  const c_sla = Math.round(100 * 0.20 * P_sla);
  const c_utilization = Math.round(100 * 0.15 * P_utilization);
  const c_critical = Math.round(100 * 0.10 * P_critical);
  const c_recurrence = Math.round(100 * 0.10 * P_recurrence);

  const rawScore = c_backlog + c_velocity + c_sla + c_utilization + c_critical + c_recurrence;
  const score = Math.max(0, Math.min(100, rawScore));
  const level = evaluatePressureLevel(score);

  const factors: PressureFactorItem[] = [
    {
      factor: "ACTIVE_BACKLOG",
      contribution: c_backlog,
      normalizedValue: Number(P_backlog.toFixed(2)),
      description: `${activeBacklog} active unaddressed municipal incidents (${Math.round(P_backlog * 100)}% capacity threshold)`,
    },
    {
      factor: "SLA_BREACH",
      contribution: c_sla,
      normalizedValue: Number(P_sla.toFixed(2)),
      description: `${Math.round(slaBreachRate * 100)}% resolution timeline breach rate on closed cases`,
    },
    {
      factor: "INCIDENT_VELOCITY",
      contribution: c_velocity,
      normalizedValue: Number(P_velocity.toFixed(2)),
      description: `${velocity24h} incoming citizen reports recorded in the rolling 24-hour cycle`,
    },
    {
      factor: "TEAM_UTILIZATION",
      contribution: c_utilization,
      normalizedValue: Number(P_utilization.toFixed(2)),
      description: `${dispatchedTeams}/${totalTeams || 1} available municipal field teams currently deployed (${Math.round(P_utilization * 100)}% active)`,
    },
    {
      factor: "CRITICAL_INCIDENTS",
      contribution: c_critical,
      normalizedValue: Number(P_critical.toFixed(2)),
      description: `${criticalCount} high-severity cases with critical emergency rating`,
    },
    {
      factor: "CHRONIC_RECURRENCE",
      contribution: c_recurrence,
      normalizedValue: Number(P_recurrence.toFixed(2)),
      description: `${chronicSites} chronic recurring defect sites requiring repeated municipal intervention`,
    },
  ];

  const explanation = `Citywide operational pressure is ${level} at ${score}/100, driven primarily by ${
    factors.slice().sort((a, b) => b.contribution - a.contribution)[0].description
  }.`;

  return {
    score,
    level,
    activeBacklog,
    incidentVelocity: velocity24h,
    slaBreachRate: Number(slaBreachRate.toFixed(2)),
    teamUtilization: Number(P_utilization.toFixed(2)),
    criticalIncidentCount: criticalCount,
    recurrencePressure: chronicSites,
    factors,
    explanation,
  };
}
