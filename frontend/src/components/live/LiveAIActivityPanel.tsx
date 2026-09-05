"use client";

import React from "react";
import { Sparkles, MapPin, Image as ImageIcon, Clock, Tag, Activity } from "lucide-react";
import { AIActivityState } from "@/lib/realtime";

interface LiveAIActivityPanelProps {
  activityStates?: Partial<Record<string, AIActivityState>>;
  className?: string;
}

const ENGINE_CONFIGS = [
  { key: "Semantic", name: "Semantic Similarity Engine", icon: Sparkles, color: "text-blue-400", defaultWeight: "35%" },
  { key: "Geospatial", name: "Geospatial Proximity Engine", icon: MapPin, color: "text-emerald-400", defaultWeight: "30%" },
  { key: "Visual", name: "Visual Evidence Engine", icon: ImageIcon, color: "text-purple-400", defaultWeight: "20%" },
  { key: "Temporal", name: "Temporal Recency Engine", icon: Clock, color: "text-amber-400", defaultWeight: "10%" },
  { key: "Category", name: "Category Classifier Engine", icon: Tag, color: "text-yellow-400", defaultWeight: "5%" },
];

export function LiveAIActivityPanel({ activityStates = {}, className = "" }: LiveAIActivityPanelProps) {
  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Live Multimodal AI Engine Activity
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold">
          5 Deterministic Models Active
        </span>
      </div>

      {/* Engine Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {ENGINE_CONFIGS.map((cfg) => {
          const state = activityStates[cfg.key];
          const Icon = cfg.icon;

          const isProcessing = state?.status === "processing";
          const isMatched = state?.status === "matched";
          const hasData = state && (isProcessing || isMatched || state.confidenceScore !== undefined);

          return (
            <div
              key={cfg.key}
              className={`p-3.5 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                isProcessing
                  ? "bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                  : isMatched
                  ? "bg-purple-950/30 border-purple-500/40"
                  : "bg-slate-950/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${cfg.color}`} />
                <span className="text-[9px] text-slate-500 uppercase">{cfg.defaultWeight} Wt</span>
              </div>

              <div>
                <span className="font-bold text-white block text-[11px] truncate">{cfg.name}</span>
                <span className="text-[9px] text-slate-500 block">
                  {state?.lastProcessedAt
                    ? `Processed ${new Date(state.lastProcessedAt).toLocaleTimeString()}`
                    : "Standby Monitor"}
                </span>
              </div>

              {/* Status and Metric */}
              <div className="pt-2 border-t border-slate-800/80">
                {hasData ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-cyan-300 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      {state.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {state.confidenceScore !== undefined
                        ? `${Math.round(state.confidenceScore * 100)}%`
                        : "--"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>STATUS:</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                      WAITING FOR DATA
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
