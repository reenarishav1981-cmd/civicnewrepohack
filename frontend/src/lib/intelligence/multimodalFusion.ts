/**
 * CivicPulse Multimodal Intelligence Fusion Engine
 * Fuses Geospatial, Semantic, Visual, Category, and Temporal signals into a normalized correlation decision.
 */

import { CorrelationSignal, MultimodalCorrelationResult, CorrelationClassification } from "./types";
import { compareVisualEvidence } from "./visualEvidence";
import { generateCivicEmbedding, computeCosineSimilarity } from "../ai/embeddings";
import { calculateHaversineDistance, computeGeoProximityScore } from "../ai/geo";

export interface FuseSignalsInput {
  descriptionA: string;
  latA: number;
  lngA: number;
  categoryA: string;
  timeA?: string | Date;
  mediaUrlA?: string | null;

  descriptionB: string;
  latB: number;
  lngB: number;
  categoryB: string;
  timeB?: string | Date;
  mediaUrlB?: string | null;

  targetIncidentId?: string;
}

export function computeTemporalProximity(timeA?: string | Date, timeB?: string | Date): { score: number; hoursDiff: number } {
  if (!timeA || !timeB) {
    return { score: 0.8, hoursDiff: 1 }; // Default neutral 1h proximity if unspecified
  }
  const dateA = new Date(timeA).getTime();
  const dateB = new Date(timeB).getTime();
  const hoursDiff = Math.abs(dateA - dateB) / (1000 * 60 * 60);

  // Smooth decay over 72 hours
  const score = Math.max(0, 1 - Math.min(1, hoursDiff / 72));
  return { score: Math.round(score * 100) / 100, hoursDiff: Math.round(hoursDiff * 10) / 10 };
}

