"use client";

import React from "react";

// Modular Landing Story Components
import { CivicPulseHero } from "@/components/landing/CivicPulseHero";
import { LiveSystemTelemetry } from "@/components/landing/LiveSystemTelemetry";
import { ProblemArchitecture } from "@/components/landing/ProblemArchitecture";
import { CivicIntelligenceLoop } from "@/components/landing/CivicIntelligenceLoop";
import { AIEngineShowcase } from "@/components/landing/AIEngineShowcase";
import { LiveIncidentStory } from "@/components/landing/LiveIncidentStory";
import { StakeholderGateway } from "@/components/landing/StakeholderGateway";
import { IntelligenceExplainability } from "@/components/landing/IntelligenceExplainability";
import { ResolutionEvidenceStory } from "@/components/landing/ResolutionEvidenceStory";
import { TechnicalArchitecture } from "@/components/landing/TechnicalArchitecture";
import { SystemCapabilities } from "@/components/landing/SystemCapabilities";
import { FinalActionGateway } from "@/components/landing/FinalActionGateway";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="flex-1 bg-void overflow-x-hidden selection:bg-civic-blue selection:text-white font-sans">
      
      {/* 1. CIVICPULSE 3D HERO: React Three Fiber interactive digital twin & editorial positioning */}
      <CivicPulseHero />

      {/* 2. LIVE SYSTEM TELEMETRY: Real prototype metrics queried directly from domain APIs */}
      <LiveSystemTelemetry />

      {/* 3. PROBLEM ARCHITECTURE: Legacy Fragmented Chaos vs Connected CivicPulse System */}
      <ProblemArchitecture />

      {/* 4. THE CIVICPULSE LOOP: Interactive 6-stage operational cycle with direct links */}
      <CivicIntelligenceLoop />

      {/* 4B. AI ENGINE INTERACTIVE SHOWCASE: 3D Multimodal Fusion Core Observatory with Node Inspection */}
      <AIEngineShowcase />

      {/* 5. LIVE INCIDENT STORY: Real connected case file proof fetched from live database */}
      <LiveIncidentStory />

      {/* 6. STAKEHOLDER GATEWAY: 3 distinct portals (Citizen, Operations, Field) */}
      <StakeholderGateway />

      {/* 7. INTELLIGENCE EXPLAINABILITY: Deterministic formulas (Cosine + Haversine + Priority) */}
      <IntelligenceExplainability />

      {/* 8. EVIDENCE-FIRST RESOLUTION: Verified Before & After physical restoration records */}
      <ResolutionEvidenceStory />

      {/* 9. TECHNICAL SYSTEM ARCHITECTURE: 4-layer full-stack design for judges & evaluators */}
      <TechnicalArchitecture />

      {/* 10. SYSTEM CAPABILITIES: Core capabilities backed by active backend state machines */}
      <SystemCapabilities />

      {/* 11. FINAL ACTION GATEWAY: Direct entry into live citizen, ops, and field modules */}
      <FinalActionGateway />

      {/* 12. LANDING FOOTER: Clean minimal footer with live system status indicator */}
      <LandingFooter />

    </main>
  );
}
