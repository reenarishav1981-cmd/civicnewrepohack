"use client";

import React, { useState } from "react";
import { CheckCircle2, Edit3, X, AlertCircle, ShieldCheck } from "lucide-react";
import { OVERRIDE_REASONS } from "@/lib/intelligence/aiFeedbackService";

interface AIOperatorFeedbackModalProps {
  incidentId: string;
  reportId?: string;
  decisionType: "correlation" | "priority" | "category" | "risk" | "hotspot";
  aiSuggestedValue: string;
  currentValue?: string;
  category?: string;
  correlationScore?: number;
  onFeedbackSubmitted?: () => void;
}

export function AIOperatorFeedbackModal({
  incidentId,
  reportId,
  decisionType,
  aiSuggestedValue,
  currentValue,
  category,
  correlationScore,
  onFeedbackSubmitted,
}: AIOperatorFeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);
  const [operatorDecision, setOperatorDecision] = useState(currentValue || aiSuggestedValue);
  const [overrideReason, setOverrideReason] = useState<string>(OVERRIDE_REASONS[0]);
  const [customNotes, setCustomNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (accepted: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        incidentId,
        reportId: reportId || undefined,
        decisionType,
        aiSuggestedValue,
        operatorDecision: accepted ? aiSuggestedValue : operatorDecision,
        wasAccepted: accepted,
        overrideReason: accepted ? undefined : `${overrideReason}${customNotes ? `: ${customNotes}` : ""}`,
        category,
        correlationScore,
      };

      const res = await fetch("/api/intelligence/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record operator feedback");
      }

      setSuccessMessage(
        accepted
          ? "AI recommendation affirmatively verified."
          : "Operator override telemetry recorded successfully."
      );

      setTimeout(() => {
        setIsOpen(false);
        setSuccessMessage(null);
        if (onFeedbackSubmitted) onFeedbackSubmitted();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(e.message || "Network error submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs">
      <button
        type="button"
        onClick={() => {
          setIsAccepted(true);
          handleSubmit(true);
        }}
        disabled={isSubmitting}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold transition-all disabled:opacity-50"
        title="Affirmatively accept AI assessment"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Accept AI</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setIsAccepted(false);
          setIsOpen(true);
        }}
        disabled={isSubmitting}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition-all"
        title="Override AI assessment with operator rationale"
      >
        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
        <span>Override</span>
      </button>

      {/* Override Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 font-sans text-slate-100">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Human-in-the-Loop Override</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400 font-mono text-[10px] uppercase">AI Assessment:</div>
              <div className="text-white font-mono font-bold">{aiSuggestedValue}</div>
            </div>

            {/* Operator replacement decision */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                Operator Decision:
              </label>
              <input
                type="text"
                value={operatorDecision}
                onChange={(e) => setOperatorDecision(e.target.value)}
                placeholder="Enter correct operator determination..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Override Reason Dropdown */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                Reason for Override:
              </label>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              >
                {OVERRIDE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                Field Evidence / Operational Notes (Optional):
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                placeholder="Specific physical or field context observed..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Status Messages */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !operatorDecision.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
              >
                {isSubmitting ? "Recording..." : "Confirm Override"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
