import React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Compass, FileText, Layers } from "lucide-react";

export function IntelligenceExplainability() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
            Explainable AI Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Intelligence You Can Audit &amp; Explain
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            No black-box hallucinating models. CivicPulse uses deterministic mathematical vectorization and spatial formulas that municipal officials can transparently defend in court or council hearings.
          </p>
        </div>

        {/* 2 Big Formula Breakdown Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono-data text-xs">
          
          {/* Formula 1: Signal Correlation Composite */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-base border border-border-medium space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 font-bold text-civic-cyan uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Correlation Confidence Formula</span>
              </div>
              <span className="badge-intelligence text-[10px]">Threshold: &ge; 72%</span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">1. Semantic Text Similarity</strong>
                  <span className="text-[11px] text-text-secondary">Cosine distance between report &amp; incident vector embeddings</span>
                </div>
                <span className="text-civic-cyan font-bold font-mono-data text-sm">40%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">2. Geographic Spatial Proximity</strong>
                  <span className="text-[11px] text-text-secondary">Haversine spherical distance evaluated across a 650m radius</span>
                </div>
                <span className="text-civic-cyan font-bold font-mono-data text-sm">40%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">3. Domain Category Match</strong>
                  <span className="text-[11px] text-text-secondary">Exact category match (1.0x) vs adjacent infrastructure (0.4x)</span>
                </div>
                <span className="text-civic-cyan font-bold font-mono-data text-sm">20%</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted font-sans leading-relaxed">
              When composite confidence meets or exceeds 0.72 (72%), incoming signals are automatically linked to the existing incident rather than spawning duplicate dispatch tickets.
            </p>
          </div>

          {/* Formula 2: Dynamic Priority Scoring */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-base border border-border-medium space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 font-bold text-civic-red uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Priority Scoring Formula (0 - 100)</span>
              </div>
              <span className="badge-critical text-[10px]">Max: 100 pts</span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">1. Hazard Severity Vocabulary</strong>
                  <span className="text-[11px] text-text-secondary">Safety keywords (fatal, spark, burst, injured, crater)</span>
                </div>
                <span className="text-civic-red font-bold font-mono-data text-sm">Max 35 pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">2. Signal Surge Volume</strong>
                  <span className="text-[11px] text-text-secondary">Logarithmic multiplier scaling with community signal count</span>
                </div>
                <span className="text-civic-red font-bold font-mono-data text-sm">Max 30 pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">3. Sensitive Anchor Proximity</strong>
                  <span className="text-[11px] text-text-secondary">Proximity to schools, hospitals, transit, and market zones</span>
                </div>
                <span className="text-civic-red font-bold font-mono-data text-sm">Max 25 pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">4. Time Aging Escalation</strong>
                  <span className="text-[11px] text-text-secondary">Escalation points for unassigned aging hazards</span>
                </div>
                <span className="text-civic-red font-bold font-mono-data text-sm">Max 10 pts</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default IntelligenceExplainability;
