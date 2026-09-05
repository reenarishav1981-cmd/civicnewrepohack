/**
 * CivicPulse Phase 6 — Predictive Civic Intelligence & Human-in-the-Loop Domain Types
 * 100% Deterministic, Explainable, and Data-Grounded
 */

export type TrendDirection = "rising" | "stable" | "declining";
export type VelocityTrend = "increasing" | "stable" | "decreasing";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ChronicFailureTier = "LOW" | "MODERATE" | "HIGH" | "CHRONIC";
export type EmergingSeverity = "watch" | "emerging" | "escalating" | "critical";

export type AIDecisionType = 
  | "correlation"
  | "priority"
  | "category"
  | "risk"
  | "hotspot";

export interface PatternIntelligence {
  zoneId?: string;
  incidentCount: number;
  reportCount: number;
  frequency24h: number;
  frequency7d: number;
  frequency30d: number;
  reportVelocity: number;
  velocityTrend: VelocityTrend;
  velocityChangePercent: number;
  dominantCategory: string;
  categoryConcentration: Array<{ category: string; count: number; percentage: number }>;
  resolvedCount: number;
  reopenedCount: number;
  unresolvedCount: number;
  recurrenceRate: number;
  resolutionFailureRate: number;
  avgResolutionTimeHours: number;
  trendConfidence: number;
}

export interface CivicHotspot {
  hotspotId: string;
  id: string; // Alias for hotspotId
  latitude: number;
  longitude: number;
  radiusMeters: number;
  incidentCount: number;
  reportCount: number;
  unresolvedCount: number;
  activeIncidentCount: number;
  dominantCategory: string;
  dominantCategories?: string[];
  recurrenceRate: number;
  trend: TrendDirection;
  riskLevel?: string;
  hotspotRiskScore: number;
  riskScore?: number; // 0.0 - 1.0 (for backward compatibility)
  score: number; // Normalized 0 - 100
  confidence: number; // 0.0 - 1.0
  relatedIncidentIds: string[];
  explanation: string;
}

export interface RecurrenceAnalysis {
  locationClusterId: string;
  historicalIncidentCount: number;
  repeatedIncidentCount: number;
  recurrenceCount: number;
  recurrenceRate: number;
  recurrenceScore: number;
  failureTier: ChronicFailureTier;
  classification: "low" | "moderate" | "high" | "chronic";
  relatedIncidentIds: string[];
  reopenedCount: number;
  explanation: string;
}

export interface EmergingIssue {
  category: string;
  zoneId?: string;
  locationCluster?: string;
  baselineFrequency: number;
  baselineVolume: number;
  recentFrequency: number;
  recentVolume: number;
  increasePercent: number;
  severity: EmergingSeverity;
  confidence: number;
  explanation: string;
}

export interface RiskFactorItem {
  factor: string;
  rawScore: number; // 0.0 - 1.0
  impactPoints: number; // +N points
  description: string;
}

export interface PredictiveRiskResult {
  locationId?: string;
  incidentId?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  factorBreakdown: {
    frequency: RiskFactorItem;
    velocity: RiskFactorItem;
    recurrence: RiskFactorItem;
    resolutionFailure: RiskFactorItem;
    activePressure: RiskFactorItem;
    sensitiveZone: RiskFactorItem;
  };
  primaryDrivers: string[];
  explanation: string;
}

export interface AIDecisionFeedbackRecord {
  id: string;
  incidentId?: string | null;
  reportId?: string | null;
  operatorId: string;
  decisionType: AIDecisionType;
  aiSuggestedValue: string;
  operatorDecision: string;
  wasAccepted: boolean;
  overrideReason?: string | null;
  category?: string | null;
  correlationScore?: number | null;
  createdAt: string;
}

export interface AIPerformanceMetrics {
  totalDecisions: number;
  acceptedDecisions: number;
  overriddenDecisions: number;
  agreementRate: number; // 0.0 - 1.0
  overrideRate: number; // 0.0 - 1.0
  label: "OPERATOR AGREEMENT METRICS";
  performanceByCategory: Array<{
    category: string;
    total: number;
    accepted: number;
    agreementRate: number;
  }>;
  performanceByDecisionType: Record<
    string,
    { total: number; accepted: number; agreementRate: number }
  >;
}

export interface CityHealthOverview {
  score: number; // 0 - 100
  status: "HEALTHY" | "STABLE" | "AT RISK" | "CRITICAL";
  changeVsBaseline: number; // +4.2%
  factors: {
    activePressure: number;
    criticalHotspotRatio: number;
    resolutionFailureRatio: number;
    slaOverdueRatio: number;
  };
}

export interface CityIntelligenceSnapshot {
  cityHealthScore: number;
  cityHealth: CityHealthOverview;
  activeHotspots: CivicHotspot[];
  criticalHotspots: CivicHotspot[];
  emergingIssues: EmergingIssue[];
  criticalRisks: PredictiveRiskResult[];
  chronicLocations: RecurrenceAnalysis[];
  incidentVelocity: {
    current24h: number;
    baselineDaily: number;
    velocityTrend: VelocityTrend;
    velocityChangePercent: number;
  };
  aiAgreementRate: number;
  aiPerformance: AIPerformanceMetrics;
  generatedAt: string;
}
