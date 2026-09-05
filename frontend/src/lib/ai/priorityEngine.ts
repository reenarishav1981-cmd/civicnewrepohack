import { PriorityLevel, AIExplanationFactor } from "@/types";
import { findNearbySensitiveAnchor } from "./geo";

export interface PriorityEvaluation {
  priority: PriorityLevel;
  score: number; // 0 - 100
  reasonSummary: string;
  factors: AIExplanationFactor[];
}

const CRITICAL_KEYWORDS = ["accident", "injured", "spark", "shock", "collapse", "burst", "sinkhole", "fire", "emergency", "fatal"];
const HIGH_KEYWORDS = ["crater", "huge pothole", "overflowing", "sewage", "dark road", "open wire", "manhole", "danger"];

export function evaluateIncidentPriority(
  description: string,
  category: string,
  connectedSignalsCount: number,
  lat: number,
  lng: number,
  hoursUnresolved: number = 0
): PriorityEvaluation {
  const textLower = description.toLowerCase();
  const factors: AIExplanationFactor[] = [];

  // 1. Keyword & Severity Score (Max 35 pts)
  let severityScore = 15;
  const criticalMatches = CRITICAL_KEYWORDS.filter(k => textLower.includes(k));
  const highMatches = HIGH_KEYWORDS.filter(k => textLower.includes(k));

  if (criticalMatches.length > 0) {
    severityScore = 35;
    factors.push({
      title: "Public Safety Hazard Language",
      detail: `Critical safety vocabulary detected (${criticalMatches.join(", ")}). Immediate physical hazard risk.`,
      confidence: 0.96,
      badge: "High Risk"
    });
  } else if (highMatches.length > 0) {
    severityScore = 25;
    factors.push({
      title: "Elevated Hazard Indicators",
      detail: `High-priority civic distress terms detected (${highMatches.join(", ")}).`,
      confidence: 0.88,
      badge: "Urgent"
    });
  } else {
    factors.push({
      title: "Standard Civic Distress",
      detail: "Regular maintenance category signal detected.",
      confidence: 0.78
    });
  }

  // 2. Signal Volume Multiplier (Max 30 pts)
  // Logarithmic scaling based on number of citizen reports connected
  const volumePoints = Math.min(30, Math.round(10 * Math.log2(connectedSignalsCount + 1)));
  if (connectedSignalsCount >= 10) {
    factors.push({
      title: "Mass Citizen Escalation",
      detail: `${connectedSignalsCount} independent citizen signals clustered on this specific hazard node.`,
      confidence: 0.95,
      badge: `${connectedSignalsCount} Signals`
    });
  } else if (connectedSignalsCount >= 3) {
    factors.push({
      title: "Multi-Citizen Confirmation",
      detail: `${connectedSignalsCount} independent citizens reported similar conditions in this sector.`,
      confidence: 0.89,
      badge: `${connectedSignalsCount} Signals`
    });
  }

  // 3. Sensitive Zone Factor (Max 20 pts)
  let zonePoints = 5;
  const sensitiveAnchor = findNearbySensitiveAnchor(lat, lng, 400);
  if (sensitiveAnchor) {
    zonePoints = 20;
    factors.push({
      title: "Sensitive Zone Proximity",
      detail: `Hazard is within 350m of ${sensitiveAnchor.name} (${sensitiveAnchor.type.toUpperCase()}). High vulnerability zone.`,
      confidence: 0.98,
      badge: "Zone Priority"
    });
  }

  // 4. Latency / Unresolved Time Factor (Max 15 pts)
  let timePoints = Math.min(15, Math.round(hoursUnresolved * 0.5));
  if (hoursUnresolved > 24) {
    factors.push({
      title: "Unresolved Age Escalation",
      detail: `Signal cluster has remained unaddressed for ${Math.round(hoursUnresolved)} hours.`,
      confidence: 0.92,
      badge: `${Math.round(hoursUnresolved)}h Pending`
    });
  }

  // Final Composite Score
  const totalScore = Math.min(100, Math.max(10, severityScore + volumePoints + zonePoints + timePoints));

  let priority: PriorityLevel = "low";
  if (totalScore >= 80) priority = "critical";
  else if (totalScore >= 55) priority = "high";
  else if (totalScore >= 35) priority = "medium";

  const summary = formatPriorityReason(priority, totalScore, factors.map(f => f.title));

  return {
    priority,
    score: totalScore,
    reasonSummary: summary,
    factors
  };
}

export function formatPriorityReason(priority: PriorityLevel, score: number, factorTitles: string[] = []): string {
  const factorsStr = factorTitles.length > 0 ? factorTitles.slice(0, 2).join(" + ") : "Civic Distress Factors";
  return `${priority.toUpperCase()} PRIORITY (${score}/100) — ${factorsStr}`;
}
