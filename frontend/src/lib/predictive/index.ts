/**
 * CivicPulse Predictive Intelligence Engine
 * Unified orchestrator and export layer for all Phase 6 predictive modules.
 */

export * from "./predictiveTypes";
export * from "./confidenceEngine";
export * from "./hotspotDetection";
export * from "./recurrenceAnalysis";
export * from "./escalationRisk";
export * from "./rootCauseInference";
export * from "./priorityRecommendation";
export * from "./trendAnalysis";

import { Incident, CitizenReport } from "@/types";
import {
  PredictiveOverview,
  IncidentPredictiveProfile,
  CivicHotspot,
  RecurrencePattern,
  EscalationRisk,
  CivicTrend,
  RootCauseHypothesis
} from "./predictiveTypes";

import { detectCivicHotspots } from "./hotspotDetection";
import { analyzeRecurrencePatterns } from "./recurrenceAnalysis";
import { evaluateEscalationRisk, rankIncidentsByEscalationRisk } from "./escalationRisk";
import { inferRootCauses, inferAllCityRootCauses } from "./rootCauseInference";
import { recommendIncidentPriority } from "./priorityRecommendation";
import { analyzeCivicTrends } from "./trendAnalysis";
import { evaluateConfidence } from "./confidenceEngine";

/**
 * High-level service generating the complete municipal predictive overview
 */
export function generatePredictiveOverview(
  incidents: Incident[],
  reports: CitizenReport[] = []
): PredictiveOverview {
  const activeIncidents = incidents.filter(i => i.status !== "resolved" && i.status !== "closed");
  const hotspots = detectCivicHotspots(incidents);
  const chronicPatterns = analyzeRecurrencePatterns(incidents);
  const escalationWatchlist = rankIncidentsByEscalationRisk(incidents);
  const emergingTrends = analyzeCivicTrends(incidents);
  const rootCauseHypotheses = inferAllCityRootCauses(incidents);

  const confidence = evaluateConfidence({
    evidenceCount: incidents.length + reports.length,
    signalAgreement: 0.85,
    hasPhotos: incidents.some(i => !!i.beforeEvidenceUrl) || reports.some(r => !!r.mediaUrl)
  });

  return {
    generatedAt: new Date().toISOString(),
    observationWindowDays: 30,
    dataConfidence: confidence,
    metrics: {
      totalActiveIncidents: activeIncidents.length,
      activeHotspotCount: hotspots.filter(h => h.riskLevel === "critical" || h.riskLevel === "high").length,
      chronicPatternCount: chronicPatterns.filter(p => p.suspectedPersistence === "chronic").length,
      criticalEscalationCount: escalationWatchlist.filter(e => e.level === "critical").length,
    },
    hotspots,
    chronicPatterns,
    escalationWatchlist,
    emergingTrends,
    rootCauseHypotheses,
  };
}

/**
 * Generate deep predictive assessment for a specific incident case file
 */
export function analyzeIncidentPredictiveProfile(
  incident: Incident,
  allIncidents: Incident[],
  reports: CitizenReport[] = []
): IncidentPredictiveProfile {
  const escalation = evaluateEscalationRisk(incident, allIncidents);
  const priorityRec = recommendIncidentPriority(incident, allIncidents);
  const rootCauses = inferRootCauses(incident, allIncidents);

  // Find hotspots containing this incident
  const allHotspots = detectCivicHotspots(allIncidents);
  const associatedHotspots = allHotspots.filter(h => h.incidentIds.includes(incident.id));

  // Find recurrence patterns related to this incident
  const allPatterns = analyzeRecurrencePatterns(allIncidents);
  const associatedPatterns = allPatterns.filter(p => p.relatedIncidentIds.includes(incident.id));

  const confidence = evaluateConfidence({
    evidenceCount: (incident.connectedReportsCount || 1) + rootCauses.length,
    signalAgreement: 0.9,
    hasPhotos: !!incident.beforeEvidenceUrl || !!incident.afterEvidenceUrl
  });

  return {
    incidentId: incident.id,
    escalation,
    priorityRecommendation: priorityRec,
    associatedHotspots,
    associatedPatterns,
    rootCauseHypotheses: rootCauses,
    confidence,
  };
}

/**
 * Extensibility Interface for Future Machine Learning & Statistical Models
 * (e.g., PyTorch/ONNX inference, weather/sensor telemetry streams)
 */
export interface IIntelligenceProvider<TInput = any, TOutput = any> {
  name: string;
  version: string;
  analyze(input: TInput): Promise<TOutput>;
}
