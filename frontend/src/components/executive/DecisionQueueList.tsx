"use client";

import React, { useState } from "react";
import { Sparkles, ShieldAlert, Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { DecisionRecommendation, DecisionStatus } from "@/lib/executive";

interface DecisionQueueListProps {
  recommendations: DecisionRecommendation[];
  onSelectRecommendation: (rec: DecisionRecommendation) => void;
  className?: string;
}

export function DecisionQueueList({
  recommendations,
  onSelectRecommendation,
  className = "",
}: DecisionQueueListProps) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = recommendations.filter((r) => {
    if (filter === "ALL") return true;
    return r.status.toUpperCase() === filter.toUpperCase();
  });

  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case "ACCEPTED":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">APPROVED</span>;
      case "DISMISSED":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-700">DISMISSED</span>;
      case "DEFERRED":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-500/40">DEFERRED 24H</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40 animate-pulse">PENDING ACTION</span>;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === "CRITICAL") return "text-red-400 bg-red-950/60 border-red-500/40";
    if (urgency === "HIGH") return "text-amber-400 bg-amber-950/60 border-amber-500/40";
    if (urgency === "MEDIUM") return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
    return "text-slate-400 bg-slate-900 border-slate-800";
  };

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-6 font-mono text-xs space-y-4 ${className}`}>
      
      {/* Top Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Executive Decision Recommendation Queue
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {["ALL", "PENDING", "ACCEPTED", "DEFERRED", "DISMISSED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                filter === st
                  ? "bg-slate-800 text-cyan-300 border-cyan-500/40 font-bold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* List of Recommendations */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-slate-500">
            No executive recommendations match the selected filter.
          </div>
        ) : (
          filtered.map((rec) => {
            const isPending = rec.status === "PENDING";

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPending
                    ? "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/40 border-slate-900 opacity-75"
                }`}
              >
                <div className="space-y-1.5 max-w-2xl font-sans">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[9px]">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase border ${getUrgencyColor(rec.urgency)}`}>
                      {rec.urgency} URGENCY
                    </span>
                    <span className="text-cyan-400 font-bold">{rec.department}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-slate-400">{rec.targetArea}</span>
                    <span className="text-slate-600">&bull;</span>
                    {getStatusBadge(rec.status)}
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {rec.title}
                  </h4>

                  <p className="text-xs text-slate-400 leading-snug">
                    {rec.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                    <span>Backlog: <strong className="text-white">{rec.evidence.activeBacklog}</strong></span>
                    <span>&bull;</span>
                    <span>Velocity: <strong className="text-cyan-400">+{rec.evidence.velocityIncreasePercent}%</strong></span>
                    <span>&bull;</span>
                    <span>SLA Breach: <strong className="text-amber-400">{Math.round(rec.evidence.slaBreachRate * 100)}%</strong></span>
                    <span>&bull;</span>
                    <span>Confidence: <strong className="text-emerald-400">{Math.round(rec.confidence * 100)}%</strong></span>
                  </div>
                </div>

                {/* Right Review Button */}
                <button
                  type="button"
                  onClick={() => onSelectRecommendation(rec)}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors border border-slate-700 text-xs"
                >
                  <span>Review Decision</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
