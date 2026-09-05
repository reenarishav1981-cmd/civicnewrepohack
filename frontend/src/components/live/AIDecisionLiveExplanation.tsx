"use client";

import React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, MapPin, Layers } from "lucide-react";

interface AIDecisionLiveExplanationProps {
  decisionTitle?: string;
  confidenceScore?: number;
  explanationFactors?: Record<string, number>;
  recommendedAction?: string;
  className?: string;
}

export function AIDecisionLiveExplanation({
  decisionTitle = "Correlated Duplicate Signal Detected",
  confidenceScore = 84,
  explanationFactors = {
    "Geospatial Proximity": 35,
    "Semantic Text Similarity": 24,
    "Visual Surface Evidence": 15,
    "Temporal Clustering": 6,
    "Category Fit": 5,
  },
  recommendedAction = "Link to existing active incident and consolidate affected citizen count.",
  className = "",
}: AIDecisionLiveExplanationProps) {
  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Explainable AI Decision Telemetry
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold text-[10px]">
          {confidenceScore}% Multimodal Fit
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] text-slate-400 uppercase font-bold">Inferred Decision:</span>
        <h4 className="text-sm font-bold text-white font-sans">{decisionTitle}</h4>
      </div>

      {/* Point Weight Attribution Bars */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">
          Factor Contribution Attribution (Normalized Points):
        </span>

        <div className="space-y-1.5">
          {Object.entries(explanationFactors).map(([factor, points]) => (
            <div key={factor} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-sans">{factor}</span>
                <span className="text-cyan-400 font-bold">+{points} pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  style={{ width: `${Math.min(100, points * 2.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Action */}
      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[10px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Supervisory Guidance</span>
        </div>
        <p className="text-xs text-slate-200 font-sans">{recommendedAction}</p>
      </div>

    </div>
  );
}
