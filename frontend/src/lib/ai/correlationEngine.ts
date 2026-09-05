/**
 * CivicPulse Multi-Factor Signal Correlation Engine
 * Evaluates new incoming citizen reports against existing active civic incidents.
 */

import { Incident, IssueCategory, PriorityLevel, CorrelationResult, AIExplanationFactor } from "@/types";
import { generateCivicEmbedding, computeCosineSimilarity, extractMatchedKeywords } from "./embeddings";
import { calculateHaversineDistance, computeGeoProximityScore } from "./geo";
import { evaluateIncidentPriority } from "./priorityEngine";

import { fuseMultimodalSignals } from "../intelligence/multimodalFusion";

// Correlation threshold for auto-grouping into an existing incident
export const CORRELATION_CONFIDENCE_THRESHOLD = 0.72;

export interface AnalyzeNewSignalParams {
  description: string;
  category?: string;
  latitude: number;
  longitude: number;
  existingIncidents: Incident[];
  mediaUrl?: string | null;
  createdAt?: string | Date;
}

/**
 * Infer category from free text if unspecified or to cross-verify
 */
export function inferCategoryFromText(text: string): IssueCategory {
  const t = text.toLowerCase();
  if (t.includes("water") || t.includes("pipe") || t.includes("leak") || t.includes("drinking water")) return "Water Leakage";
  if (t.includes("drain") || t.includes("sewage") || t.includes("gutter") || t.includes("clog") || t.includes("overflow")) return "Drainage & Sewage";
  if (t.includes("garbage") || t.includes("trash") || t.includes("waste") || t.includes("dump") || t.includes("debris")) return "Garbage & Sanitation";
  if (t.includes("light") || t.includes("lamp") || t.includes("dark") || t.includes("electric") || t.includes("wire") || t.includes("pole")) return "Streetlight & Power";
  if (t.includes("pothole") || t.includes("road") || t.includes("crater") || t.includes("tarmac") || t.includes("asphalt")) return "Road Hazard";
  if (t.includes("safety") || t.includes("unsafe") || t.includes("accident") || t.includes("hazard")) return "Public Safety";
  return "Infrastructure";
}

/**
 * Correlate a new report against all existing active incidents
 */
export function correlateSignal(params: AnalyzeNewSignalParams): CorrelationResult {
  const { description, latitude, longitude, existingIncidents } = params;
  
  const extractedCategory = (params.category as IssueCategory) || inferCategoryFromText(description);
  const newEmbedding = generateCivicEmbedding(description);

  const candidates: CorrelationResult["candidateIncidents"] = [];

  for (const incident of existingIncidents) {
    if (incident.status === "resolved" || incident.status === "closed") continue;

    const incidentText = [
      incident.title,
      incident.address,
      incident.priorityReason,
      ...((incident as any).reports || []).map((r: any) => r.description)
    ].filter(Boolean).join(" ");

    // Execute unified multimodal signal fusion
    const fusion = fuseMultimodalSignals({
      descriptionA: description,
      latA: latitude,
      lngA: longitude,
      categoryA: extractedCategory,
      timeA: params.createdAt || new Date(),
      mediaUrlA: params.mediaUrl,

      descriptionB: incidentText,
      latB: incident.latitude,
      lngB: incident.longitude,
      categoryB: incident.category,
      timeB: incident.createdAt,
      mediaUrlB: incident.beforeEvidenceUrl,
      targetIncidentId: incident.id
    });

    const geoDistanceMeters = calculateHaversineDistance(
      latitude,
      longitude,
      incident.latitude,
      incident.longitude
    );

    const confidence = fusion.confidence;
    const reasons = fusion.explanation.factors;

    const incidentEmbedding = generateCivicEmbedding(incidentText);
    const semanticScore = computeCosineSimilarity(newEmbedding, incidentEmbedding);

    if (confidence >= 0.50 || (geoDistanceMeters <= 400 && semanticScore >= 0.55)) {
      candidates.push({
        incident,
        confidence,
        semanticScore: Math.round(semanticScore * 100) / 100,
        geoDistanceMeters,
        reasons
      });
    }
  }

  // Sort candidates by highest correlation confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = candidates[0];
  const isCorrelated = !!bestMatch && (
    bestMatch.confidence >= CORRELATION_CONFIDENCE_THRESHOLD ||
    (bestMatch.geoDistanceMeters <= 150 && bestMatch.confidence >= 0.65)
  );

  // Calculate suggested priority for this signal / updated incident
  const connectedCount = isCorrelated ? (bestMatch.incident.connectedReportsCount + 1) : 1;
  const priorityEval = evaluateIncidentPriority(
    description,
    extractedCategory,
    connectedCount,
    latitude,
    longitude
  );

  return {
    isCorrelated,
    targetIncidentId: isCorrelated ? bestMatch.incident.id : undefined,
    candidateIncidents: candidates,
    extractedCategory,
    suggestedPriority: priorityEval.priority,
    suggestedPriorityScore: priorityEval.score,
    severityReason: priorityEval.reasonSummary
  };
}
