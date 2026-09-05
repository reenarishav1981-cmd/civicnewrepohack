"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck } from "lucide-react";

interface LiveCityHealthProps {
  score?: number;
  status?: string;
  trendDelta?: number | null; // e.g. +4.2 or null
  className?: string;
}

export function LiveCityHealth({
  score = 82,
  status = "STABLE",
  trendDelta = 4.2,
  className = "",
}: LiveCityHealthProps) {
  const getStatusColor = (st: string) => {
    if (st === "HEALTHY") return "text-emerald-400 bg-emerald-950/80 border-emerald-500/40";
    if (st === "STABLE") return "text-cyan-400 bg-cyan-950/80 border-cyan-500/40";
    if (st === "AT RISK") return "text-amber-400 bg-amber-950/80 border-amber-500/40";
    return "text-red-400 bg-red-950/80 border-red-500/40";
  };

  return (
    <div className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 font-mono text-xs ${className}`}>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            City Operational Health
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{score}</span>
          <span className="text-slate-500 text-xs">/ 100</span>

          {trendDelta !== null && trendDelta !== undefined ? (
            <span
              className={`text-[10px] font-bold flex items-center gap-0.5 ml-2 ${
                trendDelta > 0 ? "text-emerald-400" : trendDelta < 0 ? "text-red-400" : "text-slate-400"
              }`}
            >
              {trendDelta > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : trendDelta < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{trendDelta > 0 ? `+${trendDelta}%` : `${trendDelta}%`} (30d)</span>
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 ml-2">INSUFFICIENT TREND DATA</span>
          )}
        </div>
      </div>

    </div>
  );
}
