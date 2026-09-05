"use client";

import React from "react";
import { 
  X, 
  MapPin, 
  Activity, 
  Flame, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Layers, 
  AlertCircle 
} from "lucide-react";
import { AreaPerformanceProfile } from "@/lib/executive";

interface AreaDossierDrawerProps {
  area: AreaPerformanceProfile | null;
  onClose: () => void;
}

export function AreaDossierDrawer({ area, onClose }: AreaDossierDrawerProps) {
  if (!area) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900/95 border-l border-slate-700/80 shadow-2xl backdrop-blur-2xl p-6 font-mono text-xs overflow-y-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Executive Area Dossier &bull; {area.zone}
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

      {/* Zone Status Banner */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 uppercase text-[10px] font-bold">Operational Status:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-cyan-300 border border-slate-700">
            {area.status.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-300 text-xs">
          <span>Dominant Infrastructure Category:</span>
          <strong className="text-white font-sans">{area.dominantCategory}</strong>
        </div>
      </div>

      {/* 1. CURRENT SITUATION */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
          1. Current Situation
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Total Cases</span>
            <span className="text-lg font-black text-white font-mono">{area.dossier.situation.volume}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Active Backlog</span>
            <span className="text-lg font-black text-amber-400 font-mono">{area.dossier.situation.backlog}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Critical</span>
            <span className="text-lg font-black text-red-400 font-mono">{area.dossier.situation.critical}</span>
          </div>
        </div>
      </div>

      {/* 2. INTAKE TREND & VELOCITY */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
          2. Trend &amp; Surge Velocity
        </span>
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Current 24h Velocity:</span>
            <strong className="text-white font-mono">+{area.dossier.trend.currentVelocity} new reports</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Historical Daily Baseline:</span>
            <strong className="text-slate-300 font-mono">{area.dossier.trend.historicalBaseline} reports/day</strong>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Velocity Surge vs Baseline:</span>
            <strong className={area.dossier.trend.surgePercent > 0 ? "text-cyan-400 font-mono" : "text-slate-400 font-mono"}>
              {area.dossier.trend.surgePercent > 0 ? `+${area.dossier.trend.surgePercent}%` : `${area.dossier.trend.surgePercent}%`}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL PERFORMANCE & SLA */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
          3. Operational Throughput &amp; SLA
        </span>
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Overall Resolution Rate:</span>
            <strong className="text-cyan-400 font-mono">{Math.round(area.dossier.operationalPerformance.resolutionRate * 100)}%</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">On-Time SLA Performance:</span>
            <strong className="text-emerald-400 font-mono">{Math.round(area.dossier.operationalPerformance.slaPerformance * 100)}%</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Citizen Reopened Cases:</span>
            <strong className="text-amber-400 font-mono">{area.dossier.operationalPerformance.reopenedCount}</strong>
          </div>
        </div>
      </div>

      {/* 4. PREDICTIVE SPATIAL INTELLIGENCE */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
          4. Spatial Risk &amp; Hotspots
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Hotspots</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{area.dossier.intelligence.hotspotsCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Chronic Sites</span>
            <span className="text-sm font-bold text-red-400 font-mono">{area.dossier.intelligence.chronicSitesCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">Surges</span>
            <span className="text-sm font-bold text-purple-400 font-mono">{area.dossier.intelligence.emergingPatternsCount}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
