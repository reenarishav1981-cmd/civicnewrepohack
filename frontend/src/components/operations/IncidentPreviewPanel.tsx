"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Incident, FieldTeam, FieldTask } from "@/types";
import { TelemetryBadge } from "@/components/foundation/TelemetryBadge";
import { Button } from "@/components/ui/Button";
import { 
  MapPin, 
  Users, 
  Cpu, 
  Truck, 
  Send, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  HardHat,
  Radio,
  Clock
} from "lucide-react";

interface IncidentPreviewPanelProps {
  incident: Incident | null;
  assignedTeam?: FieldTeam | null;
  allTeams: FieldTeam[];
  onAssignTeam: (teamId: string, notes: string, workerId?: string) => Promise<{ success: boolean; data?: any; error?: string } | void>;
  isDispatching?: boolean;
  onClose?: () => void;
  className?: string;
}

export function IncidentPreviewPanel({
  incident,
  assignedTeam,
  allTeams,
  onAssignTeam,
  isDispatching = false,
  onClose,
  className = "",
}: IncidentPreviewPanelProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<{ task?: FieldTask; team?: FieldTeam } | null>(null);

  // Auto-select first available team and worker when teams change or incident changes
  useEffect(() => {
    setErrorMessage(null);
    setSuccessPayload(null);
    const firstAvailable = allTeams.find(t => t.status === "available");
    const activeTeam = firstAvailable || (allTeams.length > 0 ? allTeams[0] : null);
    if (activeTeam) {
      setSelectedTeamId(activeTeam.id);
      const availMember = activeTeam.members?.find(m => m.isAvailable !== false);
      setSelectedWorkerId(availMember ? availMember.id : (activeTeam.leaderId || ""));
    }
  }, [incident?.id, allTeams]);

  const handleSelectTeam = (team: FieldTeam) => {
    if (team.status !== "available") return;
    setSelectedTeamId(team.id);
    const availMember = team.members?.find(m => m.isAvailable !== false);
    setSelectedWorkerId(availMember ? availMember.id : (team.leaderId || ""));
  };

  if (!incident) {
    return (
      <aside 
        className={`flex flex-col items-center justify-center p-8 bg-surface-base border-l border-border-subtle text-center text-text-muted font-mono-data text-xs ${className}`}
      >
        <div className="p-4 rounded-full bg-surface-elevated border border-border-subtle mb-3">
          <MapPin className="w-6 h-6 text-civic-cyan opacity-50" />
        </div>
        <p className="font-bold text-text-primary text-sm font-sans mb-1">No Incident Selected</p>
        <p className="text-text-secondary text-[11px] font-sans max-w-xs">
          Select an incident cluster from the queue or spatial canvas to inspect its operational preview.
        </p>
      </aside>
    );
  }

  const handleDispatch = async () => {
    if (!selectedTeamId) {
      setErrorMessage("Please select an available response team.");
      return;
    }

    const team = allTeams.find(t => t.id === selectedTeamId);
    if (team && team.status !== "available") {
      setErrorMessage(`Team '${team.name}' is currently ${team.status.toUpperCase()} and cannot be assigned.`);
      return;
    }

    setErrorMessage(null);
    try {
      const result: any = await onAssignTeam(selectedTeamId, dispatchNotes, selectedWorkerId || undefined);
      if (result && !result.success) {
        setErrorMessage(result.error || "Failed to dispatch squad.");
        setSuccessPayload(null);
      } else if (result && result.success) {
        setSuccessPayload({
          task: result.data?.task,
          team: result.data?.team || team
        });
        setErrorMessage(null);
        setTimeout(() => setSuccessPayload(null), 8000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to dispatch squad. Please verify credentials and team status.");
      setSuccessPayload(null);
    }
  };

  const isCritical = incident.priorityScore >= 80;
  const isHigh = incident.priorityScore >= 55 && incident.priorityScore < 80;
  const isResolved = incident.status === "resolved" || incident.status === "closed";
  const isAssigned = !!(incident.assignedTeamName || incident.assignedTeamId || assignedTeam);
  const selectedTeam = allTeams.find(t => t.id === selectedTeamId);

  return (
    <aside 
      className={`flex flex-col h-full bg-surface-base border-l border-border-subtle overflow-y-auto ${className}`}
      aria-label="Incident Operational Preview"
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0 font-mono-data">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs">Case File:</span>
          <span className="text-xs font-bold text-civic-cyan">{incident.id}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isResolved ? (
            <span className="badge-resolved text-[9.5px]">RESOLVED</span>
          ) : isAssigned ? (
            <span className="badge-resolved text-[9.5px]">DISPATCHED</span>
          ) : (
            <span className="badge-critical text-[9.5px]">UNASSIGNED</span>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-white transition-colors"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-5 flex-1">
        
        {/* Title & Classification */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="badge-neutral text-[10px] font-sans">{incident.category}</span>
            <span className="text-[10px] font-mono-data text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
            </span>
          </div>
          <h2 className="text-sm font-bold text-white leading-snug font-sans">
            {incident.title}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed font-sans line-clamp-3">
            {incident.priorityReason || incident.title}
          </p>
        </div>

        {/* Location Card */}
        <div className="p-3 card-quiet space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 text-xs text-civic-cyan font-bold">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{incident.address}</span>
          </div>
          <div className="text-[10.5px] font-mono-data text-text-muted pl-5">
            GPS: {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
          </div>
        </div>

        {/* Operational Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 font-mono-data">
          <div className="p-3 card-quiet space-y-0.5">
            <div className="text-[10px] text-text-muted uppercase">Priority Score</div>
            <div className="text-xl font-bold flex items-baseline gap-1">
              <span className={isCritical ? "text-civic-red" : isHigh ? "text-civic-amber" : isResolved ? "text-civic-green" : "text-civic-cyan"}>
                {incident.priorityScore}
              </span>
              <span className="text-xs text-text-muted font-normal">/100</span>
            </div>
          </div>

          <div className="p-3 card-quiet space-y-0.5">
            <div className="text-[10px] text-text-muted uppercase">Signals Linked</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              <span>{incident.connectedReportsCount || 1}</span>
              <span className="text-xs text-text-muted font-normal">Reports</span>
            </div>
          </div>
        </div>

        {/* Squad Dispatch / Assignment Section */}
        {isAssigned ? (
          <div className="p-4 rounded-xl bg-surface-elevated border border-civic-green/40 space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted uppercase font-bold font-mono-data">Assigned Squad</span>
              <span className="badge-resolved text-[9px]">ACTIVE ON SITE</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-civic-cyan shrink-0" />
              <span>{incident.assignedTeamName || assignedTeam?.name || "Assigned Municipal Team"}</span>
            </div>
            <div className="text-xs text-text-secondary grid grid-cols-1 gap-1.5 pt-2 border-t border-border-subtle font-mono-data">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[10px]">Squad Leader:</span>
                <span className="text-white font-bold">{assignedTeam?.leaderName || "Squad Leader"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[10px]">Assigned Specialist:</span>
                <span className="text-civic-cyan font-bold">{incident.assignedWorkerName || assignedTeam?.leaderName || "Assigned Specialist"}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted text-[10px]">Radio / Phone:</span>
                <span className="text-white">{assignedTeam?.phone || "+91 97112 33445"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 card-quiet space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase font-mono-data">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-civic-blue" />
                <span>Assign Response Team</span>
              </span>
              <span className="badge-critical text-[9px]">UNASSIGNED</span>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div 
                className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-sans"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold block">Assignment Rejected</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Verified Success Confirmation */}
            {successPayload && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-1.5 font-sans animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs uppercase font-mono-data">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Response Team Dispatched</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5 pl-6 font-mono-data">
                  <div>Team: <strong className="text-white">{successPayload.team?.name}</strong></div>
                  <div>Assigned Worker: <strong className="text-white">{successPayload.task?.workerName || successPayload.team?.leaderName}</strong></div>
                  {successPayload.task?.id && (
                    <div className="text-civic-cyan">Task Order: <strong>{successPayload.task.id}</strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Teams Radio/Card Selector */}
            <div className="space-y-2 font-sans">
              <label className="text-[10.5px] font-mono-data text-text-muted uppercase font-bold block">
                Select Available Field Squad ({allTeams.filter(t => t.status === 'available').length} Ready)
              </label>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {allTeams.map((team) => {
                  const isAvailable = team.status === "available";
                  const isSelected = selectedTeamId === team.id;

                  return (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected && isAvailable
                          ? "bg-sky-950/40 border-sky-500 text-white shadow-sm"
                          : isAvailable
                          ? "bg-surface-elevated border-border-subtle hover:border-slate-600 text-slate-300"
                          : "bg-surface-base/50 border-border-subtle/50 opacity-40 cursor-not-allowed text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono-data">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="radio"
                            name="selectedTeam"
                            checked={isSelected && isAvailable}
                            onChange={() => handleSelectTeam(team)}
                            disabled={!isAvailable}
                            className="accent-sky-500 shrink-0"
                          />
                          <span className="font-bold truncate text-white">{team.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          isAvailable 
                            ? "bg-emerald-950 text-emerald-400 border-emerald-500/40" 
                            : "bg-red-950 text-red-400 border-red-500/40"
                        }`}>
                          {isAvailable ? "AVAILABLE" : team.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted font-sans pl-5 mt-0.5 flex justify-between">
                        <span>Lead: {team.leaderName}</span>
                        <span>{team.department.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Designated Specialist Selection */}
              {selectedTeam && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono-data">
                    <span className="text-text-muted uppercase font-bold">Assigned Specialist:</span>
                    <span className="text-text-muted font-mono text-[9px]">
                      {((selectedTeam.members && selectedTeam.members.length > 0) ? selectedTeam.members.length : 1)} in squad
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-0.5">
                    {selectedTeam.leader && (
                      <div
                        onClick={() => selectedTeam.leader?.isAvailable !== false && setSelectedWorkerId(selectedTeam.leader!.id)}
                        className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                          selectedWorkerId === selectedTeam.leader.id
                            ? "bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500/40"
                            : selectedTeam.leader.isAvailable !== false
                            ? "bg-surface-elevated border-border-subtle hover:border-slate-600 text-slate-300"
                            : "bg-surface-base/40 border-border-subtle/40 opacity-40 cursor-not-allowed text-slate-500"
                        }`}
                      >
                        <div className="font-bold truncate text-[10.5px]">{selectedTeam.leader.name}</div>
                        <div className="flex items-center justify-between text-[8.5px] text-text-muted mt-0.5">
                          <span>Leader</span>
                          <span className={selectedTeam.leader.isAvailable !== false ? "text-emerald-400" : "text-amber-400"}>
                            {selectedTeam.leader.isAvailable !== false ? "AVAIL" : "BUSY"}
                          </span>
                        </div>
                      </div>
                    )}

                    {(selectedTeam.members || [])
                      .filter(m => !selectedTeam.leader || m.id !== selectedTeam.leader.id)
                      .map((member) => {
                        const isAvail = member.isAvailable !== false;
                        const isChosen = selectedWorkerId === member.id;
                        return (
                          <div
                            key={member.id}
                            onClick={() => isAvail && setSelectedWorkerId(member.id)}
                            className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                              isChosen
                                ? "bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500/40"
                                : isAvail
                                ? "bg-surface-elevated border-border-subtle hover:border-slate-600 text-slate-300"
                                : "bg-surface-base/40 border-border-subtle/40 opacity-40 cursor-not-allowed text-slate-500"
                            }`}
                          >
                            <div className="font-bold truncate text-[10.5px]">{member.name}</div>
                            <div className="flex items-center justify-between text-[8.5px] text-text-muted mt-0.5">
                              <span>{member.role?.toUpperCase() || "WORKER"}</span>
                              <span className={isAvail ? "text-emerald-400" : "text-amber-400"}>
                                {isAvail ? "AVAIL" : "BUSY"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="pt-2">
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Operational directives & safety instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan font-sans"
                />
              </div>

              {/* Dispatch Action */}
              <Button
                variant="primary"
                onClick={handleDispatch}
                isLoading={isDispatching}
                disabled={isDispatching || !allTeams.some(t => t.status === "available")}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="w-full py-2.5 text-xs font-sans font-bold"
              >
                {isDispatching ? "Executing Dispatch..." : "Dispatch Field Squad"}
              </Button>
            </div>
          </div>
        )}

        {/* Primary Case File CTA */}
        <Link
          href={`/operations/incidents/${incident.id}`}
          className="btn-secondary w-full py-3 text-xs font-sans font-bold flex items-center justify-center gap-2 group"
        >
          <span>Open Full Investigation Dossier</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

      </div>
    </aside>
  );
}

export default IncidentPreviewPanel;