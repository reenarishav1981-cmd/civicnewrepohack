"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import { Incident, CitizenReport, FieldTeam, FieldTask } from "@/types";

// Modular Dossier Components
import { SituationSummary } from "@/components/dossier/SituationSummary";
import { IntelligenceExplanation } from "@/components/dossier/IntelligenceExplanation";
import { SignalCorrelationEvidence } from "@/components/dossier/SignalCorrelationEvidence";
import { IncidentSpatialContext } from "@/components/dossier/IncidentSpatialContext";
import { OperationalResponsePanel } from "@/components/dossier/OperationalResponsePanel";
import { TaskProgressionHUD } from "@/components/dossier/TaskProgressionHUD";
import { EvidenceGallery } from "@/components/dossier/EvidenceGallery";
import { CitizenEvidenceGallery } from "@/components/dossier/CitizenEvidenceGallery";
import { PredictiveIntelligenceCard } from "@/components/dossier/PredictiveIntelligenceCard";
import { IncidentActivityTimeline } from "@/components/dossier/IncidentActivityTimeline";

export default function IncidentCaseFilePage() {
  const params = useParams();
  const incidentId = params?.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [connectedReports, setConnectedReports] = useState<CitizenReport[]>([]);
  const [assignedTeam, setAssignedTeam] = useState<FieldTeam | null>(null);
  const [allTeams, setAllTeams] = useState<FieldTeam[]>([]);
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidentData = useCallback(async () => {
    if (!incidentId) return;
    try {
      const [incRes, teamsRes] = await Promise.all([
        fetch(`/api/incidents/${incidentId}`),
        fetch("/api/teams")
      ]);

      const incData = await incRes.json();
      const teamsData = await teamsRes.json();

      if (incData.success && incData.data.incident) {
        setIncident(incData.data.incident);
        setConnectedReports(incData.data.connectedReports || []);
        setAssignedTeam(incData.data.assignedTeam || null);
        setTasks(incData.data.tasks || []);
      } else {
        setErrorMsg("Incident case file not found in operational database.");
      }

      if (teamsData.success) {
        setAllTeams(teamsData.data);
      }
    } catch (e) {
      console.error("Dossier fetch error:", e);
      setErrorMsg("Failed to synchronize with city telemetry.");
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchIncidentData();
  }, [fetchIncidentData]);

  // Handle Team Assignment Action
  const handleAssignTeam = async (teamId: string, notes: string, workerId?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!incidentId) return { success: false, error: "No incident specified" };
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          workerId,
          instructions: notes || `Priority dispatch for incident ${incidentId}.`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        let errorMsg = data.error || "Assignment failed due to a server error.";
        if (res.status === 401) errorMsg = "Authentication required. Please sign in as an Operator.";
        if (res.status === 403) errorMsg = "You do not have permission to dispatch field teams.";
        if (res.status === 404) errorMsg = "Incident or field team not found.";
        if (res.status === 409) errorMsg = data.error || "This team or incident is no longer available for assignment. Please refresh the data.";
        return { success: false, error: errorMsg };
      }

      await fetchIncidentData();
      return { success: true, data: data.data };
    } catch (e: any) {
      console.error("Assignment dispatch error:", e);
      return { success: false, error: e.message || "Network connection error while dispatching squad." };
    } finally {
      setIsDispatching(false);
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="flex-1 bg-canvas flex flex-col items-center justify-center p-12 text-text-secondary font-mono-data text-xs space-y-3">
        <Sparkles className="w-6 h-6 animate-spin text-civic-cyan" />
        <p>Loading Incident Investigation Dossier...</p>
      </div>
    );
  }

  // Error / Not Found State
  if (errorMsg || !incident) {
    return (
      <div className="flex-1 bg-canvas flex flex-col items-center justify-center p-12 text-center font-mono-data text-xs space-y-4">
        <div className="p-4 rounded-full bg-surface-elevated border border-border-subtle">
          <AlertTriangle className="w-8 h-8 text-civic-amber" />
        </div>
        <h2 className="text-base font-bold text-white font-sans">Incident Not Found</h2>
        <p className="text-text-secondary font-sans max-w-sm">
          {errorMsg || "The requested incident identifier does not match any record in the active database."}
        </p>
        <Link href="/operations" className="btn-secondary py-2.5 px-4 text-xs font-bold font-sans">
          &larr; Return to Operations Command
        </Link>
      </div>
    );
  }

  const activeTask = tasks.length > 0 ? tasks[0] : null;

  return (
    <div className="flex-1 bg-canvas py-8 px-4 sm:px-6 lg:px-8 space-y-8 font-sans selection:bg-civic-blue selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* BREADCRUMB & IDENTITY HEADER                                              */}
        {/* ========================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle font-mono-data text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <Link href="/operations" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Operations Command</span>
            </Link>
            <span>/</span>
            <span>Case Files</span>
            <span>/</span>
            <span className="text-civic-cyan font-bold">{incident.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text-muted text-[11px]">
              LAST SYNC: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 1: INCIDENT SITUATION SUMMARY                                     */}
        {/* ========================================================================= */}
        <SituationSummary incident={incident} />

        {/* ========================================================================= */}
        {/* 2-COLUMN WORKSPACE: EVIDENCE HIERARCHY & OPERATIONAL RESPONSE             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 COLS: GROUND TRUTH EVIDENCE FIRST, FOLLOWED BY AI INTELLIGENCE     */}
          <div className="lg:col-span-7 space-y-8">
            {/* Primary Section 1: Citizen-Submitted Ground Truth Photographic Evidence */}
            <CitizenEvidenceGallery
              reports={connectedReports}
              incidentId={incident.id}
            />

            {/* Primary Section 2: Multi-Signal Incident Constellation */}
            <SignalCorrelationEvidence
              incident={incident}
              connectedReports={connectedReports}
            />

            {/* Primary Section 3: Physical Work Evidence (Before / After Comparison) */}
            <EvidenceGallery incident={incident} />

            {/* Secondary Section 4: Explainable Decision & Priority Intelligence */}
            <IntelligenceExplanation incident={incident} />

            {/* Secondary Section 5: Predictive Intelligence, Escalation Risk & Root Causes */}
            <PredictiveIntelligenceCard incident={incident} />

            {/* Section 6: Chronological Audit Trail Ledger */}
            <IncidentActivityTimeline incident={incident} />
          </div>

          {/* RIGHT 5 COLS: OPERATIONAL DISPATCH & SPATIAL CONTEXT                     */}
          <div className="lg:col-span-5 space-y-8">
            {/* Section 6: Squad Assignment & Dispatch Panel */}
            <OperationalResponsePanel
              incident={incident}
              assignedTeam={assignedTeam}
              allTeams={allTeams}
              onAssignTeam={handleAssignTeam}
              isDispatching={isDispatching}
              onRefresh={fetchIncidentData}
            />

            {/* Section 7: 5-Stage Field Task Progression HUD */}
            <TaskProgressionHUD
              incident={incident}
              activeTask={activeTask}
            />

            {/* Section 8: Spatial GIS & Anchor Proximity Context */}
            <IncidentSpatialContext incident={incident} />
          </div>

        </div>

      </div>
    </div>
  );
}
