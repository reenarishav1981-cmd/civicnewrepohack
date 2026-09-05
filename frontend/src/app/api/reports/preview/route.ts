import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { correlateSignal, inferCategoryFromText } from "@/lib/ai/correlationEngine";
import { IssueCategory } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, category, latitude, longitude } = body;

    // 1. Validation
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Description must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
    const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Valid numeric latitude and longitude coordinates are required." },
        { status: 400 }
      );
    }

    // 2. Fetch active incidents (Read-Only via repository)
    const existingIncidents = await civicRepository.getIncidents();
    const resolvedCategory = (category as IssueCategory) || inferCategoryFromText(description);

    // 3. Execute Existing Deterministic Correlation Pipeline
    const correlation = correlateSignal({
      description: description.trim(),
      category: resolvedCategory,
      latitude: lat,
      longitude: lng,
      existingIncidents,
      mediaUrl: body.mediaUrl,
    });

    const bestCandidate = correlation.candidateIncidents[0];

    // 4. Return genuine computed output
    return NextResponse.json({
      success: true,
      hasRelatedIncident: correlation.isCorrelated && !!bestCandidate,
      extractedCategory: correlation.extractedCategory,
      suggestedPriority: correlation.suggestedPriority,
      suggestedPriorityScore: correlation.suggestedPriorityScore,
      severityReason: correlation.severityReason,
      candidate: bestCandidate
        ? {
            incidentId: bestCandidate.incident.id,
            title: bestCandidate.incident.title,
            category: bestCandidate.incident.category,
            status: bestCandidate.incident.status,
            zone: bestCandidate.incident.zone,
            connectedReportsCount: bestCandidate.incident.connectedReportsCount,
            confidence: bestCandidate.confidence,
            semanticScore: bestCandidate.semanticScore,
            geoDistanceMeters: bestCandidate.geoDistanceMeters,
            reasons: bestCandidate.reasons,
          }
        : null,
      allCandidates: correlation.candidateIncidents.map((c) => ({
        incidentId: c.incident.id,
        title: c.incident.title,
        confidence: c.confidence,
        semanticScore: c.semanticScore,
        geoDistanceMeters: c.geoDistanceMeters,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze signal correlation." },
      { status: 500 }
    );
  }
}
