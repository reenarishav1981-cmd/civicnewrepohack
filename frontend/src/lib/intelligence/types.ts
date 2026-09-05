/**
 * CivicPulse Multimodal Intelligence Domain Contracts
 */

export type SignalType = "semantic" | "geospatial" | "visual" | "temporal" | "category";

export interface CorrelationSignal {
  type: SignalType;
  score: number; // 0.0 - 1.0
  weight: number; // fraction summing to 1.0
  contribution: number; // score * weight * 100
  available: boolean;
  explanation: string;
}

export type CorrelationClassification =
  | "high_probability_duplicate"
  | "possible_related_incident"
  | "independent";

export interface MultimodalCorrelationResult {
  overallScore: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  classification: CorrelationClassification;
  isCorrelated: boolean;
  targetIncidentId?: string;
  signals: CorrelationSignal[];
  explanation: {
    summary: string;
    factors: string[];
    limitations: string[];
  };
  modelVersion: string;
  generatedAt: string;
}

export type VisualEvidenceStatus =
  | "available"
  | "processing"
  | "analyzed"
  | "unavailable"
  | "unsupported";

export interface VisualEvidenceSignal {
  status: VisualEvidenceStatus;
  mediaUrl?: string;
  featureVector?: number[];
  perceptualHash?: string;
  colorHistogram?: { r: number; g: number; b: number };
  detectedTags?: string[];
  analyzedAt?: string;
}
