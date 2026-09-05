/**
 * CivicPulse Escalation Risk Engine
 * Quantifies probability of active incidents worsening or breaching operational containment.
 */

import { Incident } from "@/types";
import { findNearbySensitiveAnchor } from "../ai/geo";
import { EscalationRisk, RiskLevel } from "./predictiveTypes";

export function evaluateEscalationRisk(
  incident: Incident,
  allIncidents: Incident[] = []
): EscalationRisk {
  const now = Date.now();
  const createdTime = new Date(incident.createdAt).getTime();
  const hoursUnresolved = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
  const daysUnresolved = hoursUnresolved / 24;

  // 1. Time Unresolved Factor (Max 1.0, saturated at 7 days)
  const timeFactor = Math.min(1.0, hoursUnresolved / (7 * 24));

  // 2. Citizen Reports Volume (Max 1.0, saturated at 8 reports)
  const reportsCount = incident.connectedReportsCount || 1;
  const reportFactor = Math.min(1.0, reportsCount / 8);

  // 3. Base Severity Factor (0.0 to 1.0)
  const severityFactor = Math.min(1.0, (incident.priorityScore || 50) / 100);

  // 4. Sensitive Infrastructure Proximity (0.0 to 1.0)
  const sensitiveAnchor = findNearbySensitiveAnchor(incident.latitude, incident.longitude, 400);
  const sensitiveFactor = sensitiveAnchor ? 1.0 : 0.2;

  // 5. Historical Recurrence in Area (Max 1.0)
  // Count nearby incidents in same category within 400m
  const nearbySimilar = allIncidents.filter(other => {
    if (other.id === incident.id) return false;
    const isCat = other.category.toLowerCase() === incident.category.toLowerCase();
    const latDiff = Math.abs(other.latitude - incident.latitude);
    const lngDiff = Math.abs(other.longitude - incident.longitude);
    return isCat && latDiff < 0.004 && lngDiff < 0.004; // ~400m box
  }).length;
  const recurrenceFactor = Math.min(1.0, nearbySimilar / 4);

  // 6. Citizen Reopen / Dissatisfaction Factor
  const isReopened = incident.status === "reopen_requested" || incident.citizenFeedbackStatus === "ISSUE STILL EXISTS";
  const reopenFactor = isReopened ? 1.0 : (incident.status === "awaiting_verification" ? 0.4 : 0.1);

  // Composite Weighted Escalation Score
  // 0.25 * Time + 0.20 * Reports + 0.15 * Severity + 0.15 * Sensitive + 0.15 * Recurrence + 0.10 * Reopen
  const rawScore =
    0.25 * timeFactor +
    0.20 * reportFactor +
    0.15 * severityFactor +
    0.15 * sensitiveFactor +
    0.15 * recurrenceFactor +
    0.10 * reopenFactor;

  const score = Math.min(1.0, Math.max(0.05, Math.round(rawScore * 100) / 100));

  let level: RiskLevel = "low";
  if (score >= 0.75) {
    level = "critical";
  } else if (score >= 0.55) {
    level = "high";
  } else if (score >= 0.35) {
    level = "moderate";
  }

  // Contributing Factors
  const contributingFactors = [
    {
      factor: "Unresolved Duration",
      contribution: Math.round(timeFactor * 25),
      explanation: daysUnresolved >= 1
        ? `Incident has remained open for ${daysUnresolved.toFixed(1)} days (${Math.round(hoursUnresolved)}h).`
        : `Active for ${Math.round(hoursUnresolved)} hours.`
    },
    {
      factor: "Citizen Report Volume",
      contribution: Math.round(reportFactor * 20),
      explanation: `${reportsCount} correlated citizen reports registered on this incident.`
    },
    {
      factor: "Inherent Severity",
      contribution: Math.round(severityFactor * 15),
      explanation: `Baseline priority score evaluated at ${incident.priorityScore}/100.`
    },
    {
      factor: "Sensitive Anchor Proximity",
      contribution: Math.round(sensitiveFactor * 15),
      explanation: sensitiveAnchor
        ? `Located within 400m of ${sensitiveAnchor.name} (${sensitiveAnchor.type.toUpperCase()}).`
        : "No high-vulnerability civic anchors within immediate proximity."
    },
    {
      factor: "Local Area Recurrence",
      contribution: Math.round(recurrenceFactor * 15),
      explanation: nearbySimilar > 0
        ? `${nearbySimilar} related ${incident.category} incidents historically cataloged in this vicinity.`
        : "Isolated incident without immediate historical cluster."
    },
    {
      factor: "Citizen Dissatisfaction & Status",
      contribution: Math.round(reopenFactor * 10),
      explanation: isReopened
        ? "Citizen reported issue persists post-resolution (reopen requested)."
        : `Operational status currently '${incident.status}'.`
    }
  ];

  let recommendation = "CONTINUE STANDARD MONITORING";
  if (level === "critical") {
    recommendation = "IMMEDIATE EMERGENCY DISPATCH & SENIOR OPERATOR ESCALATION";
  } else if (level === "high") {
    recommendation = "EXPEDITE FIELD SQUAD ASSIGNMENT TO PREVENT SERVICE COMPLAINT SURGE";
  } else if (level === "moderate") {
    recommendation = "SCHEDULE ROUTINE FIELD TEAM RESPONSE WITHIN NEXT SHIFT";
  }

  return {
    incidentId: incident.id,
    score,
    level,
    contributingFactors,
    recommendation,
    confidence: Math.min(0.98, Math.max(0.60, 0.50 + reportsCount * 0.06 + (sensitiveAnchor ? 0.15 : 0)))
  };
}

export function rankIncidentsByEscalationRisk(
  incidents: Incident[]
): EscalationRisk[] {
  // Only evaluate active incidents (exclude resolved and closed)
  const active = incidents.filter(i => i.status !== "resolved" && i.status !== "closed");
  const evaluations = active.map(i => evaluateEscalationRisk(i, incidents));
  return evaluations.sort((a, b) => b.score - a.score);
}
