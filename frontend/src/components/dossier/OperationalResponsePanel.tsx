"use client";

import React, { useState, useEffect } from "react";
import { Incident, FieldTeam, FieldTask } from "@/types";
import { Button } from "@/components/ui/Button";
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  Phone, 
  HardHat, 
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Camera,
  Check
} from "lucide-react";

interface OperationalResponsePanelProps {
  incident: Incident;
  assignedTeam?: FieldTeam | null;
  allTeams: FieldTeam[];
  onAssignTeam: (teamId: string, notes: string, workerId?: string) => Promise<{ success: boolean; data?: any; error?: string } | void>;
  isDispatching?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function OperationalResponsePanel({
  incident,
  assignedTeam,
  allTeams,
  onAssignTeam,
  isDispatching = false,
  onRefresh,
  className = "",
}: OperationalResponsePanelProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<{ task?: FieldTask; team?: FieldTeam } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    setErrorToast(null);
    setSuccessPayload(null);
    const firstAvailable = allTeams.find(t => t.status === "available");
    const activeTeam = firstAvailable || (allTeams.length > 0 ? allTeams[0] : null);
    if (activeTeam) {
      setSelectedTeamId(activeTeam.id);
      const availMember = activeTeam.members?.find(m => m.isAvailable !== false);
      setSelectedWorkerId(availMember ? availMember.id : (activeTeam.leaderId || ""));
    }
  }, [incident.id, allTeams]);

  const handleSelectTeam = (team: FieldTeam) => {
    if (team.status !== "available") return;
    setSelectedTeamId(team.id);
    const availMember = team.members?.find(m => m.isAvailable !== false);
    setSelectedWorkerId(availMember ? availMember.id : (team.leaderId || ""));
  };

  const handleDispatch = async () => {
    if (!selectedTeamId) {
      setErrorToast("Please select a field squad before dispatching.");
      return;
    }

    const team = allTeams.find(t => t.id === selectedTeamId);
    if (team && team.status !== "available") {
      setErrorToast(`Team '${team.name}' is currently ${team.status.toUpperCase()} and cannot be assigned.`);
      return;
    }

    setErrorToast(null);
    try {
      const result: any = await onAssignTeam(selectedTeamId, dispatchNotes, selectedWorkerId || undefined);
      if (result && !result.success) {
        setErrorToast(result.error || "Failed to dispatch squad.");
        setSuccessPayload(null);
      } else if (result && result.success) {
        setSuccessPayload({
          task: result.data?.task,
          team: result.data?.team || team
        });
        setErrorToast(null);
        setTimeout(() => setSuccessPayload(null), 8000);
      }
    } catch (e: any) {
      setErrorToast(e.message || "Failed to dispatch squad. Please verify credentials and team status.");
      setSuccessPayload(null);
    }
  };

  const handleVerify = async (decision: "approve" | "reject") => {
    setIsVerifying(true);
    setVerificationFeedback(null);
    setErrorToast(null);

    try {
      const res = await fetch(`/api/incidents/${incident.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: verificationNotes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process operational verification.");
      }

      setVerificationFeedback(
        decision === "approve"
          ? "Incident verified & closed. Response squad released to active availability pool."
          : "Verification rejected. Incident reopened for remediation."
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorToast(err.message || "Verification failed. Only operators and administrators may verify incidents.");
    } finally {
      setIsVerifying(false);
    }
  };

  const [reopenReviewNotes, setReopenReviewNotes] = useState("");
  const [isReviewingReopen, setIsReviewingReopen] = useState(false);

  const handleReopenReview = async (decision: "approve" | "reject") => {
    setIsReviewingReopen(true);
    setErrorToast(null);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/reopen-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: reopenReviewNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process reopening review.");
      }
      setVerificationFeedback(
        decision === "approve"
          ? "Reopening approved. Incident status changed to IN PROGRESS. Ready for squad re-assignment."
          : "Reopening rejected. Original resolution confirmed."
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorToast(err.message || "Failed to process reopen review.");
    } finally {
      setIsReviewingReopen(false);
    }
  };

  const isAssigned = !!(incident.assignedTeamName || incident.assignedTeamId || assignedTeam);
  const isAwaitingVerification = incident.status === "awaiting_verification" || incident.status === "pending_verification";
  const isReopenRequested = incident.status === "reopen_requested";
  const isResolved = incident.status === "resolved" || incident.status === "closed";
  const selectedTeam = allTeams.find(t => t.id === selectedTeamId);

  return (
    <section className={`card-elevated p-6 sm:p-7 space-y-5 font-mono-data ${className}`} aria-label="Operational Response & Squad Dispatch">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Truck className="w-4 h-4 text-civic-blue" />
          <span>Operational Response &amp; Verification</span>
        </div>
        {isReopenRequested ? (
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded border uppercase font-bold bg-amber-950/70 text-amber-400 border-amber-500/50">
            REOPEN REQUESTED
          </span>
        ) : isResolved ? (
          <span className="badge-resolved text-[9.5px]">RESOLVED</span>
        ) : isAwaitingVerification ? (
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded border uppercase font-bold bg-amber-950/60 text-amber-400 border-amber-500/30">
            AWAITING VERIFICATION
          </span>
        ) : isAssigned ? (
          <span className="badge-resolved text-[9.5px]">DISPATCHED</span>
        ) : (
          <span className="badge-critical text-[9.5px]">UNASSIGNED</span>
        )}
      </div>

      {/* Success Banner */}
      {successPayload && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-1.5 font-sans animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs uppercase font-mono-data">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Squad Assigned Successfully</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5 pl-6 font-mono-data">
            <div>Team: <strong className="text-white">{successPayload.team?.name}</strong></div>
            <div>Assigned Worker: <strong className="text-white">{successPayload.task?.workerName || successPayload.team?.leaderName}</strong></div>
            {successPayload.task?.id && (
              <div className="text-civic-cyan">Task Record: <strong>{successPayload.task.id}</strong> (Field Queue Updated)</div>
            )}
          </div>
        </div>
      )}

      {/* Verification Feedback Banner */}
      {verificationFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 font-sans animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{verificationFeedback}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorToast && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-sans animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold block font-mono-data">Operational Error</span>
            <span>{errorToast}</span>
          </div>
        </div>
      )}

      {/* 0. CITIZEN REOPEN REQUEST REVIEW STAGE */}
      {isReopenRequested ? (
        <div className="p-5 rounded-xl bg-surface-elevated border border-amber-500/50 space-y-4 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono-data uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>Citizen Reopen Request Pending Review</span>
            </div>
            <span className="text-[10px] text-text-muted font-mono-data">Citizen Feedback</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-base border border-border-subtle space-y-1 text-xs">
            <span className="text-text-muted text-[10.5px] uppercase font-mono-data block">Citizen Report Notes:</span>
            <p className="text-white font-sans italic">
              &quot;{incident.reopenedReason || incident.citizenFeedbackNotes || "Citizen indicated issue has recurred or was not fully resolved."}&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-text-secondary font-mono-data uppercase">
              Supervisor Reopening Directives / Notes
            </label>
            <input
              type="text"
              value={reopenReviewNotes}
              onChange={(e) => setReopenReviewNotes(e.target.value)}
              placeholder="e.g., Reopen authorized. Assign secondary remediation squad."
              className="w-full px-3 py-2 rounded-xl bg-surface-base border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono-data text-xs">
            <button
              onClick={() => handleReopenReview("approve")}
              disabled={isReviewingReopen}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReviewingReopen ? "Processing..." : "Approve Reopen"}</span>
            </button>

            <button
              onClick={() => handleReopenReview("reject")}
              disabled={isReviewingReopen}
              className="py-3 px-4 rounded-xl bg-surface-base hover:bg-slate-800 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-300 font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isReviewingReopen ? "Processing..." : "Reject Request"}</span>
            </button>
          </div>
        </div>
      ) : isAwaitingVerification ? (
        <div className="p-5 rounded-xl bg-surface-elevated border border-amber-500/40 space-y-4 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono-data uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Inspection &amp; Quality Sign-Off Required</span>
            </div>
            <span className="text-[10px] text-text-muted font-mono-data">Protocol §5.1</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The assigned field crew has completed physical restoration and submitted completion proof. Review photographic evidence below before releasing the squad and resolving this case file.
          </p>

          {incident.afterEvidenceUrl && (
            <div className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center gap-3">
              <img 
                src={incident.afterEvidenceUrl} 
                alt="Submitted completion evidence" 
                className="w-16 h-12 rounded-lg object-cover border border-border-subtle"
              />
              <div className="text-xs space-y-0.5">
                <span className="text-white font-bold block">Submitted After-Work Evidence</span>
                <span className="text-text-muted text-[11px] truncate block max-w-xs">{incident.afterEvidenceUrl}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10.5px] font-bold text-text-secondary uppercase font-mono-data">
              Verification Directives / Audit Notes:
            </label>
            <input
              type="text"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              disabled={isVerifying}
              placeholder="e.g. Photographic evidence inspected; asphalt grade and compaction confirmed satisfactory..."
              className="w-full px-3 py-2 rounded-xl bg-surface-base border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono-data text-xs">
            <button
              onClick={() => handleVerify("approve")}
              disabled={isVerifying}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isVerifying ? "Verifying..." : "Approve & Resolve Incident"}</span>
            </button>

            <button
              onClick={() => handleVerify("reject")}
              disabled={isVerifying}
              className="py-3 px-4 rounded-xl bg-surface-base hover:bg-slate-800 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-300 font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isVerifying ? "Processing..." : "Reject & Request Rework"}</span>
            </button>
          </div>
        </div>
      ) : isResolved ? (
        /* 2. RESOLVED STAGE */
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase font-bold font-mono-data flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Case File Closed &bull; Verified</span>
            </span>
            <span className="badge-resolved text-[9.5px]">RESOLVED</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Incident restoration verified by Operations Control. Assigned municipal squad has been returned to the active availability pool.
          </p>
        </div>
      ) : isAssigned ? (
        /* 3. CURRENTLY ASSIGNED STAGE */
        <div className="p-4 rounded-xl bg-surface-base border border-civic-green/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase font-bold">Assigned Response Squad:</span>
            <span className="badge-resolved text-[9.5px]">ACTIVE ON SITE</span>
          </div>

          <div className="text-base font-bold text-white font-sans flex items-center gap-2">
            <HardHat className="w-4 h-4 text-civic-amber shrink-0" />
            <span>{incident.assignedTeamName || assignedTeam?.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary pt-2 border-t border-border-subtle">
            <div>
              <span className="text-text-muted text-[10px] block">Squad Leader:</span>
              <span className="text-white">{assignedTeam?.leaderName || "Squad Leader"}</span>
            </div>
            <div>
              <span className="text-text-muted text-[10px] block">Assigned Specialist:</span>
              <span className="text-civic-cyan font-bold">{incident.assignedWorkerName || assignedTeam?.leaderName || "Assigned Worker"}</span>
            </div>
            <div>
              <span className="text-text-muted text-[10px] block">Direct Radio / Phone:</span>
              <span className="text-white flex items-center gap-1">
                <Phone className="w-3 h-3 text-civic-cyan" />
                <span>{assignedTeam?.phone || "+91 97112 33445"}</span>
              </span>
            </div>
            <div>
              <span className="text-text-muted text-[10px] block">Operational State:</span>
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold">
                {incident.status === "assigned" ? "DISPATCHED / EN ROUTE" : incident.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 4. DISPATCH CREW SELECTION STAGE */
        <div className="space-y-4 font-sans">
          <div className="text-xs text-text-secondary leading-relaxed">
            No field crew currently assigned to this incident. Select an available specialized municipal squad and designated worker below to initialize priority dispatch.
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-text-secondary uppercase font-bold text-[10.5px] font-mono-data block mb-1.5">
                Select Field Squad ({allTeams.filter(t => t.status === 'available').length} Available):
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allTeams.map((t) => {
                  const isAvailable = t.status === "available";
                  const isSelected = selectedTeamId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTeam(t)}
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
                            name="dossierSelectedTeam"
                            checked={isSelected && isAvailable}
                            onChange={() => handleSelectTeam(t)}
                            disabled={!isAvailable}
                            className="accent-sky-500 shrink-0"
                          />
                          <span className="font-bold truncate text-white">{t.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isAvailable 
                            ? "bg-emerald-950 text-emerald-400 border-emerald-500/40" 
                            : "bg-red-950 text-red-400 border-red-500/40"
                        }`}>
                          {isAvailable ? "AVAILABLE" : t.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted font-sans pl-5 mt-1 flex justify-between">
                        <span>Leader: {t.leaderName} ({t.phone})</span>
                        <span>{t.department}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Designated Specialist Selection */}
            {selectedTeam && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10.5px] font-mono-data">
                  <label className="text-text-secondary uppercase font-bold">
                    Designated Field Specialist:
                  </label>
                  <span className="text-[9.5px] text-text-muted font-mono">
                    {((selectedTeam.members && selectedTeam.members.length > 0) ? selectedTeam.members.length : 1)} in squad
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {/* Squad Leader Option */}
                  {selectedTeam.leader && (
                    <div
                      onClick={() => selectedTeam.leader?.isAvailable !== false && setSelectedWorkerId(selectedTeam.leader!.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedWorkerId === selectedTeam.leader.id
                          ? "bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500/40"
                          : selectedTeam.leader.isAvailable !== false
                          ? "bg-surface-elevated border-border-subtle hover:border-slate-600 text-slate-300"
                          : "bg-surface-base/40 border-border-subtle/40 opacity-40 cursor-not-allowed text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate text-[11px]">{selectedTeam.leader.name}</span>
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          selectedTeam.leader.isAvailable !== false
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-950 text-amber-400 border border-amber-500/30"
                        }`}>
                          {selectedTeam.leader.isAvailable !== false ? "AVAIL" : "BUSY"}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">Squad Leader</div>
                    </div>
                  )}

                  {/* Member Options */}
                  {(selectedTeam.members || [])
                    .filter(m => !selectedTeam.leader || m.id !== selectedTeam.leader.id)
                    .map((member) => {
                      const isAvail = member.isAvailable !== false;
                      const isChosen = selectedWorkerId === member.id;
                      return (
                        <div
                          key={member.id}
                          onClick={() => isAvail && setSelectedWorkerId(member.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChosen
                              ? "bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500/40"
                              : isAvail
                              ? "bg-surface-elevated border-border-subtle hover:border-slate-600 text-slate-300"
                              : "bg-surface-base/40 border-border-subtle/40 opacity-40 cursor-not-allowed text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate text-[11px]">{member.name}</span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isAvail
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-950 text-amber-400 border border-amber-500/30"
                            }`}>
                              {isAvail ? "AVAIL" : "BUSY"}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5">{member.role?.toUpperCase() || "WORKER"}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div>
              <label className="text-text-secondary uppercase font-bold text-[10.5px] font-mono-data">
                Dispatch Directives &amp; Safety Notes:
              </label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                disabled={isDispatching}
                placeholder="e.g. Urgent asphalt compaction required outside school gate..."
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-surface-elevated border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan disabled:opacity-50 font-sans"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleDispatch}
              isLoading={isDispatching}
              disabled={isDispatching || !allTeams.some(t => t.status === "available")}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="w-full py-3 text-xs font-bold"
            >
              {isDispatching ? "Executing Priority Dispatch..." : "Dispatch Field Squad"}
            </Button>
          </div>
        </div>
      )}

    </section>
  );
}

export default OperationalResponsePanel;