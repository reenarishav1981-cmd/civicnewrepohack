"use client";

import React, { useState, useRef, useEffect } from "react";
import { RealtimeEvent } from "@/lib/realtime";
import { 
  Radio, 
  Activity, 
  Filter, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ShieldAlert,
  ArrowDown
} from "lucide-react";

interface LiveEventStreamProps {
  events: RealtimeEvent[];
  className?: string;
}

export function LiveEventStream({ events, className = "" }: LiveEventStreamProps) {
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const streamEndRef = useRef<HTMLDivElement>(null);

  const filteredEvents = events.filter((e) => {
    if (filterSource !== "all" && e.source !== filterSource) return false;
    if (filterType !== "all" && !e.eventType.includes(filterType.toUpperCase())) return false;
    return true;
  });

  const getEventIcon = (type: string) => {
    if (type.includes("ALERT") || type.includes("ESCALAT")) return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
    if (type.includes("HOTSPOT")) return <Flame className="w-3.5 h-3.5 text-amber-400" />;
    if (type.includes("AI")) return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    if (type.includes("RESOLV")) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
  };

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs flex flex-col h-[520px] ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Live Telemetry Event Stream
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">
          {filteredEvents.length} Events Logged
        </span>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 text-[11px]">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
        >
          <option value="all">All Sources</option>
          <option value="production">Real Production</option>
          <option value="simulation">Demo Simulation</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
        >
          <option value="all">All Event Types</option>
          <option value="INCIDENT">Incidents</option>
          <option value="WORKER">Field Crews</option>
          <option value="AI">AI Processing</option>
          <option value="ALERT">Alerts</option>
        </select>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Waiting for live events...
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const isSim = evt.source === "simulation";
            const timeStr = new Date(evt.timestamp).toLocaleTimeString();

            return (
              <div
                key={evt.eventId || idx}
                className={`p-3 rounded-xl border transition-all animate-in fade-in-50 slide-in-from-top-1 duration-300 space-y-1.5 ${
                  isSim
                    ? "bg-pink-950/20 border-pink-500/40 text-pink-200"
                    : "bg-slate-950/70 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    {getEventIcon(evt.eventType)}
                    <span className="text-white">{evt.eventType.replace(/_/g, " ")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isSim
                          ? "bg-pink-900/60 text-pink-300 border border-pink-500/40"
                          : "bg-cyan-950 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {isSim ? "DEMO EVENT" : "REAL EVENT"}
                    </span>
                    <span className="text-slate-500">{timeStr}</span>
                  </div>
                </div>

                <p className="text-xs font-sans text-slate-200 leading-snug">
                  {evt.payload?.description ||
                    evt.payload?.title ||
                    evt.payload?.reason ||
                    `${evt.eventType} for ${evt.entityId || "system"}`}
                </p>

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Actor: <strong className="text-slate-400">{evt.actor?.name || "CivicPulse Core"}</strong></span>
                  <span>ID: <strong className="text-slate-400">{evt.entityId || evt.eventId}</strong></span>
                </div>
              </div>
            );
          })
        )}
        <div ref={streamEndRef} />
      </div>

    </div>
  );
}
