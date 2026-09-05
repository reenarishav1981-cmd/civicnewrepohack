"use client";

import React from "react";
import { Activity, ShieldAlert } from "lucide-react";

export function HeroTelemetryHUD() {
  return (
    <div
      className="absolute bottom-6 right-6 pointer-events-none z-30"
      style={{
        transformStyle: "preserve-3d",
        transform: "translateZ(160px)",
      }}
    >
      <div 
        className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl flex items-center gap-4 text-xs font-mono select-none"
        style={{
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        <div>
          <div className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>Active Incidents</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-white">12</span>
            <span className="text-[11px] text-red-400 font-bold">&uarr; 2</span>
          </div>
          <div className="text-[9.5px] text-slate-400 font-sans mt-0.5">
            Requiring Attention
          </div>
        </div>

        {/* Dynamic Sparkline Bars */}
        <div className="flex items-end gap-1 h-8 pl-2 border-l border-slate-800">
          <div className="w-1.5 bg-red-500/40 rounded-t h-3" />
          <div className="w-1.5 bg-red-500/50 rounded-t h-4" />
          <div className="w-1.5 bg-red-500/60 rounded-t h-5" />
          <div className="w-1.5 bg-red-500/70 rounded-t h-4" />
          <div className="w-1.5 bg-red-500/85 rounded-t h-7" />
          <div className="w-1.5 bg-red-500 rounded-t h-8 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </div>
      </div>
    </div>
  );
}

export default HeroTelemetryHUD;
