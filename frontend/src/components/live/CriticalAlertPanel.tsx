"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, AlertTriangle, ArrowRight, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { CriticalAlertPayload } from "@/lib/realtime";

interface CriticalAlertPanelProps {
  alerts: CriticalAlertPayload[];
  className?: string;
}

export function CriticalAlertPanel({ alerts, className = "" }: CriticalAlertPanelProps) {
  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Critical Operational Alerts &amp; SLA Sentinel
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-bold">
          {alerts.length} Active Alerts
        </span>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-60" />
            <span>All systems nominal. Zero unresolved critical escalations.</span>
          </div>
        ) : (
          alerts.map((al) => {
            const isCrit = al.severity === "CRITICAL";

            return (
              <div
                key={al.alertId}
                className={`p-4 rounded-xl border space-y-2 transition-all ${
                  isCrit
                    ? "bg-red-950/20 border-red-500/40"
                    : "bg-amber-950/20 border-amber-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isCrit ? "bg-red-900/80 text-red-200" : "bg-amber-900/80 text-amber-200"
                      }`}
                    >
                      {al.severity} ALERT
                    </span>
                    <span className="text-white font-bold text-[11px] truncate max-w-[200px]">
                      {al.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(al.timestamp).toLocaleTimeString()}</span>
                  </span>
                </div>

                <p className="text-xs font-sans text-slate-300 leading-snug">
                  {al.reason}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1 text-[10px]">
                  <div className="text-cyan-400 font-bold uppercase flex items-center gap-1">
                    <span>Recommended Action:</span>
                  </div>
                  <div className="text-slate-300 font-sans">{al.recommendedAction}</div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[220px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{al.location}</span>
                  </span>

                  {al.linkedIncidentId && (
                    <Link
                      href={`/operations/incidents/${al.linkedIncidentId}`}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Case {al.linkedIncidentId}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
