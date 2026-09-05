"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Layers
} from "lucide-react";
import { DecisionRecommendation, explainDecisionRecommendation } from "@/lib/executive";

interface DecisionDetailModalProps {
  recommendation: DecisionRecommendation | null;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

export function DecisionDetailModal({
  recommendation,
  onClose,
  onDecisionSubmitted,
}: DecisionDetailModalProps) {
  const [dismissReason, setDismissReason] = useState("");
  const [isDismissing, setIsDismissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!recommendation) return null;

  const explanation = explainDecisionRecommendation(recommendation);

  const handleSubmitDecision = async (decision: "ACCEPTED" | "DISMISSED" | "DEFERRED") => {
    if (decision === "DISMISSED" && !dismissReason.trim()) {
      setFeedbackMsg("Please provide an operational rationale when dismissing this recommendation.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/executive/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recommendation.id,
          actionType: recommendation.actionType,
          decision,
          reason: decision === "DISMISSED" ? dismissReason : (decision === "DEFERRED" ? "Deferred 24 hours for reassessment" : undefined),
          targetArea: recommendation.targetArea,
          department: recommendation.department,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onDecisionSubmitted();
        onClose();
      } else {
        setFeedbackMsg(data.error || "Failed to record decision.");
      }
    } catch (e) {
      setFeedbackMsg("Network error submitting decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 font-mono text-xs space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              Executive Decision Briefing &bull; {recommendation.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Department Header */}
        <div className="space-y-1 font-sans">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700 uppercase">
              {recommendation.department}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700 uppercase">
              {recommendation.targetArea}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/40 uppercase">
              {recommendation.urgency} URGENCY
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white pt-1">
            {recommendation.title}
          </h2>
        </div>

        {/* 6 Structured Briefing Questions */}
        <div className="space-y-4 font-sans text-xs">
          
          {/* 1. What is Happening? */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-mono text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
              1. What Is Happening?
            </h4>
            <p className="text-slate-200 leading-relaxed">
              {explanation.whatIsHappening}
            </p>
          </div>

          {/* 2. Why Does It Matter? */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-mono text-[10px] text-amber-400 uppercase font-bold tracking-wider">
              2. Why Does It Matter?
            </h4>
            <p className="text-slate-200 leading-relaxed">
              {explanation.whyItMatters}
            </p>
          </div>

          {/* 3. Supporting Evidence */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-mono text-[10px] text-purple-400 uppercase font-bold tracking-wider">
              3. What Data Supports This?
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
              {explanation.supportingEvidence.map((ev) => (
                <div key={ev.label} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">{ev.label}</span>
                  <span className="text-white font-bold text-xs">{ev.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. What is Recommended & Expected Impact */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
            <h4 className="font-mono text-[10px] text-cyan-300 uppercase font-bold tracking-wider">
              4. What Is Recommended &amp; Expected Impact?
            </h4>
            <p className="text-white font-bold">
              {recommendation.title}
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {recommendation.expectedImpact}
            </p>
          </div>

          {/* 5. What Happens Without Intervention? */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1">
            <h4 className="font-mono text-[10px] text-red-400 uppercase font-bold tracking-wider">
              5. What Happens Without Action?
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {explanation.whatHappensWithoutIntervention}
            </p>
          </div>

          {/* 6. Assumptions and Confidence */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Confidence Rating:</span>
              <strong className="text-emerald-400">{explanation.confidenceRating}</strong>
            </div>
            <div className="text-[9px] text-slate-500 space-y-0.5">
              <span>Key Assumptions:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {explanation.underlyingAssumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Dismiss Reason Input Box (When triggered) */}
        {isDismissing && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-sans">
            <label className="text-xs text-slate-300 font-bold block">
              Required Dismissal Rationale:
            </label>
            <textarea
              rows={2}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="Explain operational reason for dismissal (e.g., Local crew already redirected offline)..."
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Error / Feedback Message */}
        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-mono">
            {feedbackMsg}
          </div>
        )}

        {/* Human Control Security Banner */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>HUMAN DECISION GUARD:</strong> Approval authorizes leadership direction. The platform will not execute municipal dispatches autonomously.
          </span>
        </div>

        {/* Decision Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {!isDismissing ? (
              <button
                type="button"
                onClick={() => setIsDismissing(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors text-xs"
              >
                Dismiss Recommendation
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitDecision("DISMISSED")}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors text-xs"
              >
                Confirm Dismissal
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmitDecision("DEFERRED")}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold transition-colors text-xs flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Defer 24 Hours</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSubmitDecision("ACCEPTED")}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Recommendation</span>
          </button>
        </div>

      </div>
    </div>
  );
}
