/**
 * CivicPulse Phase 8 — Central Executive Intelligence Service
 * Orchestrates multi-engine calculations into a unified ExecutiveIntelligenceSnapshot.
 * Manages human approval workflows and audit trails in prisma.executiveDecision.
 */

import { prisma } from "../prisma";
import { civicRepository } from "../repositories";
import { generateCityIntelligenceSnapshot, detectCivicHotspots, detectEmergingIssues, detectRecurrencePatterns } from "../intelligence";
import { realtimeEventBus } from "../realtime";
import { 
  ExecutiveIntelligenceSnapshot, 
  DecisionRecommendation, 
  DecisionStatus,
  RecommendationActionType
} from "./executiveTypes";
import { analyzeDepartmentPerformance } from "./departmentPerformanceEngine";
import { analyzeAreaPerformance } from "./areaPerformanceEngine";
import { calculateResourcePressure } from "./resourcePressureEngine";
import { generateDecisionRecommendations } from "./decisionRecommendationEngine";
import { generateAllImpactProjections } from "./impactProjectionEngine";

export class ExecutiveIntelligenceService {
  /**
   * Builds the comprehensive Executive Intelligence Snapshot
   */
  public async getExecutiveSnapshot(): Promise<ExecutiveIntelligenceSnapshot> {
    const [incidents, reports, teams, cityHealthSnapshot] = await Promise.all([
      civicRepository.getIncidents(),
      civicRepository.getReports(),
      civicRepository.getTeams(),
      generateCityIntelligenceSnapshot(),
    ]);

    const hotspots = detectCivicHotspots(incidents, reports);
    const emerging = detectEmergingIssues(incidents, reports);
    const recurrence = detectRecurrencePatterns(incidents);

    const departments = analyzeDepartmentPerformance(incidents);
    const areas = analyzeAreaPerformance(incidents, reports, hotspots, recurrence, emerging);
    const operationalPressure = calculateResourcePressure(incidents, teams, recurrence);
    const baseRecommendations = generateDecisionRecommendations(departments, areas, operationalPressure, hotspots, emerging, teams);
    const projections = generateAllImpactProjections(incidents);

    // Synchronize recommendation status with existing database decisions
    const pastDecisions = await prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const decisionMap = new Map<string, string>();
    pastDecisions.forEach((d) => {
      if (!decisionMap.has(d.recommendationId)) {
        decisionMap.set(d.recommendationId, d.decision);
      }
    });

    const recommendations = baseRecommendations.map((r) => {
      const dec = decisionMap.get(r.id);
      if (dec === "ACCEPTED" || dec === "DISMISSED" || dec === "DEFERRED") {
        return { ...r, status: dec as DecisionStatus };
      }
      return r;
    });

    return {
      generatedAt: new Date().toISOString(),
      cityHealth: cityHealthSnapshot.cityHealth,
      operationalPressure,
      departments,
      areas,
      recommendations,
      projections,
    };
  }

  /**
   * Records an explicit human executive decision in the database audit ledger
   * STRICT GUARD: Recording an executive decision does NOT execute operational changes.
   */
  public async recordDecision(params: {
    recommendationId: string;
    actionType: RecommendationActionType;
    decision: "ACCEPTED" | "DISMISSED" | "DEFERRED";
    reason?: string;
    actorId: string;
    actorName?: string;
    targetArea?: string;
    department?: string;
    metadata?: Record<string, any>;
  }) {
    const record = await prisma.executiveDecision.create({
      data: {
        recommendationId: params.recommendationId,
        actionType: params.actionType,
        targetArea: params.targetArea,
        department: params.department,
        decision: params.decision,
        reason: params.reason || null,
        actorId: params.actorId,
        actorName: params.actorName || "Municipal Executive",
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    // Append to ActivityLog audit trail
    await prisma.activityLog.create({
      data: {
        actorId: params.actorId,
        action: `Executive Decision: ${params.decision}`,
        entityType: "EXECUTIVE_DECISION",
        entityId: record.id,
        metadataJson: JSON.stringify({
          recommendationId: params.recommendationId,
          actionType: params.actionType,
          reason: params.reason,
          targetArea: params.targetArea,
        }),
      },
    });

    // Asynchronously emit an informational real-time telemetry event
    try {
      realtimeEventBus.publish({
        eventId: `EVT-EXEC-${record.id}`,
        eventType: "DEMO_SIMULATION_EVENT", // compatible existing event pipe
        timestamp: new Date().toISOString(),
        source: "production",
        actor: { id: params.actorId, name: params.actorName || "Municipal Executive", role: "operator" },
        entityId: record.id,
        payload: {
          type: "EXECUTIVE_DECISION_RECORDED",
          recommendationId: params.recommendationId,
          decision: params.decision,
          actionType: params.actionType,
          reason: params.reason,
        },
      });
    } catch (_) {}

    return record;
  }

  /**
   * Retrieves historical executive decisions audit trail
   */
  public async getDecisionHistory(limit: number = 50) {
    return prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const executiveIntelligenceService = new ExecutiveIntelligenceService();
