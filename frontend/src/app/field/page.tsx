"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FieldTask, Incident, FieldTeam, TaskStatus, User as UserType } from "@/types";
import { HardHat, Radio, Sparkles, CheckCircle2, AlertCircle, LogIn, ArrowRight } from "lucide-react";

// Modular Field Components
import { ActiveTaskCommandCard } from "@/components/field/ActiveTaskCommandCard";
import { FieldTaskQueue } from "@/components/field/FieldTaskQueue";
import { TaskExecutionHUD } from "@/components/field/TaskExecutionHUD";
import { NextActionPanel } from "@/components/field/NextActionPanel";
import { IncidentFieldBriefing } from "@/components/field/IncidentFieldBriefing";
import { FieldLocationPanel } from "@/components/field/FieldLocationPanel";
import { OperationalInstructionCard } from "@/components/field/OperationalInstructionCard";
import { FieldEvidencePanel } from "@/components/field/FieldEvidencePanel";
import { FieldTaskTimeline } from "@/components/field/FieldTaskTimeline";

export default function FieldWorkerHubPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [incident, setIncident] = useState<Incident | null>(null);
  const [team, setTeam] = useState<FieldTeam | null>(null);
  const [workerNotes, setWorkerNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch squad tasks and active incident context for the authenticated worker
  const fetchFieldData = useCallback(async () => {
    try {
      // 1. Verify authenticated session
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        setAuthError("Authentication required. Please sign in with your Field Worker credentials.");
        setIsLoading(false);
        return;
      }
      const meData = await meRes.json();
      if (!meData.success || !meData.data?.user) {
        setAuthError("Authentication required. Please sign in as a Field Worker.");
        setIsLoading(false);
        return;
      }

      const user = meData.data.user;
      setCurrentUser(user);
      setAuthError(null);

      // 2. Fetch tasks scoped exclusively to the authenticated worker
      const [tasksRes, teamsRes] = await Promise.all([
        fetch("/api/tasks?myTasks=true"),
        fetch("/api/teams")
      ]);

      const tasksData = await tasksRes.json();
      const teamsData = await teamsRes.json();

      let loadedTasks: FieldTask[] = [];
      if (tasksData.success && tasksData.data) {
        loadedTasks = tasksData.data;
        setTasks(loadedTasks);
      }

      let allTeams: FieldTeam[] = [];
      if (teamsData.success && teamsData.data) {
        allTeams = teamsData.data;
      }

      if (loadedTasks.length > 0) {
        const currentTask = loadedTasks.find((t: FieldTask) => t.id === selectedTaskId) || loadedTasks[0];
        setSelectedTaskId(currentTask.id);
        setWorkerNotes(currentTask.workerNotes || "");

        // Associate team
        const matchedTeam = allTeams.find((t: FieldTeam) => t.id === currentTask.teamId) ||
                            allTeams.find((t: FieldTeam) => t.leaderName === user.name) || null;
        setTeam(matchedTeam);

        // Fetch parent incident details
        if (currentTask.incidentId) {
          const incRes = await fetch(`/api/incidents/${currentTask.incidentId}`);
          const incData = await incRes.json();
          if (incData.success && incData.data?.incident) {
            setIncident(incData.data.incident);
          }
        }
      } else {
        // No active tasks
        const fallbackTeam = allTeams.find((t: FieldTeam) => t.leaderName === user.name) || allTeams[0] || null;
        setTeam(fallbackTeam);
        setIncident(null);
      }
    } catch (e) {
      console.error("Field sync error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    fetchFieldData();
  }, [fetchFieldData]);

  // Handle task status progression
  const handleUpdateStatus = async (nextStatus: TaskStatus, proofUrl?: string) => {
    const currentTask = tasks.find((t) => t.id === selectedTaskId);
    if (!currentTask) return;

    setIsUpdating(true);
    setStatusFeedback(null);

    try {
      const res = await fetch(`/api/tasks/${currentTask.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          workerNotes,
          afterPhotoUrl: proofUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusFeedback(`Operational stage updated to ${nextStatus.toUpperCase().replace("_", " ")}.`);
        setTimeout(() => setStatusFeedback(null), 5000);
        await fetchFieldData();
      } else {
        throw new Error(data.error || "Failed to update task state.");
      }
    } catch (e: any) {
      console.error("Status update error:", e);
      throw e;
    } finally {
      setIsUpdating(false);
    }
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || (tasks.length > 0 ? tasks[0] : null);

  // Unauthenticated Barrier
  if (authError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-canvas flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-surface-elevated border border-border-subtle shadow-2xl space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-civic-amber/15 border border-civic-amber/30 text-civic-amber flex items-center justify-center mx-auto">
            <HardHat className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-white">Field Operations Authentication Required</h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              Please sign in with your verified municipal worker account to access your assigned site work orders.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all font-sans"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Field Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-canvas flex flex-col items-center justify-center p-12 text-text-secondary font-mono-data text-xs space-y-3">
        <Sparkles className="w-6 h-6 animate-spin text-civic-cyan" />
        <p>Connecting to Field Operations Dispatch...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-canvas py-6 px-4 sm:px-6 lg:px-8 space-y-6 font-sans selection:bg-civic-green selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* WORKER IDENTITY & SQUAD PROFILE BANNER                                    */}
        {/* ========================================================================= */}
        <header className="card-elevated p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-data text-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-civic-green/15 border border-civic-green/30 flex items-center justify-center text-civic-green shrink-0">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white font-sans">
                  {currentUser?.name || "Field Worker"}
                </h1>
                <span className="badge-resolved text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-civic-green animate-pulse" />
                  ON DUTY
                </span>
              </div>
              <p className="text-xs text-text-secondary font-sans">
                {currentUser?.email || "worker@civicpulse.gov.in"} &bull; {team ? team.name : "Assigned Municipal Response Squad"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge-neutral text-[10px] hidden sm:inline-flex">
              {tasks.length} Assigned {tasks.length === 1 ? "Order" : "Orders"}
            </span>
            <span className="text-[10px] text-civic-green font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Live Telemetry Linked
            </span>
          </div>
        </header>

        {/* Status Toast Announcement */}
        {statusFeedback && (
          <div 
            className="p-3.5 rounded-xl bg-civic-green/15 border border-civic-green/40 text-civic-green font-mono-data text-xs flex items-center gap-2 animate-in fade-in"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2-COLUMN WORKSPACE: TASK COMMAND & OPERATIONAL EXECUTION                  */}
        {/* ========================================================================= */}
        {activeTask ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT 5 COLS: ACTIVE COMMAND CARD & QUEUE */}
            <div className="lg:col-span-5 space-y-6">
              <ActiveTaskCommandCard
                task={activeTask}
                incident={incident}
              />

              <FieldTaskQueue
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
              />

              <FieldTaskTimeline
                task={activeTask}
              />
            </div>

            {/* RIGHT 7 COLS: EXECUTION HUD, ACTION PANEL & BRIEFING */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary Next Action */}
              <NextActionPanel
                currentStatus={activeTask.status}
                workerNotes={workerNotes}
                onWorkerNotesChange={setWorkerNotes}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={isUpdating}
              />

              {/* 5-Stage Stepper HUD */}
              <TaskExecutionHUD
                status={activeTask.status}
              />

              {/* Work Site Location & GPS */}
              <FieldLocationPanel
                task={activeTask}
              />

              {/* Command Directives Card */}
              <OperationalInstructionCard
                task={activeTask}
                team={team}
              />

              {/* Incident Context Briefing */}
              <IncidentFieldBriefing
                incident={incident}
              />

              {/* Photographic Evidence Records */}
              <FieldEvidencePanel
                task={activeTask}
                incident={incident}
              />
            </div>

          </div>
        ) : (
          <div className="card-quiet p-12 text-center text-xs text-text-muted font-sans space-y-4 max-w-lg mx-auto rounded-2xl border border-dashed border-border-subtle">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <HardHat className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white font-sans">NO ACTIVE FIELD ASSIGNMENTS</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Logged in as <strong className="text-white">{currentUser?.name}</strong>. You currently have no pending work orders assigned to your queue. New emergency dispatches will alert here automatically.
              </p>
            </div>
            <div className="pt-2">
              <span className="badge-resolved text-[11px] font-mono-data py-1 px-3">
                SYSTEM STATUS: AVAILABLE &amp; ON DUTY
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}