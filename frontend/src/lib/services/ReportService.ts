import { ICivicRepository } from "../repositories/ICivicRepository";
import { civicRepository } from "../repositories";
import { correlateSignal, inferCategoryFromText } from "@/lib/ai/correlationEngine";
import { generateCivicEmbedding } from "@/lib/ai/embeddings";
import { aiEngineClient } from "@/lib/ai/AIEngineClient";
import { 
  CitizenReport, 
  Incident, 
  IssueCategory, 
  CorrelationResult 
} from "@/types";

export interface SubmitReportInput {
  description: string;
  category?: IssueCategory;
  latitude: number;
  longitude: number;
  address?: string;
  mediaUrl?: string;
  userName?: string;
  userPhone?: string;
  userId?: string;
  forceNewIncident?: boolean;
  connectToIncidentId?: string;
  source?: 'production' | 'demo' | 'simulation';
}

export interface SubmitReportOutput {
  report: CitizenReport;
  incident: Incident;
  correlation: CorrelationResult;
  isNewIncident: boolean;
  matchReasons?: string[];
  historicalResponseActive?: boolean;
}

/**
 * ReportService orchestrates citizen reporting, AI correlation,
 * and incident lifecycle linkages.
 */
export class ReportService {
  constructor(private repo: ICivicRepository = civicRepository) {}

  async submitReport(input: SubmitReportInput): Promise<SubmitReportOutput> {
    const targetSource = input.source || "production";
    const allIncidents = await this.repo.getIncidents();
    // Source Isolation: Live/production reports only correlate against active production incidents
    // Demo/seed incidents (e.g., CP-1024, CP-1019) never pollute production intake
    const existingIncidents = allIncidents.filter((inc) => {
      const incSource = inc.source || "production";
      return incSource === targetSource;
    });

    // 1. Execute Authentic AI Engine Pipeline (FastAPI /analyze/full with automatic local fallback)
    const aiPipelineResult = await aiEngineClient.analyzeFullPipeline({
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      existingIncidents,
      imageUrl: input.mediaUrl
    });

    const resolvedCategory = input.category || aiPipelineResult.complaint_analysis.category || inferCategoryFromText(input.description);

    // 2. Synthesize Correlation Result
    const aiDup = aiPipelineResult.duplicate;
    const aiPrio = aiPipelineResult.priority;
    const aiAnalysis = aiPipelineResult.complaint_analysis;

    const correlation: CorrelationResult = {
      isCorrelated: aiDup.is_duplicate,
      targetIncidentId: aiDup.matched_incident_id || undefined,
      confidence: aiDup.confidence,
      suggestedPriority: aiPrio.priority_level,
      suggestedPriorityScore: aiPrio.priority_score,
      severityReason: aiAnalysis.context.safety_risk || aiAnalysis.explanation[0] || "AI Triaged Civic Signal",
      candidateIncidents: aiDup.matched_incident_id ? [{
        incident: existingIncidents.find(i => i.id === aiDup.matched_incident_id)!,
        confidence: aiDup.confidence,
        semanticScore: aiDup.signals_used.semantic_similarity,
        geoDistanceMeters: aiDup.signals_used.distance_meters || 0,
        reasons: [aiDup.explanation]
      }] : []
    };

    const reportId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
    let targetIncidentId = input.connectToIncidentId;

    if (!input.forceNewIncident && !targetIncidentId && correlation.isCorrelated && correlation.targetIncidentId) {
      targetIncidentId = correlation.targetIncidentId;
    }

    // 3. Prepare Report & Incident payload
    let isNewIncident = false;
    let newIncident: Incident | undefined = undefined;

    if (!targetIncidentId) {
      isNewIncident = true;
      const newIncidentId = `CP-${Math.floor(1000 + Math.random() * 9000)}`;

      const aiExplanationFactors = [
        {
          title: `AI Intelligence (${aiAnalysis.meta.provider.toUpperCase()})`,
          detail: `Classified as ${resolvedCategory} [Severity: ${aiAnalysis.severity}/5, Urgency: ${aiAnalysis.urgency.toUpperCase()}]. Execution time: ${aiAnalysis.meta.execution_time_ms}ms.`,
          confidence: aiAnalysis.confidence,
          badge: aiAnalysis.meta.fallback ? "Deterministic Fallback" : "Gemini AI"
        },
        ...aiAnalysis.explanation.map((exp, idx) => ({
          title: `Reasoning Factor ${idx + 1}`,
          detail: exp,
          confidence: aiAnalysis.confidence,
          badge: "Context Factor"
        }))
      ];

      newIncident = {
        id: newIncidentId,
        title: `${resolvedCategory} at ${input.address || "Reported Location"}`,
        category: resolvedCategory,
        priority: correlation.suggestedPriority,
        priorityScore: correlation.suggestedPriorityScore,
        priorityReason: correlation.severityReason,
        status: "new",
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address || "Urban Municipal Corridor",
        zone: "Sector Signal Cluster",
        affectedCitizenEstimate: 1,
        connectedReportsCount: 1,
        aiConfidence: aiPipelineResult.overall_confidence,
        beforeEvidenceUrl: input.mediaUrl || undefined,
        aiExplanations: aiExplanationFactors,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            time: "Just now",
            title: "Citizen Signal Registered",
            description: `New ${resolvedCategory} signal intake analyzed by ${aiAnalysis.meta.provider}. Priority: ${correlation.suggestedPriority.toUpperCase()} (${correlation.suggestedPriorityScore}/100).`,
            type: "signal_received",
            actor: input.userName || "Citizen"
          }
        ],
        source: targetSource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      targetIncidentId = newIncidentId;
    }

    const reportEmbedding = generateCivicEmbedding(input.description);

    const report: CitizenReport = {
      id: reportId,
      userId: input.userId || "usr-1",
      userName: input.userName || "Verified Citizen",
      userPhone: input.userPhone,
      incidentId: targetIncidentId,
      description: input.description,
      category: resolvedCategory,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || "Reported Location",
      mediaUrl: input.mediaUrl,
      mediaType: "image",
      status: targetIncidentId ? "correlated" : "received",
      source: targetSource,
      createdAt: new Date().toISOString(),
      embedding: reportEmbedding
    };

    // 3. Atomically persist report and incident linkage
    const atomicResult = await this.repo.processReportSubmissionAtomic({
      report,
      targetIncidentId: isNewIncident ? undefined : targetIncidentId,
      newIncident,
      aiPriorityScore: correlation.suggestedPriorityScore,
      aiPriorityLevel: correlation.suggestedPriority,
      aiPriorityReason: correlation.severityReason
    });

    console.log(`[AI RESULT PERSISTED]`);
    console.log(`incident_id: ${atomicResult.incident.id}`);
    console.log(`category: ${atomicResult.incident.category}`);
    console.log(`priority: ${atomicResult.incident.priority} (${atomicResult.incident.priorityScore}/100)`);
    console.log(`is_new_incident: ${isNewIncident}\n`);

    const historicalResponseActive = !isNewIncident && (
      atomicResult.incident.status === "assigned" || 
      atomicResult.incident.status === "in_progress" || 
      atomicResult.incident.status === "awaiting_verification" ||
      atomicResult.incident.status === "resolved"
    );

    const matchReasons = correlation.candidateIncidents?.[0]?.reasons || [];

    return {
      report: atomicResult.report,
      incident: atomicResult.incident,
      correlation,
      isNewIncident,
      matchReasons,
      historicalResponseActive
    };
  }
}

export const reportService = new ReportService();