export function fuseMultimodalSignals(input: FuseSignalsInput): MultimodalCorrelationResult {
  const {
    descriptionA, latA, lngA, categoryA, timeA, mediaUrlA,
    descriptionB, latB, lngB, categoryB, timeB, mediaUrlB,
    targetIncidentId
  } = input;

  // 1. Geospatial Signal
  const distanceMeters = calculateHaversineDistance(latA, lngA, latB, lngB);
  const geoScore = computeGeoProximityScore(distanceMeters, 650);

  // 2. Semantic Text Signal
  const embA = generateCivicEmbedding(descriptionA);
  const embB = generateCivicEmbedding(descriptionB);
  const semanticScore = computeCosineSimilarity(embA, embB);

  // 3. Visual Evidence Signal
  const visualComparison = compareVisualEvidence(mediaUrlA, mediaUrlB);
  const isVisualAvailable = visualComparison.available;

  // 4. Category Match Signal
  let categoryScore = 0.1;
  if (categoryA.toLowerCase() === categoryB.toLowerCase()) {
    categoryScore = 1.0;
  } else if (
    (categoryA.includes("Water") && categoryB.includes("Drainage")) ||
    (categoryA.includes("Road") && categoryB.includes("Safety"))
  ) {
    categoryScore = 0.4;
  }

  // 5. Temporal Proximity Signal
  const temporal = computeTemporalProximity(timeA, timeB);

  // 6. Dynamic Normalized Weight Distribution
  let wGeo = 0.35;
  let wSemantic = 0.25;
  let wVisual = 0.20;
  let wCategory = 0.10;
  let wTemporal = 0.10;

  if (!isVisualAvailable) {
    // Redistribute the 20% visual weight proportionally across the other 4 signals:
    // Total remaining = 0.80 -> scale factor = 1 / 0.80 = 1.25
    wGeo = 0.35 * 1.25; // 0.4375 (43.75%)
    wSemantic = 0.25 * 1.25; // 0.3125 (31.25%)
    wVisual = 0.0;
    wCategory = 0.10 * 1.25; // 0.1250 (12.50%)
    wTemporal = 0.10 * 1.25; // 0.1250 (12.50%)
  }

  // Compute Signal Objects
  const signals: CorrelationSignal[] = [
    {
      type: "geospatial",
      score: Math.round(geoScore * 100) / 100,
      weight: Math.round(wGeo * 1000) / 1000,
      contribution: Math.round(geoScore * wGeo * 1000) / 10,
      available: true,
      explanation: distanceMeters <= 50
        ? `Immediate spatial proximity: ${distanceMeters}m centroid offset.`
        : `Within cluster proximity radius: ${distanceMeters}m.`
    },
    {
      type: "semantic",
      score: Math.round(semanticScore * 100) / 100,
      weight: Math.round(wSemantic * 1000) / 1000,
      contribution: Math.round(semanticScore * wSemantic * 1000) / 10,
      available: true,
      explanation: semanticScore >= 0.70
        ? `Strong semantic terminology alignment (${Math.round(semanticScore * 100)}% lexical cosine similarity).`
        : `Moderate semantic text overlap (${Math.round(semanticScore * 100)}%).`
    },
    {
      type: "visual",
      score: visualComparison.score,
      weight: Math.round(wVisual * 1000) / 1000,
      contribution: Math.round(visualComparison.score * wVisual * 1000) / 10,
      available: isVisualAvailable,
      explanation: visualComparison.explanation
    },
    {
      type: "category",
      score: categoryScore,
      weight: Math.round(wCategory * 1000) / 1000,
      contribution: Math.round(categoryScore * wCategory * 1000) / 10,
      available: true,
      explanation: categoryScore === 1.0
        ? `Identical civic taxonomy category: ${categoryA}.`
        : `Cross-domain municipal category relationship.`
    },
    {
      type: "temporal",
      score: temporal.score,
      weight: Math.round(wTemporal * 1000) / 1000,
      contribution: Math.round(temporal.score * wTemporal * 1000) / 10,
      available: true,
      explanation: temporal.hoursDiff <= 2
        ? `Concurrent signal: Submitted within ${temporal.hoursDiff} hours.`
        : `Time interval of ${temporal.hoursDiff} hours between report timestamps.`
    }
  ];

  // Calculate Composite Score
  const totalContribution = signals.reduce((sum, s) => sum + s.contribution, 0);
  const overallScore = Math.min(100, Math.max(0, Math.round(totalContribution)));
  const confidence = Math.round((overallScore / 100) * 100) / 100;

  // Classification Thresholds
  let classification: CorrelationClassification = "independent";
  if (overallScore >= 68 || (distanceMeters <= 100 && overallScore >= 65)) {
    classification = "high_probability_duplicate";
  } else if (overallScore >= 50) {
    classification = "possible_related_incident";
  }

  // Generate factors & limitations
  const factors: string[] = [];
  const limitations: string[] = [];

  signals.forEach(s => {
    if (s.available && s.contribution >= 8) {
      factors.push(`+${Math.round(s.contribution)} pts: ${s.explanation}`);
    }
  });

  if (!isVisualAvailable) {
    limitations.push("Citizen submitted without photographic attachment; visual weight proportionally redistributed to geospatial and semantic signals.");
  }
  if (distanceMeters > 500) {
    limitations.push(`Geospatial distance exceeds 500m (${distanceMeters}m offset prevents automatic correlation).`);
  }

  let summary = `Multimodal correlation score of ${overallScore}% (${classification.replace(/_/g, " ")}).`;
  if (classification === "high_probability_duplicate") {
    summary = `High probability duplicate cluster (${overallScore}%): Strong multi-factor convergence across location, domain category, and description.`;
  } else if (classification === "possible_related_incident") {
    summary = `Possible related civic incident (${overallScore}%): Spatial or semantic overlap warrants operational review.`;
  }

  return {
    overallScore,
    confidence,
    classification,
    isCorrelated: classification === "high_probability_duplicate",
    targetIncidentId,
    signals,
    explanation: {
      summary,
      factors,
      limitations
    },
    modelVersion: "v1.2-multimodal-fusion",
    generatedAt: new Date().toISOString()
  };
}
