"use client";

import React from "react";
import { MapPin, Flame, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { AreaPerformanceProfile, AreaStatus } from "@/lib/executive";

interface AreaPerformanceGridProps {
  areas: AreaPerformanceProfile[];
  onSelectArea: (area: AreaPerformanceProfile) => void;
  className?: string;
}

export function AreaPerformanceGrid({
  areas,
  onSelectArea,
  className = "",
}: AreaPerformanceGridProps) {
  const getStatusColor = (status: AreaStatus) => {
    switch (status) {
      case "CRITICAL":
        return {
          card: "bg-red-950/20 border-red-500/40 hover:border-red-400",
          badge: "bg-red-950 text-red-300 border-red-500/40",
          title: "text-red-400",
        };
      case "HIGH_PRESSURE":
        return {
          card: "bg-amber-950/20 border-amber-500/40 hover:border-amber-400",
          badge: "bg-amber-950 text-amber-300 border-amber-500/40",
          title: "text-amber-400",
        };
      case "WATCH":
        return {
          card: "bg-yellow-950/10 border-yellow-500/30 hover:border-yellow-400",
          badge: "bg-yellow-950 text-yellow-300 border-yellow-500/40",
          title: "text-yellow-400",
        };
      default:
        return {
          card: "bg-slate-950/60 border-slate-800 hover:border-slate-700",
          badge: "bg-cyan-950 text-cyan-300 border-cyan-500/40",
          title: "text-white",
        };
    }
  };

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-6 font-mono text-xs space-y-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Geographic Sector &amp; Zone Performance Grid
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold">
          Click any zone to open detailed Area Dossier
        </span>
      </div>

      {/* Grid of Zone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {areas.map((a) => {
          const style = getStatusColor(a.status);

          return (
            <div
              key={a.zone}
              onClick={() => onSelectArea(a)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 shadow-md flex flex-col justify-between ${style.card}`}
            >
              {/* Top Title & Status */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold font-sans ${style.title}`}>
                    {a.zone}
                  </h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${style.badge}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block truncate">
                  Dominant: {a.dominantCategory}
                </span>
              </div>

              {/* Key Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Backlog</span>
                  <span className="text-white font-bold text-sm font-mono">{a.activeBacklog}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">24h Surge</span>
                  <span className="text-cyan-400 font-bold text-sm font-mono">
                    {a.dossier.trend.surgePercent > 0 ? `+${a.dossier.trend.surgePercent}%` : `${a.dossier.trend.surgePercent}%`}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">SLA On-Time</span>
                  <span className="text-slate-300 font-mono font-bold">{Math.round(a.slaPerformance * 100)}%</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Hotspots</span>
                  <span className={a.hotspotConcentration > 0 ? "text-amber-400 font-bold font-mono" : "text-slate-600 font-mono"}>
                    {a.hotspotConcentration}
                  </span>
                </div>
              </div>

              {/* Bottom CTA Indicator */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <span className="text-slate-500">
                  {a.incidentVolume} total cases
                </span>
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <span>Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
