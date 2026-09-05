/**
 * CivicPulse Phase 6 — Human-in-the-Loop AI Feedback Service
 * Ingests operator acceptance/overrides of AI decisions and persists decision telemetry.
 * NO automatic retraining; used for explainable calibration and oversight metrics.
 */

import { prisma } from "@/lib/prisma";
import { AIDecisionFeedbackRecord, AIDecisionType } from "./predictiveTypes";

export const OVERRIDE_REASONS = [
  "Incorrect location correlation",
  "Similar text but different incident",
  "Visual mismatch",
  "Wrong category",
  "Priority adjusted",
  "Operator has additional field information",
  "Other"
] as const;

export interface SubmitFeedbackInput {
  incidentId?: string;
  reportId?: string;
  operatorId: string;
  decisionType: AIDecisionType;
  aiSuggestedValue: string;
  operatorDecision: string;
  wasAccepted: boolean;
  overrideReason?: string;
  category?: string;
  correlationScore?: number;
}

export async function recordAIFeedback(
  input: SubmitFeedbackInput
): Promise<AIDecisionFeedbackRecord> {
  // If overridden, an override reason should be set
  const reason = input.wasAccepted
    ? "Accepted by operator"
    : input.overrideReason || "Operator adjustment without specific reason";

  const created = await prisma.aIDecisionFeedback.create({
    data: {
      incidentId: input.incidentId || null,
      reportId: input.reportId || null,
      operatorId: input.operatorId,
      decisionType: input.decisionType,
      aiSuggestedValue: input.aiSuggestedValue,
      operatorDecision: input.operatorDecision,
      wasAccepted: input.wasAccepted,
      overrideReason: reason,
      category: input.category || null,
      correlationScore: input.correlationScore ?? null,
    },
  });

  return {
    id: created.id,
    incidentId: created.incidentId,
    reportId: created.reportId,
    operatorId: created.operatorId,
    decisionType: created.decisionType as AIDecisionType,
    aiSuggestedValue: created.aiSuggestedValue,
    operatorDecision: created.operatorDecision,
    wasAccepted: created.wasAccepted,
    overrideReason: created.overrideReason,
    category: created.category,
    correlationScore: created.correlationScore,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getFeedbackRecords(filters?: {
  decisionType?: AIDecisionType;
  incidentId?: string;
  limit?: number;
}): Promise<AIDecisionFeedbackRecord[]> {
  const where: any = {};
  if (filters?.decisionType) where.decisionType = filters.decisionType;
  if (filters?.incidentId) where.incidentId = filters.incidentId;

  const records = await prisma.aIDecisionFeedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  });

  return records.map((r) => ({
    id: r.id,
    incidentId: r.incidentId,
    reportId: r.reportId,
    operatorId: r.operatorId,
    decisionType: r.decisionType as AIDecisionType,
    aiSuggestedValue: r.aiSuggestedValue,
    operatorDecision: r.operatorDecision,
    wasAccepted: r.wasAccepted,
    overrideReason: r.overrideReason,
    category: r.category,
    correlationScore: r.correlationScore,
    createdAt: r.createdAt.toISOString(),
  }));
}
