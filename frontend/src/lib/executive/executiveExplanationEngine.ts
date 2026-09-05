/**
 * CivicPulse Phase 8 — Executive Explanation Engine
 * Decomposes every decision recommendation into clear, auditable senior executive briefings.
 */

import { DecisionRecommendation, ExecutiveExplanation } from "./executiveTypes";

export function explainDecisionRecommendation(
  rec: DecisionRecommendation,
  projectedBacklog48h?: number
): ExecutiveExplanation {
  const pBacklog = projectedBacklog48h || Math.round(rec.evidence.activeBacklog * 1.5);

  let whatIsHappening = "";
  let whyItMatters = "";

  switch (rec.actionType) {
    case "DEPLOY_ADDITIONAL_TEAM":
      whatIsHappening = `${rec.department} operations in ${rec.targetArea} are under elevated resource pressure.`;
      whyItMatters = `The current active backlog of ${rec.evidence.activeBacklog} cases is outpacing standard crew throughput. Without rebalancing, citizen resolution latency will escalate.`;
      break;

    case "PRIORITIZE_CRITICAL_CLUSTER":
      whatIsHappening = `A concentrated spatial cluster of high-severity reports has developed in ${rec.targetArea}.`;
      whyItMatters = `High density in sensitive urban corridors creates compound hazards for public safety and school pedestrian zones.`;
      break;

    case "ESCALATE_DEPARTMENT_REVIEW":
      whatIsHappening = `${rec.department} has exceeded allowable SLA breach and resolution failure tolerances.`;
      whyItMatters = `A resolution timeline breach rate of ${Math.round(rec.evidence.slaBreachRate * 100)}% indicates chronic procedural bottlenecks or inadequate supervisory verification.`;
      break;

    case "MONITOR_EMERGING_PATTERN":
      whatIsHappening = `An anomalous +${rec.evidence.velocityIncreasePercent}% volume surge was detected for ${rec.department}.`;
      whyItMatters = `Unchecked early volume spikes frequently precede major seasonal infrastructure degradation.`;
      break;

    case "REBALANCE_OPERATIONAL_LOAD":
      whatIsHappening = `A significant capacity imbalance exists between adjacent operational sectors (${rec.targetArea}).`;
      whyItMatters = `Equalizing standby fleet deployment eliminates localized response backlogs without requiring emergency budget allocation.`;
      break;

    default:
      whatIsHappening = `Operational monitoring indicates baseline municipal maintenance is active.`;
      whyItMatters = `Sustaining preventative sweeps maintains high urban livability scores.`;
      break;
  }

  const supportingEvidence = [
    { label: "Active Unresolved Backlog", value: `${rec.evidence.activeBacklog} incidents` },
    { label: "24h Intake Velocity Trend", value: `+${rec.evidence.velocityIncreasePercent}%` },
    { label: "SLA Breach Rate", value: `${Math.round(rec.evidence.slaBreachRate * 100)}%` },
    { label: "Critical Priority Incidents", value: `${rec.evidence.criticalCount} cases` },
  ];

  if (rec.evidence.chronicSitesCount !== undefined) {
    supportingEvidence.push({
      label: "Chronic Recurrence Locations",
      value: `${rec.evidence.chronicSitesCount} sites`,
    });
  }

  const whatHappensWithoutIntervention = `If no capacity adjustment is authorized, active backlog is projected to expand from ${rec.evidence.activeBacklog} to ~${pBacklog} cases over the next 48 hours, with proportional escalation in citizen escalation tickets.`;

  const underlyingAssumptions = [
    "Incident arrival rate remains consistent with the rolling 24-hour baseline velocity.",
    "Municipal field crews maintain historical average completion duration.",
    "No catastrophic weather anomaly disrupts standard field operations.",
  ];

  const confidenceRating =
    rec.confidence >= 0.85
      ? "HIGH (Supported by extensive historical audit data)"
      : rec.confidence >= 0.60
      ? "MODERATE (Supported by recent intake records)"
      : "LIMITED (Early observational sample; human review imperative)";

  return {
    recommendationId: rec.id,
    whatIsHappening,
    whyItMatters,
    supportingEvidence,
    whatIsRecommended: rec.title,
    whatHappensWithoutIntervention,
    underlyingAssumptions,
    confidenceRating,
  };
}
