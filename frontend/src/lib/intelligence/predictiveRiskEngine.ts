/**
 * CivicPulse Phase 6 — Predictive Risk Engine
 * Deterministic, explainable multi-factor civic risk scoring (0 to 100).
 * Formula: RiskScore = 100 * (0.20*F + 0.20*V + 0.20*R + 0.15*RF + 0.15*A + 0.10*S)
 */

import { Incident, CitizenReport } from "@/types";
import { PredictiveRiskResult, RiskLevel, RiskFactorItem } from "./predictiveTypes";

export const RISK_WEIGHTS = {
  FREQUENCY: 0.20,
  VELOCITY: 0.20,
  RECURRENCE: 0.20,
  RESOLUTION_FAILURE: 0.15,
  ACTIVE_PRESSURE: 0.15,
  SENSITIVE_ZONE: 0.10,
};

export const SENSITIVE_KEYWORDS = [
  "school", "hospital", "clinic", "trauma", "metro", "bus stand", 
  "railway", "station", "market", "kindergarten", "junction", "interchange"
];

export function isSensitiveLocation(address: string = "", description: string = ""): boolean {
  const combined = `${address} ${description}`.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => combined.includes(kw));
}

export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

export interface RiskEvaluationInput {
  incidentCount: number;
  reportCount?: number;
  velocityIncreasePercent?: number; // e.g. +60%
  repeatedCount: number;
  reopenedCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  isSensitiveZone?: boolean;
  address?: string;
  description?: string;
  incidentId?: string;
  locationId?: string;
}

