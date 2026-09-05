"use client";

import React from "react";
import Link from "next/link";
import { 
  X, 
  ExternalLink, 
  Flame, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  UserCheck, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Layers
} from "lucide-react";
import { Incident } from "@/types";

interface IncidentMiniDossierProps {
  incident: Incident | null;
  onClose: () => void;
  isDemo?: boolean;
}

export function IncidentMiniDossier({ incident, onClose, isDemo = false }: IncidentMiniDossierProps) {
  if (!incident) return null;

  const isCritical = incident.priority === "critical" || (incident.priorityScore && incident.priorityScore >= 75);
  const isResolved = incident.status === "resolved" || incident.status === "closed";

  return (
    <div className="absolute right-4 top-20 z-40 w-84 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-xl p-5 font-mono text-xs space-y-4 animate-in slide-in-from-right-4 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? "bg-red-400 animate-ping" : (isResolved ? "bg-emerald-400" : "bg-sky-400")}`} />
          <span className="font-bold text-white uppercase tracking-wider">{incident.id}</span>
          {isDemo && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-[9px] text-amber-300 font-bold">
              DEMO
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Category */}
      <div className="space-y-1 font-sans">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
            {incident.category}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            isCritical ? "bg-red-950 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-300"
          }`}>
            {incident.priority} PRIORITY
          </span>
        </div>
        <h4 className="text-sm font-bold text-white pt-1 leading-snug">{incident.title}</h4>
      </div>

      {/* Key Metric Ledger */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400">Current Status:</span>
          <span className="text-white font-bold uppercase">{incident.status.replace("_", " ")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Priority Score:</span>
          <span className="text-cyan-400 font-bold">{incident.priorityScore || 60}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">AI Confidence:</span>
          <span className="text-emerald-400 font-bold">
            {incident.aiConfidence ? `${Math.round(incident.aiConfidence * 100)}%` : "84%"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Location:</span>
          <span className="text-slate-200 font-sans truncate max-w-[180px] text-right">
            {incident.address || incident.zone || "Central Surat"}
          </span>
        </div>
        {incident.assignedTeamName && (
          <div className="flex justify-between pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Assigned Team:</span>
            <span className="text-amber-400 font-bold">{incident.assignedTeamName}</span>
          </div>
        )}
      </div>

      {/* Action Links */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Link
          href={`/operations/incidents/${incident.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
        >
          <span>Open Full Dossier</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/operations/intelligence"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Inspect Predictive Intelligence"
        >
          <Layers className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
