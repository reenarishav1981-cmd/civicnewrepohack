"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Info, Sparkles } from "lucide-react";
import { ImpactProjectionResult } from "@/lib/executive";

interface TrajectoryComparisonCardProps {
  projections: ImpactProjectionResult[];
  className?: string;
}

export function TrajectoryComparisonCard({
  projections,
  className = "",
}: TrajectoryComparisonCardProps) {
  const [selectedDeptIdx, setSelectedDeptIdx] = useState(0);

  if (!projections || projections.length === 0) return null;

  const current = projections[selectedDeptIdx] || projections[0];
  const isInsufficient = current.status === "INSUFFICIENT_DATA";

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-6 font-mono text-xs space-y-5 ${className}`}>
      
      {/* Header & Department Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              What Happens If We Do Nothing? &bull; 48-Hour Scenario Modeling
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Deterministic comparative modeling based on recent intake velocity and historical completion throughput.
          </p>
        </div>

        {/* Department Switcher */}
        <select
          value={selectedDeptIdx}
          onChange={(e) => setSelectedDeptIdx(parseInt(e.target.value, 10))}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
        >
          {projections.map((p, idx) => (
            <option key={p.department} value={idx}>
              {p.department}
            </option>
          ))}
        </select>
      </div>

      {isInsufficient ? (
        <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto opacity-70" />
          <h4 className="text-white font-bold text-xs">INSUFFICIENT HISTORICAL DATA</h4>
          <p className="text-slate-400 font-sans text-xs max-w-md mx-auto">
            Fewer than 3 verified incidents recorded for this department. Scenario modeling is withheld to preserve strict data integrity.
          </p>
        </div>
      ) : (
        <>
          {/* Side-by-Side Trajectory Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. CURRENT TRAJECTORY */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-900/60 text-red-200 border border-red-500/30">
                  WITHOUT INTERVENTION
                </span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Escalating Backlog</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Backlog:</span>
                  <span className="text-2xl font-black text-white font-mono">{current.currentBacklog}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Projected 48h Backlog:</span>
                  <span className="text-2xl font-black text-red-400 font-mono">
                    {current.currentTrajectory.backlog48h}
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans text-slate-300 leading-snug">
                {current.currentTrajectory.description}
              </p>

              <div className="pt-2 border-t border-red-900/40 flex justify-between text-[10px] text-slate-400">
                <span>Estimated Overdue SLA Risks:</span>
                <strong className="text-red-300 font-mono">+{current.currentTrajectory.slaRisk48h} cases</strong>
              </div>
            </div>

            {/* 2. INTERVENTION SCENARIO */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-900/60 text-emerald-200 border border-emerald-500/30">
                  WITH CAPACITY INTERVENTION
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Controlled Backlog</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Backlog:</span>
                  <span className="text-2xl font-black text-white font-mono">{current.currentBacklog}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Projected 48h Backlog:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {current.interventionScenario.backlog48h}
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans text-slate-300 leading-snug">
                {current.interventionScenario.description}
              </p>

              <div className="pt-2 border-t border-emerald-900/40 flex justify-between text-[10px] text-slate-400">
                <span>Assumed Scenario Condition:</span>
                <strong className="text-emerald-300 font-mono">{current.interventionScenario.assumedCapacityBoost}</strong>
              </div>
            </div>

          </div>

          {/* Model Confidence and Assumptions Footer */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Model Confidence:</span>
                <strong className="text-cyan-300">{Math.round(current.confidence * 100)}%</strong>
                <span className="text-slate-500">({current.historicalDaysAnalyzed} days rolling history)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                Zero Black-Box ML &bull; 100% Deterministic
              </span>
            </div>

            <p className="text-[10px] text-slate-500 font-sans italic">
              &quot;{current.disclaimer}&quot;
            </p>
          </div>
        </>
      )}

    </div>
  );
}
