"use client";

import React, { useState, useEffect } from "react";
import { Incident } from "@/types";
import { IncidentPredictiveProfile } from "@/lib/predictive/predictiveTypes";
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  RotateCcw, 
  Search, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  Activity,
  Layers
} from "lucide-react";
import { AIOperatorFeedbackModal } from "./AIOperatorFeedbackModal";

interface PredictiveIntelligenceCardProps {
  incident: Incident;
  className?: string;
}

export function PredictiveIntelligenceCard({
  incident,
  className = ""
}: PredictiveIntelligenceCardProps) {
  const [profile, setProfile] = useState<IncidentPredictiveProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPredictiveData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/intelligence/insights/${incident.id}`);
        if (!res.ok) throw new Error("Failed to load predictive assessment");
        const data = await res.json();
        if (isMounted && data.success) {
          setProfile(data.data);
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || "Failed to load intelligence");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPredictiveData();
    return () => { isMounted = false; };
  }, [incident.id]);

  if (isLoading) {
    return (
      <div className={`card-elevated p-6 animate-pulse space-y-4 font-mono-data ${className}`}>
        <div className="flex items-center gap-2 text-xs text-sky-400">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Computing Predictive Risk & Root Cause Hypotheses...</span>
        </div>
        <div className="h-20 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return null;
  }

  const { escalation, priorityRecommendation, associatedPatterns, rootCauseHypotheses, confidence } = profile;

  const getEscalationBadge = (lvl: string) => {
    switch (lvl) {
      case "critical": return "badge-critical text-[10px] uppercase font-bold";
      case "high": return "badge-high text-[10px] uppercase font-bold";
      case "moderate": return "badge-medium text-[10px] uppercase font-bold";
      default: return "badge-low text-[10px] uppercase font-bold";
    }
  };

  return (
    <section 
      className={`card-focal p-6 sm:p-7 space-y-6 font-mono-data ${className}`}
      aria-label="Predictive Civic Intelligence Assessment"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-civic-cyan uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Predictive Intelligence &bull; Evidence-Backed Risk Assessment</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-intelligence text-[10px]">
            EVIDENCE CONFIDENCE: {Math.round(confidence.score * 100)}% ({confidence.level.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Panel 1: Escalation Risk Indicator */}
        <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted font-bold uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-civic-red" />
              Escalation Risk Index
            </span>
            <span className={getEscalationBadge(escalation.level)}>
              {escalation.level} ({Math.round(escalation.score * 100)}%)
            </span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                escalation.score >= 0.75 ? "bg-civic-red" : (escalation.score >= 0.55 ? "bg-amber-400" : "bg-civic-cyan")
              }`}
              style={{ width: `${Math.round(escalation.score * 100)}%` }}
            />
          </div>

          <p className="text-xs text-text-secondary font-sans leading-relaxed">
            {escalation.recommendation}
          </p>

          <div className="pt-2 border-t border-border-subtle space-y-1.5 text-[10px] text-text-muted">
            <div className="font-bold uppercase text-slate-300">Key Risk Contributors:</div>
            {escalation.contributingFactors.slice(0, 3).map((f, i) => (
              <div key={i} className="flex justify-between items-center">
                <span>&bull; {f.factor}</span>
                <span className="text-slate-300 font-bold">+{f.contribution} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Priority Recommendation & Human Governance */}
        <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted font-bold uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              AI Priority Recommendation
            </span>
            <span className="badge-intelligence text-[10px] font-bold">
              SUGGESTED: {priorityRecommendation.recommendedPriority.toUpperCase()} ({priorityRecommendation.score}/100)
            </span>
          </div>

          <p className="text-xs text-text-primary font-sans leading-relaxed">
            {priorityRecommendation.explanation}
          </p>

          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-[11px] text-text-secondary font-sans flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0 mt-0.5" />
              <span>
                <strong>Human Authority Guard:</strong> System recommendations do not overwrite operator priority settings without affirmative supervisory approval.
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Supervisory Action:</span>
              <AIOperatorFeedbackModal
                incidentId={incident.id}
                decisionType="priority"
                aiSuggestedValue={priorityRecommendation.recommendedPriority}
                currentValue={incident.priority}
                category={incident.category}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Recurrence Pattern Banner if detected */}
      {associatedPatterns.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-400 font-mono">
              <RotateCcw className="w-4 h-4" />
              <span>RECURRING INFRASTRUCTURE PATTERN DETECTED</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-[10px] text-amber-300 font-mono font-bold">
              {associatedPatterns[0].suspectedPersistence.toUpperCase()} PATTERN
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {associatedPatterns[0].explanation}
          </p>
        </div>
      )}

      {/* Evidence-Backed Root Cause Hypotheses */}
      {rootCauseHypotheses.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span>Root Cause Hypotheses &amp; Forensic Guidance</span>
          </div>

          <div className="space-y-3">
            {rootCauseHypotheses.map((hyp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-sans text-xs">
                    Hypothesis {idx + 1}: &quot;{hyp.hypothesis}&quot;
                  </span>
                  <span className="badge-intelligence text-[10px]">
                    {Math.round(hyp.confidence * 100)}% Indicator Fit
                  </span>
                </div>

                <div className="space-y-1 text-xs text-text-secondary font-sans">
                  {hyp.supportingEvidence.map((ev, evIdx) => (
                    <p key={evIdx} className="leading-relaxed">&bull; {ev}</p>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[11px] text-sky-300 font-sans flex items-start gap-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Recommended Investigation:</strong> {hyp.recommendedInvestigation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Governance Disclaimer */}
      <div className="p-3 rounded-lg bg-surface-base/60 border border-border-subtle text-[11px] text-text-muted font-sans flex items-start gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-civic-cyan shrink-0 mt-0.5" />
        <span>
          Predictive indicators are deterministically derived from spatial density, recurrence frequency, and cross-category correlation. Hypotheses represent potential systemic indicators requiring physical field inspection.
        </span>
      </div>

    </section>
  );
}

export default PredictiveIntelligenceCard;
