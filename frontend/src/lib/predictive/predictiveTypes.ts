/**
 * CivicPulse Predictive Intelligence Domain Types
 * Defines data structures for hotspots, recurrence, escalation, root cause, and trends.
 */

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type TrendDirection = "emerging" | "stable" | "declining";
export type RecurrencePersistence = "temporary" | "recurring" | "chronic";

export interface CivicHotspot {
  id: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  incidentCount: number;
  activeIncidentCount: number;
  recurrenceScore: number;
  severityScore: number;
  densityScore: number;
  riskScore: number; // 0.0 - 1.0
  trend: TrendDirection;
  dominantCategories: string[];
  riskLevel: RiskLevel;
  explanation: string;
  confidence: number;
  contributingFactors: Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }>;
  recommendedAction: string;
  incidentIds: string[];
}

export interface RecurrencePattern {
  id: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  occurrenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  averageIntervalDays: number;
  recurrenceScore: number; // 0.0 - 1.0
  trend: "increasing" | "stable" | "decreasing";
  suspectedPersistence: RecurrencePersistence;
  explanation: string;
  relatedIncidentIds: string[];
}

export interface EscalationRisk {
  incidentId: string;
  score: number; // 0.0 - 1.0
  level: RiskLevel;
  contributingFactors: Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }>;
  recommendation: string;
  confidence: number;
}

export interface RootCauseHypothesis {
  hypothesis: string;
  confidence: number; // 0.0 - 1.0
  supportingEvidence: string[];
  relatedIncidentIds: string[];
  relatedCategories: string[];
  recommendedInvestigation: string;
}

export interface PriorityRecommendation {
  recommendedPriority: "low" | "medium" | "high" | "critical";
  score: number; // 0 - 100
  factors: string[];
  explanation: string;
  operatorOverrideRequired: boolean;
}

export interface IntelligenceConfidence {
  score: number; // 0.0 - 1.0
  level: "low" | "medium" | "high";
  evidenceCount: number;
  signalAgreement: number; // 0.0 - 1.0
  explanation: string;
}

export interface CivicTrend {
  category: string;
  areaId?: string;
  currentCount: number;
  baselineCount: number;
  changePercentage: number;
  direction: "increasing" | "stable" | "decreasing";
  confidence: number;
}

export interface PredictiveOverview {
  generatedAt: string;
  observationWindowDays: number;
  dataConfidence: IntelligenceConfidence;
  metrics: {
    totalActiveIncidents: number;
    activeHotspotCount: number;
    chronicPatternCount: number;
    criticalEscalationCount: number;
  };
  hotspots: CivicHotspot[];
  chronicPatterns: RecurrencePattern[];
  escalationWatchlist: EscalationRisk[];
  emergingTrends: CivicTrend[];
  rootCauseHypotheses: RootCauseHypothesis[];
}

export interface IncidentPredictiveProfile {
  incidentId: string;
  escalation: EscalationRisk;
  priorityRecommendation: PriorityRecommendation;
  associatedHotspots: CivicHotspot[];
  associatedPatterns: RecurrencePattern[];
  rootCauseHypotheses: RootCauseHypothesis[];
  confidence: IntelligenceConfidence;
}