export function calculatePredictiveRisk(input: RiskEvaluationInput): PredictiveRiskResult {
  const totalIncidents = Math.max(1, input.incidentCount);

  // 1. Frequency (0.0 to 1.0): saturated at 8 incidents
  const frequencyRaw = Math.min(1.0, Math.max(0.0, input.incidentCount / 8));
  const frequencyPoints = Math.round(frequencyRaw * RISK_WEIGHTS.FREQUENCY * 100);

  // 2. Velocity (0.0 to 1.0): reporting acceleration
  const velPercent = input.velocityIncreasePercent ?? 0;
  // Normalized: <= 0% -> 0.2, 50% -> 0.6, >= 100% -> 1.0
  const velocityRaw = Math.min(1.0, Math.max(0.0, velPercent <= 0 ? 0.2 : 0.2 + (velPercent / 125) * 0.8));
  const velocityPoints = Math.round(velocityRaw * RISK_WEIGHTS.VELOCITY * 100);

  // 3. Recurrence (0.0 to 1.0): repeated incidents / total incidents
  const recurrenceRaw = Math.min(1.0, Math.max(0.0, input.repeatedCount / totalIncidents));
  const recurrencePoints = Math.round(recurrenceRaw * RISK_WEIGHTS.RECURRENCE * 100);

  // 4. Resolution Failure (0.0 to 1.0): reopened incidents / (resolved + reopened)
  const totalResolutions = input.resolvedCount + input.reopenedCount;
  const resolutionFailureRaw = totalResolutions > 0
    ? Math.min(1.0, Math.max(0.0, input.reopenedCount / totalResolutions))
    : (input.reopenedCount > 0 ? 0.8 : 0.0);
  const resolutionFailurePoints = Math.round(resolutionFailureRaw * RISK_WEIGHTS.RESOLUTION_FAILURE * 100);

  // 5. Active Pressure (0.0 to 1.0): unresolved / total
  const activePressureRaw = Math.min(1.0, Math.max(0.0, input.unresolvedCount / totalIncidents));
  const activePressurePoints = Math.round(activePressureRaw * RISK_WEIGHTS.ACTIVE_PRESSURE * 100);

  // 6. Sensitive Zone (0.0 to 1.0): proximity to verified sensitive infrastructure anchors
  const sensitive = input.isSensitiveZone ?? isSensitiveLocation(input.address, input.description);
  const sensitiveZoneRaw = sensitive ? 1.0 : 0.20;
  const sensitiveZonePoints = Math.round(sensitiveZoneRaw * RISK_WEIGHTS.SENSITIVE_ZONE * 100);

  // Total Score: strictly bounded 0 to 100
  const rawSum = (
    RISK_WEIGHTS.FREQUENCY * frequencyRaw +
    RISK_WEIGHTS.VELOCITY * velocityRaw +
    RISK_WEIGHTS.RECURRENCE * recurrenceRaw +
    RISK_WEIGHTS.RESOLUTION_FAILURE * resolutionFailureRaw +
    RISK_WEIGHTS.ACTIVE_PRESSURE * activePressureRaw +
    RISK_WEIGHTS.SENSITIVE_ZONE * sensitiveZoneRaw
  );

  const riskScore = Math.min(100, Math.max(0, Math.round(rawSum * 100)));
  const riskLevel = classifyRiskLevel(riskScore);

  const factorBreakdown = {
    frequency: {
      factor: "Historical Frequency",
      rawScore: Number(frequencyRaw.toFixed(2)),
      impactPoints: frequencyPoints,
      description: `${input.incidentCount} incident(s) observed (weight: 20%)`,
    },
    velocity: {
      factor: "Report Velocity",
      rawScore: Number(velocityRaw.toFixed(2)),
      impactPoints: velocityPoints,
      description: `Report velocity acceleration: ${velPercent >= 0 ? "+" : ""}${velPercent}% (weight: 20%)`,
    },
    recurrence: {
      factor: "Recurrence Ratio",
      rawScore: Number(recurrenceRaw.toFixed(2)),
      impactPoints: recurrencePoints,
      description: `${input.repeatedCount} recurring failure(s) at site (weight: 20%)`,
    },
    resolutionFailure: {
      factor: "Resolution Failure",
      rawScore: Number(resolutionFailureRaw.toFixed(2)),
      impactPoints: resolutionFailurePoints,
      description: `${input.reopenedCount} reopened post-resolution (weight: 15%)`,
    },
    activePressure: {
      factor: "Active Incident Pressure",
      rawScore: Number(activePressureRaw.toFixed(2)),
      impactPoints: activePressurePoints,
      description: `${input.unresolvedCount} unresolved incident(s) currently open (weight: 15%)`,
    },
    sensitiveZone: {
      factor: "Sensitive Zone Impact",
      rawScore: Number(sensitiveZoneRaw.toFixed(2)),
      impactPoints: sensitiveZonePoints,
      description: sensitive
        ? "Located within sensitive civic buffer (school/hospital/transit) (weight: 10%)"
        : "Standard municipal zoning (weight: 10%)",
    },
  };

  // Extract Primary Drivers
  const factorList = Object.values(factorBreakdown);
  const primaryDrivers = factorList
    .filter((f) => f.impactPoints > 0)
    .sort((a, b) => b.impactPoints - a.impactPoints)
    .slice(0, 4)
    .map((f) => `+${f.impactPoints} ${f.factor}`);

  const explanation = `Risk score of ${riskScore}/100 (${riskLevel}) driven primarily by ${primaryDrivers.join(", ")}.`;

  return {
    locationId: input.locationId,
    incidentId: input.incidentId,
    riskScore,
    riskLevel,
    factorBreakdown,
    primaryDrivers,
    explanation,
  };
}

/**
 * Convenience helper to evaluate an incident and its cluster context
 */
export function evaluateIncidentRisk(
  incident: Incident,
  allIncidents: Incident[] = [],
  reports: CitizenReport[] = []
): PredictiveRiskResult {
  // Find nearby incidents (within 400m)
  const nearby = allIncidents.filter((i) => {
    if (i.id === incident.id) return true;
    const latDiff = Math.abs(i.latitude - incident.latitude);
    const lngDiff = Math.abs(i.longitude - incident.longitude);
    return latDiff < 0.004 && lngDiff < 0.004; // ~400m
  });

  const repeatedCount = Math.max(0, nearby.length - 1);
  let reopenedCount = 0;
  let resolvedCount = 0;
  let unresolvedCount = 0;

  nearby.forEach((i) => {
    if (i.reopenedAt || i.reopenedReason) reopenedCount++;
    if (i.status === "resolved" || i.status === "closed") resolvedCount++;
    else unresolvedCount++;
  });

  return calculatePredictiveRisk({
    incidentId: incident.id,
    locationId: incident.zone,
    incidentCount: nearby.length,
    repeatedCount,
    reopenedCount,
    resolvedCount,
    unresolvedCount,
    address: incident.address,
    description: incident.title,
  });
}
