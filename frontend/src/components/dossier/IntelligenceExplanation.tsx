import React from "react";
import { Incident } from "@/types";
import { Cpu, Sparkles } from "lucide-react";

interface IntelligenceExplanationProps {
  incident: Incident;
  className?: string;
}

export function IntelligenceExplanation({ incident, className = "" }: IntelligenceExplanationProps) {
  const isCritical = incident.priorityScore >= 80;
  const isHigh = incident.priorityScore >= 60 && incident.priorityScore < 80;

  // Determine provider info from first explanation factor
  const firstExp = incident.aiExplanations && incident.aiExplanations.length > 0 ? incident.aiExplanations[0] : null;
  const isFallback = firstExp?.badge?.toLowerCase().includes("fallback") || firstExp?.title?.toLowerCase().includes("fallback");
  const providerName = isFallback ? "Rule-Based Deterministic Engine" : (firstExp ? "Gemini AI" : "Civic Intelligence");

  return (
    <section className={`card-elevated p-6 sm:p-7 space-y-5 font-mono-data ${className}`} aria-label="Intelligence Explainability Panel">
      
      {/* Top Banner: CIVICPULSE AI INTELLIGENCE */}
      <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-civic-cyan animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">✦ CIVICPULSE AI INTELLIGENCE</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isFallback 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
          }`}>
            {isFallback ? "AI FALLBACK MODE" : "LIVE GEMINI ENGINE"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-[11px] font-sans border-t border-border-subtle/50">
          <div>
            <span className="text-text-muted text-[10px] block">Provider</span>
            <span className="font-bold text-white">{providerName}</span>
          </div>
          <div>
            <span className="text-text-muted text-[10px] block">Category Triaged</span>
            <span className="font-bold text-civic-cyan">{incident.category}</span>
          </div>
          <div>
            <span className="text-text-muted text-[10px] block">Engine Certainty</span>
            <span className="font-bold text-civic-green">{Math.round((incident.aiConfidence || 0.9) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-civic-cyan" />
          <span>Why The System Prioritized This Incident</span>
        </div>
        <span className={`font-bold ${isCritical ? "text-civic-red" : isHigh ? "text-amber-400" : "text-civic-cyan"}`}>
          PRIORITY: {incident.priorityScore} / 100
        </span>
      </div>

      {/* Priority Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-sans text-text-secondary">
          <span>Priority Scoring Tier: <strong className="text-white uppercase">{incident.priority}</strong></span>
          <span className="font-bold text-civic-cyan">{incident.priorityScore} / 100</span>
        </div>
        <div className="w-full h-2.5 bg-surface-base rounded-full overflow-hidden border border-border-subtle/60 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? "bg-civic-red" : isHigh ? "bg-amber-400" : "bg-civic-cyan"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, incident.priorityScore))}%` }}
          />
        </div>
      </div>

      {/* Structured Explainability Factors */}
      <div className="space-y-3 pt-1">
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-sans">
          Decision Factors & Justification:
        </div>

        {incident.aiExplanations && incident.aiExplanations.length > 0 ? (
          incident.aiExplanations.map((exp, idx) => {
            const confidencePct = Math.min(100, Math.max(15, Math.round(exp.confidence * 100)));
            return (
              <div key={idx} className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-2">
                {/* Top Row: Factor Name & Badge */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-civic-cyan">0{idx + 1}</span>
                    <span className="font-bold text-white font-sans">{exp.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    exp.badge?.toLowerCase().includes("fallback")
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      : "bg-surface-elevated text-text-secondary border-border-subtle"
                  }`}>
                    {exp.badge || `Certainty: ${confidencePct}%`}
                  </span>
                </div>

                {/* Explanation Detail */}
                <p className="text-xs text-text-secondary font-sans leading-relaxed">
                  {exp.detail}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle text-xs text-text-secondary font-sans leading-relaxed">
            {incident.priorityReason || "Priority computed using deterministic multi-factor rules combining vocabulary hazard detection, signal velocity, and sensitive anchor proximity."}
          </div>
        )}
      </div>

      {/* Transparency Footnote */}
      <div className="p-3 rounded-lg bg-surface-base/60 border border-border-subtle text-[11px] text-text-muted font-sans flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-civic-cyan shrink-0 mt-0.5" />
        <span>
          {isFallback
            ? "Transparent Audit: Executed via CivicPulse's deterministic fallback engine. All factor weights are mathematically auditable."
            : "Transparent Audit: Evaluated via Google Gemini multi-modal reasoning and GIS spatial correlation."}
        </span>
      </div>

    </section>
  );
}

export default IntelligenceExplanation;
