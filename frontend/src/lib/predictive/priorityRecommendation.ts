/**
 * CivicPulse Priority Recommendation Engine
 * Generates explainable, evidence-backed priority recommendations for human municipal operators.
 * 
 * CORE PRINCIPLE: Does NOT silently mutate incident status or priority in place.
 * Always provides recommendations with operatorOverrideRequired = true.
 */

import { Incident } from "@/types";
import { evaluateEscalationRisk } from "./escalationRisk";
import { findNearbySensitiveAnchor } from "../ai/geo";
import { PriorityRecommendation } from "./predictiveTypes";

export function recommendIncidentPriority(
  incident: Incident,
  allIncidents: Incident[] = []
): PriorityRecommendation {
  const escalation = evaluateEscalationRisk(incident, allIncidents);
  const sensitiveAnchor = findNearbySensitiveAnchor(incident.latitude, incident.longitude, 400);
  const reportsCount = incident.connectedReportsCount || 1;
  const isReopened = incident.status === "reopen_requested" || incident.citizenFeedbackStatus === "ISSUE STILL EXISTS";

  // Score calculation components
  const baseScore = incident.priorityScore || 50;
  const escalationPoints = Math.round(escalation.score * 35); // Max 35 pts
  const volumePoints = Math.min(25, reportsCount * 4); // Max 25 pts
  const sensitivePoints = sensitiveAnchor ? 20 : 0; // Max 20 pts
  const reopenPoints = isReopened ? 15 : 0; // Max 15 pts

  // Composite recommended priority score (0 - 100)
  const compositeScore = Math.min(
    100,
    Math.max(15, Math.round(baseScore * 0.25 + escalationPoints + volumePoints + sensitivePoints + reopenPoints))
  );

  let recommendedPriority: "low" | "medium" | "high" | "critical" = "low";
  if (compositeScore >= 80) {
    recommendedPriority = "critical";
  } else if (compositeScore >= 60) {
    recommendedPriority = "high";
  } else if (compositeScore >= 40) {
    recommendedPriority = "medium";
  }

  const factors: string[] = [];
  factors.push(`Base category hazard evaluation: ${incident.category} (${baseScore}/100)`);
  if (escalation.score >= 0.50) {
    factors.push(`Elevated escalation trajectory (${Math.round(escalation.score * 100)}% risk index): ${escalation.recommendation}`);
  }
  if (reportsCount >= 2) {
    factors.push(`Clustered citizen signal density: ${reportsCount} independent citizen reports`);
  }
  if (sensitiveAnchor) {
    factors.push(`Vulnerable municipal anchor proximity: Within 400m of ${sensitiveAnchor.name} (${sensitiveAnchor.type.toUpperCase()})`);
  }
  if (isReopened) {
    factors.push(`Citizen satisfaction feedback: Problem was reported to persist following prior remediation`);
  }

  const explanation = `${recommendedPriority.toUpperCase()} priority recommended (Score: ${compositeScore}/100). ${factors.slice(0, 3).join("; ")}.`;

  return {
    recommendedPriority,
    score: compositeScore,
    factors,
    explanation,
    operatorOverrideRequired: true
  };
}
