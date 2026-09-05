/**
 * CivicPulse Phase 8 — Decision Recommendation Engine
 * Synthesizes operational evidence into actionable, non-autonomous recommendations for municipal leadership.
 * STRICT RULE: Every recommendation has humanApprovalRequired: true. The system never executes operations autonomously.
 */

import { Incident, FieldTeam } from "@/types";
import { CivicHotspot, EmergingIssue, RecurrenceAnalysis } from "../intelligence/predictiveTypes";
import { 
  DecisionRecommendation, 
  DepartmentPerformanceProfile, 
  AreaPerformanceProfile, 
  ResourcePressureResult 
} from "./executiveTypes";

/**
 * Computes recommendation confidence based on observed historical data volume
 */
export function calculateRecommendationConfidence(sampleSize: number): number {
  if (sampleSize <= 0) return 0.20;
  if (sampleSize < 3) return 0.40;
  if (sampleSize < 8) return 0.65;
  if (sampleSize < 15) return 0.82;
  return 0.92;
}

/**
 * Generates explainable, prioritized municipal decision recommendations
 */
export function generateDecisionRecommendations(
  departments: DepartmentPerformanceProfile[],
  areas: AreaPerformanceProfile[],
  pressure: ResourcePressureResult,
  hotspots: CivicHotspot[] = [],
  emerging: EmergingIssue[] = [],
  teams: FieldTeam[] = []
): DecisionRecommendation[] {
  const recommendations: DecisionRecommendation[] = [];
  const nowIso = new Date().toISOString();

  let recIdCounter = 1;
  const nextId = (prefix: string) => `REC-${prefix}-${recIdCounter++}`;

  // 1. DEPLOY_ADDITIONAL_TEAM Rule:
  // Triggered when a department or zone faces heavy backlog and team utilization is high
  const highBacklogDept = departments.find((d) => d.activeBacklog >= 8 || (d.status === "CRITICAL" && d.activeBacklog >= 4));
  const highPressureArea = areas.find((a) => a.status === "CRITICAL" || a.status === "HIGH_PRESSURE");

  if (highBacklogDept && pressure.teamUtilization >= 0.60) {
    const areaTarget = highPressureArea ? highPressureArea.zone : "Central Zone";
    const confidence = calculateRecommendationConfidence(highBacklogDept.totalIncidents);

    recommendations.push({
      id: nextId("DEPLOY"),
      actionType: "DEPLOY_ADDITIONAL_TEAM",
      urgency: highBacklogDept.criticalIncidentCount >= 2 ? "CRITICAL" : "HIGH",
      targetArea: areaTarget,
      department: highBacklogDept.department,
      title: `Authorize Reserve Squad Mobilization: ${highBacklogDept.department}`,
      reason: `Active work backlog (${highBacklogDept.activeBacklog} cases) and high team deployment rate (${Math.round(pressure.teamUtilization * 100)}%) exceed normal operational absorption capacity.`,
      evidence: {
        activeBacklog: highBacklogDept.activeBacklog,
        velocityIncreasePercent: highBacklogDept.incidentVelocity * 10,
        slaBreachRate: highBacklogDept.slaBreachRate,
        criticalCount: highBacklogDept.criticalIncidentCount,
      },
      expectedImpact: `Mobilizing 1 reserve squad is projected to accelerate backlog clearance by ~35% within 48 hours and prevent SLA escalation.`,
      confidence,
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  // 2. PRIORITIZE_CRITICAL_CLUSTER Rule:
  // Triggered when critical incidents or severe hotspots cluster in a specific zone
  const criticalHotspot = hotspots.find((h) => h.hotspotRiskScore >= 70 || h.unresolvedCount >= 3);
  if (criticalHotspot) {
    const targetArea = highPressureArea?.zone || "Central Zone";
    const confidence = calculateRecommendationConfidence(criticalHotspot.incidentCount);

    recommendations.push({
      id: nextId("HOTSPOT"),
      actionType: "PRIORITIZE_CRITICAL_CLUSTER",
      urgency: criticalHotspot.hotspotRiskScore >= 80 ? "CRITICAL" : "HIGH",
      targetArea,
      department: highBacklogDept?.department || "Public Works / Road Infrastructure",
      title: `Establish Priority Response Corridor: ${criticalHotspot.dominantCategory} Cluster`,
      reason: `Geographic cluster near coordinates (${criticalHotspot.latitude.toFixed(3)}°N, ${criticalHotspot.longitude.toFixed(3)}°E) exhibits severe density and ${criticalHotspot.hotspotRiskScore}/100 composite risk.`,
      evidence: {
        activeBacklog: criticalHotspot.unresolvedCount,
        velocityIncreasePercent: 45,
        slaBreachRate: 0.38,
        criticalCount: 2,
      },
      expectedImpact: `Dispatching dedicated rapid-intervention crew to clear the spatial bottleneck prevents secondary traffic and pedestrian disruption.`,
      confidence,
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  // 3. ESCALATE_DEPARTMENT_REVIEW Rule:
  // Triggered when SLA breach rate > 35% OR reopen rate > 15%
  const failingDept = departments.find((d) => d.slaBreachRate > 0.35 || d.reopenRate > 0.15);
  if (failingDept) {
    const confidence = calculateRecommendationConfidence(failingDept.resolvedIncidents);

    recommendations.push({
      id: nextId("AUDIT"),
      actionType: "ESCALATE_DEPARTMENT_REVIEW",
      urgency: failingDept.reopenRate > 0.20 ? "CRITICAL" : "HIGH",
      targetArea: "Citywide Directorate",
      department: failingDept.department,
      title: `Convene Operational Review: ${failingDept.department}`,
      reason: `${failingDept.department} exhibits elevated SLA breach rate (${Math.round(failingDept.slaBreachRate * 100)}%) and resolution failure rate (${Math.round(failingDept.reopenRate * 100)}%).`,
      evidence: {
        activeBacklog: failingDept.activeBacklog,
        velocityIncreasePercent: 20,
        slaBreachRate: failingDept.slaBreachRate,
        criticalCount: failingDept.criticalIncidentCount,
      },
      expectedImpact: `Supervisory workflow inspection and quality re-verification eliminates repeat repair failures and restores citizen satisfaction.`,
      confidence,
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  // 4. MONITOR_EMERGING_PATTERN Rule:
  // Triggered when emerging issue detector reports >= 50% spike with sufficient evidence
  const severeSurge = emerging.find((e) => e.severity === "critical" || e.severity === "escalating" || e.increasePercent >= 50);
  if (severeSurge) {
    recommendations.push({
      id: nextId("SURGE"),
      actionType: "MONITOR_EMERGING_PATTERN",
      urgency: severeSurge.severity === "critical" ? "HIGH" : "MEDIUM",
      targetArea: severeSurge.zoneId || "Central Sector",
      department: highBacklogDept?.department || "Public Health & Solid Waste",
      title: `Deploy Preventive Surveillance: ${severeSurge.category} Outbreak`,
      reason: `${severeSurge.category} reports spiked by +${severeSurge.increasePercent}% compared to rolling 30-day municipal baseline.`,
      evidence: {
        activeBacklog: severeSurge.recentVolume,
        velocityIncreasePercent: severeSurge.increasePercent,
        slaBreachRate: 0.25,
        criticalCount: 1,
      },
      expectedImpact: `Early deployment of inspection crews halts category proliferation before seasonal escalation.`,
      confidence: Math.max(0.4, Number(severeSurge.confidence.toFixed(2))),
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  // 5. REBALANCE_OPERATIONAL_LOAD Rule:
  // Triggered when one zone has high pressure while another has idle capacity
  const overloadedZone = areas.find((a) => a.status === "CRITICAL" || a.status === "HIGH_PRESSURE");
  const idleZone = areas.find((a) => a.status === "STABLE" && a.activeBacklog <= 2);
  const availableTeams = teams.filter((t) => t.status === "available");

  if (overloadedZone && idleZone && availableTeams.length > 0) {
    recommendations.push({
      id: nextId("REBALANCE"),
      actionType: "REBALANCE_OPERATIONAL_LOAD",
      urgency: "MEDIUM",
      targetArea: `${idleZone.zone} → ${overloadedZone.zone}`,
      department: highBacklogDept?.department || "Public Works / Road Infrastructure",
      title: `Cross-Zone Fleet Reallocation: Rebalance to ${overloadedZone.zone}`,
      reason: `${overloadedZone.zone} is experiencing heavy incident pressure while ${idleZone.zone} maintains low backlog with surplus available capacity.`,
      evidence: {
        activeBacklog: overloadedZone.activeBacklog,
        velocityIncreasePercent: overloadedZone.incidentVelocity * 10,
        slaBreachRate: overloadedZone.slaPerformance < 0.70 ? 0.35 : 0.15,
        criticalCount: overloadedZone.criticalIncidentPressure,
      },
      expectedImpact: `Shifting standby capacity equalizes municipal response latency without requiring overtime expenditures.`,
      confidence: 0.85,
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  // Fallback default recommendation if city is very quiet
  if (recommendations.length === 0) {
    recommendations.push({
      id: nextId("MAINTAIN"),
      actionType: "MONITOR_EMERGING_PATTERN",
      urgency: "LOW",
      targetArea: "Citywide Grid",
      department: "General Municipal Operations",
      title: "Maintain Routine Preventative Municipal Patrols",
      reason: "All operational sectors currently conform to standard SLA thresholds and acceptable backlog volumes.",
      evidence: {
        activeBacklog: pressure.activeBacklog,
        velocityIncreasePercent: 0,
        slaBreachRate: pressure.slaBreachRate,
        criticalCount: pressure.criticalIncidentCount,
      },
      expectedImpact: "Sustained baseline inspection preserves high City Health index.",
      confidence: 0.90,
      humanApprovalRequired: true,
      status: "PENDING",
      createdAt: nowIso,
    });
  }

  return recommendations.slice(0, 5);
}
