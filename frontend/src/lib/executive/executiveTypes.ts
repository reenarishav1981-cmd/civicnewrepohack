/**
 * CivicPulse Phase 8 — Executive Decision & Impact Intelligence Types
 * Strictly typed, deterministic contracts for senior municipal leadership decision support.
 */

import { CityHealthOverview } from "../intelligence/predictiveTypes";

export type DepartmentStatus = "CRITICAL" | "NEEDS_ATTENTION" | "HEALTHY" | "STABLE";

export type AreaStatus = "STABLE" | "WATCH" | "HIGH_PRESSURE" | "CRITICAL";

export type PressureLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type RecommendationActionType =
  | "DEPLOY_ADDITIONAL_TEAM"
  | "PRIORITIZE_CRITICAL_CLUSTER"
  | "ESCALATE_DEPARTMENT_REVIEW"
  | "MONITOR_EMERGING_PATTERN"
  | "REBALANCE_OPERATIONAL_LOAD";

export type RecommendationUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DecisionStatus = "PENDING" | "ACCEPTED" | "DISMISSED" | "DEFERRED";

export interface DepartmentPerformanceProfile {
  department: string;
  categoryNames: string[];
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  resolutionRate: number; // 0.0 - 1.0
  averageResolutionHours: number;
  slaComplianceRate: number; // 0.0 - 1.0
  slaBreachRate: number; // 0.0 - 1.0
  reopenRate: number; // 0.0 - 1.0
  incidentVelocity: number; // 24h volume
  activeBacklog: number;
  criticalIncidentCount: number;
  status: DepartmentStatus;
}

export interface AreaPerformanceProfile {
  zone: string;
  incidentVolume: number;
  incidentDensity: number;
  incidentVelocity: number;
  hotspotConcentration: number;
  chronicRecurrenceCount: number;
  activeBacklog: number;
  slaPerformance: number; // 0.0 - 1.0 on-time resolution
  criticalIncidentPressure: number;
  status: AreaStatus;
  dominantCategory: string;
  coordinates?: { lat: number; lng: number };
  dossier: {
    situation: {
      volume: number;
      backlog: number;
      critical: number;
    };
    trend: {
      currentVelocity: number;
      historicalBaseline: number;
      surgePercent: number;
    };
    operationalPerformance: {
      resolutionRate: number;
      slaPerformance: number;
      reopenedCount: number;
    };
    intelligence: {
      hotspotsCount: number;
      chronicSitesCount: number;
      emergingPatternsCount: number;
    };
  };
}

export interface PressureFactorItem {
  factor: string;
  contribution: number; // points e.g. +18
  normalizedValue: number; // 0.0 - 1.0
  description: string;
}

export interface ResourcePressureResult {
  score: number; // 0 - 100
  level: PressureLevel;
  activeBacklog: number;
  incidentVelocity: number;
  slaBreachRate: number;
  teamUtilization: number;
  criticalIncidentCount: number;
  recurrencePressure: number;
  factors: PressureFactorItem[];
  explanation: string;
}

export interface DecisionRecommendation {
  id: string;
  actionType: RecommendationActionType;
  urgency: RecommendationUrgency;
  targetArea: string;
  department: string;
  title: string;
  reason: string;
  evidence: {
    activeBacklog: number;
    velocityIncreasePercent: number;
    slaBreachRate: number;
    criticalCount: number;
    chronicSitesCount?: number;
  };
  expectedImpact: string;
  confidence: number; // 0.0 - 1.0
  humanApprovalRequired: true; // Hardcoded true: system never automatically executes
  status: DecisionStatus;
  createdAt: string;
}

export interface ScenarioPoint {
  hoursFromNow: number;
  projectedBacklog: number;
  projectedSLARisks: number;
}

export interface ImpactProjectionResult {
  department: string;
  targetArea?: string;
  currentBacklog: number;
  status: "AVAILABLE" | "INSUFFICIENT_DATA";
  confidence: number; // 0.0 - 1.0
  historicalDaysAnalyzed: number;
  disclaimer: string;
  currentTrajectory: {
    scenarioName: "CURRENT_TRAJECTORY";
    description: string;
    points: ScenarioPoint[];
    backlog48h: number;
    slaRisk48h: number;
  };
  interventionScenario: {
    scenarioName: "INTERVENTION_SCENARIO";
    description: string;
    points: ScenarioPoint[];
    backlog48h: number;
    slaRisk48h: number;
    assumedCapacityBoost: string;
  };
}

export interface ExecutiveExplanation {
  recommendationId: string;
  whatIsHappening: string;
  whyItMatters: string;
  supportingEvidence: Array<{ label: string; value: string | number }>;
  whatIsRecommended: string;
  whatHappensWithoutIntervention: string;
  underlyingAssumptions: string[];
  confidenceRating: string;
}

export interface ExecutiveIntelligenceSnapshot {
  generatedAt: string;
  cityHealth: CityHealthOverview;
  operationalPressure: ResourcePressureResult;
  departments: DepartmentPerformanceProfile[];
  areas: AreaPerformanceProfile[];
  recommendations: DecisionRecommendation[];
  projections: ImpactProjectionResult[];
}
