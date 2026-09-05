"use client";

import React from "react";
import { ShieldAlert, ArrowRight, Sparkles, CheckCircle2, Clock, Flame } from "lucide-react";
import { DecisionRecommendation } from "@/lib/executive";

interface DecisionPriorityBannerProps {
  recommendations: DecisionRecommendation[];
  onSelectRecommendation: (rec: DecisionRecommendation) => void;
  className?: string;
}

export function DecisionPriorityBanner({
  recommendations,
  onSelectRecommendation,
  className = "",
}: DecisionPriorityBannerProps) {
  const pendingRecs = recommendations
    .filter((r) => r.status === "PENDING")
    .slice(0, 3);

  if (pendingRecs.length === 0) {
    return (
      <div className={`p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 font-mono text-xs flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              All Executive Decisions Clear
            </span>
            <p className="text-slate-300 font-sans text-xs">
              Operational capacity currently matches incoming civic demand across all municipal departments.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 uppercase">
          Zero Pending Actions
        </span>
      </div>
    );
  }

  const primary = pendingRecs[0];
  const isCrit = primary.urgency === "CRITICAL";

  return (
    <div className={`rounded-2xl border p-6 font-mono text-xs transition-all shadow-xl space-y-4 ${
      isCrit
        ? "bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border-red-500/50 shadow-red-950/20"
        : "bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/20"
    } ${className}`}>
      
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isCrit ? (
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          ) : (
            <Flame className="w-4 h-4 text-amber-400" />
          )}
          <span className="font-black text-white tracking-wider uppercase text-[11px]">
            TODAY&apos;S PRIMARY DECISION PRIORITY &bull; ACTION REQUIRED
          </span>
          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
            isCrit ? "bg-red-900/80 text-red-200 border-red-500/50" : "bg-amber-900/80 text-amber-200 border-amber-500/50"
          }`}>
            {primary.urgency} URGENCY
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <span className="text-cyan-400 font-bold">{primary.department}</span>
          <span>&bull;</span>
          <span className="text-slate-300">{primary.targetArea}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl font-sans">
          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
            {primary.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {primary.reason}
          </p>

          {/* Evidence Metric Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Active Backlog: <strong className="text-amber-400">{primary.evidence.activeBacklog}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              Velocity Surge: <strong className="text-cyan-400">+{primary.evidence.velocityIncreasePercent}%</strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              SLA Breach: <strong className="text-red-400">{Math.round(primary.evidence.slaBreachRate * 100)}%</strong>
            </span>
            {primary.evidence.criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 font-bold">
                {primary.evidence.criticalCount} Critical Cases
              </span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => onSelectRecommendation(primary)}
          className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold font-mono text-xs transition-all shadow-lg ${
            isCrit
              ? "bg-red-500 hover:bg-red-400 text-slate-950 shadow-red-500/20"
              : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
          }`}
        >
          <span>View Decision &amp; Act</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
