/**
 * CivicPulse Predictive Confidence Engine
 * Quantifies observational confidence based on evidence depth, signal agreement, and sample size.
 */

import { IntelligenceConfidence } from "./predictiveTypes";

export interface EvaluateConfidenceParams {
  evidenceCount: number;
  signalAgreement?: number; // 0.0 - 1.0 (defaults to 0.8)
  hasPhotos?: boolean;
  geographicSpreadMeters?: number;
}

export function evaluateConfidence(params: EvaluateConfidenceParams): IntelligenceConfidence {
  const {
    evidenceCount,
    signalAgreement = 0.8,
    hasPhotos = false,
    geographicSpreadMeters = 300
  } = params;

  if (evidenceCount <= 0) {
    return {
      score: 0.15,
      level: "low",
      evidenceCount: 0,
      signalAgreement: 0.0,
      explanation: "Zero observational evidence or historical baseline recorded."
    };
  }

  // 1. Evidence Sample Component (Max 0.45)
  // 1 item = 0.10, 3 items = 0.25, 6+ items = 0.45
  const sampleFactor = Math.min(0.45, Math.max(0.10, (evidenceCount / 7) * 0.45));

  // 2. Signal Agreement Component (Max 0.30)
  const agreementFactor = Math.min(0.30, signalAgreement * 0.30);

  // 3. Ground-Truth Media Bonus (Max 0.15)
  const mediaBonus = hasPhotos ? 0.15 : 0.05;

  // 4. Spatial Compactness Penalty (Max 0.10)
  let spatialFactor = 0.10;
  if (geographicSpreadMeters > 800) {
    spatialFactor = 0.02; // diffused signal
  } else if (geographicSpreadMeters > 400) {
    spatialFactor = 0.06;
  }

  const rawScore = sampleFactor + agreementFactor + mediaBonus + spatialFactor;
  const score = Math.min(1.0, Math.max(0.15, Math.round(rawScore * 100) / 100));

  let level: "low" | "medium" | "high" = "low";
  let explanation = "";

  if (score >= 0.80) {
    level = "high";
    explanation = `High analytical confidence (${Math.round(score * 100)}%): Corroborated across ${evidenceCount} independent observations with strong signal consensus.`;
  } else if (score >= 0.50) {
    level = "medium";
    explanation = `Moderate confidence (${Math.round(score * 100)}%): Backed by ${evidenceCount} reports with acceptable spatial and categorical alignment.`;
  } else {
    level = "low";
    explanation = `Preliminary confidence (${Math.round(score * 100)}%): Limited observational depth (${evidenceCount} signal); additional verification recommended.`;
  }

  return {
    score,
    level,
    evidenceCount,
    signalAgreement: Math.round(signalAgreement * 100) / 100,
    explanation
  };
}
