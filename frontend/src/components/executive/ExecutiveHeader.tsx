"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, Flame, Sparkles, Layers, RefreshCw, Radio } from "lucide-react";
import { ResourcePressureResult } from "@/lib/executive";
import { CityHealthOverview } from "@/lib/intelligence";

interface ExecutiveHeaderProps {
  cityHealth?: CityHealthOverview;
  pressure?: ResourcePressureResult;
  pendingDecisionsCount?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ExecutiveHeader({
  cityHealth,
  pressure,
  pendingDecisionsCount = 0,
  onRefresh,
  isLoading = false,
}: ExecutiveHeaderProps) {
  const healthScore = cityHealth?.score ?? 82;
  const healthStatus = cityHealth?.status ?? "STABLE";
  const pressureScore = pressure?.score ?? 64;
  const pressureLevel = pressure?.level ?? "MODERATE";

  const getHealthColor = (status: string) => {
    if (status === "HEALTHY") return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
    if (status === "STABLE") return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
    if (status === "AT RISK") return "text-amber-400 bg-amber-950/60 border-amber-500/40";
    return "text-red-400 bg-red-950/60 border-red-500/40";
  };

  const getPressureColor = (level: string) => {
    if (level === "CRITICAL") return "text-red-400 bg-red-950/60 border-red-500/40";
    if (level === "HIGH") return "text-amber-400 bg-amber-950/60 border-amber-500/40";
    if (level === "MODERATE") return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
    return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
  };

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-16 z-30 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Title & Municipal Hierarchy */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold tracking-widest text-cyan-400 uppercase text-[10px]">
              CITY EXECUTIVE INTELLIGENCE &bull; SURAT MUNICIPAL CORPORATION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
            Executive Decision &amp; Impact Cockpit
          </h1>
        </div>

        {/* Right High-Level Status Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* City Health Badge */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 shadow-sm">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">City Health</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white font-mono">{healthScore}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getHealthColor(healthStatus)}`}>
                  {healthStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Pressure Badge */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Operational Pressure</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white font-mono">{pressureScore}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getPressureColor(pressureLevel)}`}>
                  {pressureLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Active Decisions Pending */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Active Decisions</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white font-mono">{pendingDecisionsCount}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                  ACTION REQUIRED
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links & Refresh */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh Executive Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            )}

            <Link
              href="/operations/live"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Ops</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
