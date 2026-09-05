import React from "react";
import Link from "next/link";
import { CitizenReport, Incident } from "@/types";
import { CheckCircle2, ArrowRight, Radio, MapPin, Clock, Plus, Layers, AlertCircle, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubmissionReceiptProps {
  report: CitizenReport;
  incident?: Incident;
  connectedIncidentId?: string;
  isNewIncident?: boolean;
  matchReasons?: string[];
  historicalResponseActive?: boolean;
  onReset: () => void;
  className?: string;
}

export function SubmissionReceipt({
  report,
  incident,
  connectedIncidentId,
  isNewIncident = true,
  matchReasons = [],
  historicalResponseActive = false,
  onReset,
  className = "",
}: SubmissionReceiptProps) {
  const incidentId = connectedIncidentId || report.incidentId;
  const incidentStatus = incident?.status ? incident.status.toUpperCase() : (isNewIncident ? "NEW / UNASSIGNED" : "UNDER INVESTIGATION");

  return (
    <div className={`card-elevated p-6 sm:p-8 space-y-6 font-mono-data text-xs max-w-xl mx-auto text-left animate-in fade-in duration-200 ${className}`}>
      
      {/* Top Header Badge */}
      <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
        <div className={`p-2.5 rounded-full ${isNewIncident ? "bg-civic-green/15 text-civic-green border border-civic-green/30" : "bg-sky-500/15 text-sky-400 border border-sky-500/30"}`}>
          {isNewIncident ? <CheckCircle2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-base font-bold text-white font-sans">
            {isNewIncident ? "New Canonical Incident Formed" : "Report Linked to Existing Incident"}
          </h2>
          <p className="text-text-secondary text-xs font-sans">
            {isNewIncident 
              ? "New case file opened in the municipal operations queue." 
              : "Observation correlated with an active community incident cluster."}
          </p>
        </div>
      </div>

      {/* Historical Response / Merger Alert Banner */}
      {!isNewIncident && (
        <div className={`p-4 rounded-xl border space-y-1.5 font-sans ${historicalResponseActive ? "bg-amber-950/40 border-amber-500/40 text-amber-200" : "bg-sky-950/40 border-sky-500/40 text-sky-200"}`}>
          <div className="flex items-center gap-2 font-mono-data text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{historicalResponseActive ? "Supplemental Evidence Linked" : "Multi-Signal Fusion"}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {historicalResponseActive 
              ? `This report has been added as supplemental evidence to an existing operational incident (${incidentId}). An existing field response was already active before this report was received.`
              : `Your report has been correlated into active case file ${incidentId}. Multiple citizen signals have been clustered to accelerate municipal response.`}
          </p>
        </div>
      )}

      {/* Structured Telemetry Receipt Box */}
      <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-3">
        
        <div className="flex items-center justify-between">
          <span className="text-text-muted uppercase text-[10px] font-bold">Report ID (Citizen Observation):</span>
          <span className="text-civic-cyan font-bold text-sm tracking-wider">{report.id}</span>
        </div>

        {incidentId && (
          <div className="flex items-center justify-between border-t border-border-subtle pt-2">
            <span className="text-text-muted uppercase text-[10px] font-bold">Canonical Incident (Municipal Case):</span>
            <span className="badge-intelligence text-xs font-bold">{incidentId}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-muted uppercase text-[10px] font-bold">Current Case Status:</span>
          <span className={`text-[10px] font-bold font-mono-data px-2 py-0.5 rounded border ${
            incidentStatus.includes("RESOLVED") 
              ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
              : (incidentStatus.includes("NEW") 
                ? "bg-sky-950 text-sky-400 border-sky-500/40" 
                : "bg-amber-950 text-amber-400 border-amber-500/40")
          }`}>
            {incidentStatus}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-muted uppercase text-[10px] font-bold">Decision Type:</span>
          <span className="text-white font-mono-data">{isNewIncident ? "NEW INCIDENT CREATED" : "MERGED AS SUPPLEMENTAL EVIDENCE"}</span>
        </div>

        {matchReasons.length > 0 && (
          <div className="border-t border-border-subtle pt-2 space-y-1">
            <span className="text-text-muted uppercase text-[10px] font-bold block">Correlation Factors:</span>
            <div className="flex flex-wrap gap-1">
              {matchReasons.map((r, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-border-subtle font-sans">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-muted uppercase text-[10px] font-bold">Category:</span>
          <span className="text-white font-sans">{report.category}</span>
        </div>

        {incident && (
          <div className="border-t border-border-subtle pt-2.5 pb-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-civic-cyan font-bold text-[11px]">
                <Radio className="w-3.5 h-3.5 text-civic-cyan animate-pulse" />
                <span>✦ AI ENGINE AUDIT TRAIL</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                PRIORITY: {incident.priorityScore} / 100
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated/70 border border-border-subtle/80 space-y-1 font-sans text-[11px] text-text-secondary">
              <div className="flex justify-between">
                <span>AI Confidence: <strong className="text-white">{Math.round((incident.aiConfidence || 0.9) * 100)}%</strong></span>
                <span>Severity Tier: <strong className="text-white uppercase">{incident.priority}</strong></span>
              </div>
              {incident.priorityReason && (
                <p className="text-[10px] text-text-muted italic truncate">
                  "{incident.priorityReason}"
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-muted uppercase text-[10px] font-bold">Reported Location:</span>
          <span className="text-white font-sans truncate max-w-xs">{report.address}</span>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
          <span className="text-text-muted uppercase text-[10px] font-bold">Timestamp:</span>
          <span className="text-white">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          href={`/track/${report.id}`}
          className="btn-primary w-full sm:w-auto flex-1 py-3 text-xs font-bold font-sans flex items-center justify-center gap-1.5"
        >
          <Compass className="w-4 h-4" />
          <span>Track Resolution Progress</span>
        </Link>

        {incidentId && (
          <Link
            href={`/operations/incidents/${incidentId}`}
            className="btn-secondary w-full sm:w-auto flex-1 py-3 text-xs font-bold font-sans flex items-center justify-center gap-1.5"
          >
            <span>Open Ops Case File</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        <Button
          variant="secondary"
          onClick={onReset}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="w-full sm:w-auto py-3 text-xs font-bold font-sans"
        >
          Submit Another
        </Button>
      </div>

    </div>
  );
}

export default SubmissionReceipt;
