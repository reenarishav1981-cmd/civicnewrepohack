"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Camera, 
  Radio, 
  ThumbsUp, 
  RotateCcw,
  Check,
  Send,
  HelpCircle
} from "lucide-react";
import { PUBLIC_LIFECYCLE_STAGES } from "@/lib/domain/publicIncidentStatus";

export default function IncidentPublicTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const trackingId = (params?.id as string)?.toUpperCase();

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Feedback Submission State
  const [feedbackChoice, setFeedbackChoice] = useState<"RESOLVED SUCCESSFULLY" | "ISSUE STILL EXISTS" | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Fetch Public Tracking DTO
  const fetchTrackingData = useCallback(async (isInitial = false) => {
    if (!trackingId) return;
    if (isInitial) setIsLoading(true);

    try {
      const res = await fetch(`/api/track/${trackingId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || `Incident '${trackingId}' not found.`);
        return;
      }

      setData(json);
      setLastSyncTime(new Date());
      setErrorMsg(null);
    } catch (err: any) {
      if (isInitial) setErrorMsg("Failed to synchronize with municipal tracking servers.");
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    fetchTrackingData(true);
  }, [fetchTrackingData]);

  // Real-Time Polling Loop (12-second intervals)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTrackingData(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchTrackingData]);

  // Handle Citizen Resolution Feedback
  const handleFeedbackSubmit = async () => {
    if (!feedbackChoice || !data?.incident) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    setFeedbackSuccessMsg(null);

    // Canonical incident ID from verified data DTO
    const targetIncidentId = data.incident.trackingId || trackingId;

    try {
      const res = await fetch(`/api/incidents/${targetIncidentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackStatus: feedbackChoice,
          feedbackNotes: feedbackNotes.trim() || undefined
        })
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to submit feedback. Please ensure you are logged in as the report owner.");
      }

      setFeedbackSuccessMsg(
        feedbackChoice === "ISSUE STILL EXISTS"
          ? "Reopening request submitted. Municipal operations supervisor will review your case file."
          : "Thank you! Your verified satisfaction confirmation has been logged into municipal records."
      );
      setFeedbackChoice(null);
      setFeedbackNotes("");
      await fetchTrackingData(false);
    } catch (err: any) {
      setFeedbackError(err.message || "Feedback submission failed.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-white flex flex-col items-center justify-center space-y-4 font-mono-data text-xs">
        <Radio className="w-8 h-8 animate-spin text-civic-cyan" />
        <p>Loading Municipal Verification Ledger for {trackingId}...</p>
      </div>
    );
  }

  if (errorMsg || !data || !data.incident) {
    return (
      <div className="min-h-screen bg-canvas text-text-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle mb-4">
          <AlertTriangle className="w-10 h-10 text-civic-amber" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Tracking Case Not Found</h1>
        <p className="text-sm text-text-secondary max-w-sm mb-6">
          {errorMsg || `The tracking ID '${trackingId}' was not recognized by municipal servers.`}
        </p>
        <Link
          href="/track"
          className="py-2.5 px-6 rounded-xl bg-surface-elevated hover:bg-slate-800 border border-border-subtle text-white font-mono-data text-xs font-bold"
        >
          &larr; Search Another ID
        </Link>
      </div>
    );
  }

  const inc = data.incident;
  const timeline = data.timeline || [];

  // Determine stage progression index (1-based)
  const currentStageIndex = PUBLIC_LIFECYCLE_STAGES.findIndex(s => s.key === inc.stageKey);
  const activeStepNum = currentStageIndex >= 0 ? currentStageIndex + 1 : 1;

  return (
    <div className="min-h-screen bg-canvas text-text-primary font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-border-subtle bg-surface-base/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="p-1.5 rounded-lg bg-surface-elevated border border-border-subtle hover:border-civic-cyan/40 text-text-secondary hover:text-white transition-all"
              title="Search Another ID"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] text-text-muted font-mono-data uppercase block">
                Official Incident Case File
              </span>
              <span className="text-sm font-bold text-white font-mono-data">
                {inc.trackingId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border-subtle text-[10.5px] font-mono-data text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
              <span>Live Telemetry</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* SECTION 1: HERO STATUS */}
        <section className="card-elevated p-6 sm:p-8 space-y-4 relative overflow-hidden" aria-label="Incident Hero Status">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div className="space-y-0.5">
              <span className="text-xs font-mono-data text-text-muted uppercase tracking-wider">
                Tracking Incident &bull; {inc.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {inc.title}
              </h1>
            </div>

            <div className="text-right font-mono-data text-xs text-text-muted">
              <span>Last updated: </span>
              <span className="text-white font-bold">
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Prominent Status Callout */}
          <div className="p-5 rounded-2xl bg-surface-base border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${inc.isResolved ? 'bg-civic-green' : 'bg-civic-cyan animate-ping'}`} />
                <span className="text-xs font-mono-data text-text-muted uppercase">Lifecycle Status</span>
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold uppercase font-mono-data ${inc.isResolved ? 'text-civic-green' : 'text-civic-cyan'}`}>
                {inc.status}
              </div>
              <p className="text-xs text-text-secondary max-w-xl font-sans leading-relaxed">
                {inc.description}
              </p>
            </div>

            <div className="sm:text-right font-mono-data shrink-0">
              <div className="text-3xl font-extrabold text-white">
                {inc.progressPercentage}%
              </div>
              <div className="text-[10px] text-text-muted uppercase">
                Resolution Progress
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PROGRESS TIMELINE (7-STAGE VISUAL STEPPER) */}
        <section className="card-quiet p-6 sm:p-7 space-y-4 font-mono-data" aria-label="7-Stage Public Progression Stepper">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-civic-cyan" />
              <span>Municipal Response Progression</span>
            </span>
            <span className="text-[10.5px] text-text-muted">
              Stage {activeStepNum} of {PUBLIC_LIFECYCLE_STAGES.length}
            </span>
          </div>

          {/* Stepper HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            {PUBLIC_LIFECYCLE_STAGES.map((stg, idx) => {
              const stepIndex = idx + 1;
              const isCompleted = stepIndex < activeStepNum || inc.isResolved;
              const isCurrent = stepIndex === activeStepNum && !inc.isResolved;

              return (
                <div
                  key={stg.key}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isCurrent
                      ? "bg-surface-elevated border-civic-cyan text-white ring-1 ring-civic-cyan/50 font-bold shadow-sm"
                      : isCompleted
                      ? "bg-civic-green/10 border-civic-green/30 text-civic-green font-medium"
                      : "bg-surface-base border-border-subtle text-text-muted opacity-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCurrent
                        ? "bg-civic-cyan text-void font-bold"
                        : isCompleted
                        ? "bg-civic-green text-void font-bold"
                        : "bg-surface-elevated text-text-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepIndex}
                  </div>
                  <span className="text-[10.5px] font-sans truncate w-full">
                    {stg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: INCIDENT SUMMARY */}
        <section className="card-quiet p-6 sm:p-7 space-y-4" aria-label="Incident Summary Information">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data pb-2 border-b border-border-subtle">
            Municipal Dispatch Case Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-1">
              <span className="text-text-muted text-[10px] uppercase font-mono-data block">Issue Classification</span>
              <span className="text-white font-bold">{inc.category}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-1">
              <span className="text-text-muted text-[10px] uppercase font-mono-data block">Reported Area</span>
              <span className="text-white font-bold truncate block">{inc.location}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-1">
              <span className="text-text-muted text-[10px] uppercase font-mono-data block">Reported On</span>
              <span className="text-white font-bold truncate block">
                {new Date(inc.reportedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-1">
              <span className="text-text-muted text-[10px] uppercase font-mono-data block">Current Status</span>
              <span className="text-civic-cyan font-bold truncate block font-mono-data">{inc.status}</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: LIVE ACTIVITY (PUBLIC-SAFE TIMELINE LEDGER) */}
        <section className="card-quiet p-6 sm:p-7 space-y-5 font-mono-data" aria-label="Public Activity Ledger">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-civic-cyan" />
              <span>Public Verification Activity Ledger</span>
            </span>
            <span className="text-[10px] text-text-muted">{timeline.length} Milestones Recorded</span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 text-xs font-sans">
            {timeline.map((ev: any) => (
              <div key={ev.id} className="relative pl-7 space-y-0.5">
                <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-surface-base border-2 border-civic-cyan ring-2 ring-void" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{ev.title}</span>
                  <span className="text-[10.5px] text-text-muted font-mono-data">{ev.timestamp}</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {ev.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: RESOLUTION EVIDENCE (SHOWN ONLY WHEN RESOLVED) */}
        {inc.isResolved && inc.evidence && (
          <section className="card-elevated p-6 sm:p-8 space-y-4 border-civic-green/40" aria-label="Resolution Photographic Proof">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-bold text-civic-green font-mono-data uppercase">
                <Camera className="w-4 h-4" />
                <span>Officially Verified Resolution Proof</span>
              </div>
              <span className="badge-resolved text-[9.5px]">VERIFIED INSPECTION</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Below is the verified photographic documentation collected during on-site remediation and approved by municipal supervisory inspection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {inc.evidence.beforePhotoUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-text-muted font-mono-data uppercase font-bold">
                    Initial Site Condition (Before)
                  </span>
                  <div className="rounded-xl overflow-hidden border border-border-subtle bg-surface-base aspect-video">
                    <img
                      src={inc.evidence.beforePhotoUrl}
                      alt="Initial Condition Before Work"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {inc.evidence.afterPhotoUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-civic-green font-mono-data uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Completion Proof (After)</span>
                  </span>
                  <div className="rounded-xl overflow-hidden border border-civic-green/40 bg-surface-base aspect-video ring-1 ring-civic-green/20">
                    <img
                      src={inc.evidence.afterPhotoUrl}
                      alt="Verified Completion After Work"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 6: CITIZEN SATISFACTION & REOPEN REQUEST */}
        {inc.isResolved && (
          <section className="card-quiet p-6 sm:p-8 space-y-4 font-sans" aria-label="Citizen Satisfaction & Reopen Request">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-civic-amber" />
                <span>Citizen Satisfaction &amp; Quality Audit</span>
              </h3>
              {inc.citizenFeedbackStatus && (
                <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border ${
                  inc.citizenFeedbackStatus === "RESOLVED SUCCESSFULLY"
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-950/60 text-amber-400 border-amber-500/30"
                }`}>
                  {inc.citizenFeedbackStatus}
                </span>
              )}
            </div>

            {feedbackSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{feedbackSuccessMsg}</span>
              </div>
            )}

            {feedbackError && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{feedbackError}</span>
              </div>
            )}

            {inc.citizenFeedbackStatus ? (
              <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2 text-xs">
                <span className="text-text-muted font-mono-data text-[10.5px] uppercase block">
                  Recorded Citizen Response:
                </span>
                <p className="text-white font-medium">
                  {inc.citizenFeedbackStatus === "RESOLVED SUCCESSFULLY"
                    ? "Verified satisfactory resolution confirmed by reporting citizen."
                    : "Citizen reported that the problem persists. Reopen request logged for supervisory review."}
                </p>
              </div>
            ) : inc.canProvideFeedback ? (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  As the verified reporter of this civic incident, please confirm whether the reported condition has been resolved satisfactorily on site.
                </p>

                {/* Choice Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-data text-xs">
                  <button
                    type="button"
                    onClick={() => setFeedbackChoice("RESOLVED SUCCESSFULLY")}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      feedbackChoice === "RESOLVED SUCCESSFULLY"
                        ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/30"
                        : "bg-surface-base hover:bg-slate-800 border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolved Successfully</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackChoice("ISSUE STILL EXISTS")}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      feedbackChoice === "ISSUE STILL EXISTS"
                        ? "bg-amber-600 text-white border-amber-400 ring-2 ring-amber-500/30"
                        : "bg-surface-base hover:bg-slate-800 border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Issue Still Exists (Request Reopen)</span>
                  </button>
                </div>

                {/* Optional Feedback Notes */}
                {feedbackChoice && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <label className="text-[11px] text-text-secondary font-mono-data uppercase block">
                      {feedbackChoice === "ISSUE STILL EXISTS" 
                        ? "Please describe why the issue still persists (max 500 chars):" 
                        : "Optional feedback or appreciation notes for municipal crew:"}
                    </label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder={feedbackChoice === "ISSUE STILL EXISTS" ? "e.g. The cavity was backfilled but water is still ponding after rain." : "e.g. Great job by the road repair crew!"}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-base border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan"
                    />

                    <button
                      type="button"
                      disabled={isSubmittingFeedback}
                      onClick={handleFeedbackSubmit}
                      className="py-2.5 px-5 rounded-xl bg-civic-cyan hover:bg-civic-cyan/90 text-void font-bold text-xs font-mono-data uppercase flex items-center gap-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingFeedback ? "Submitting..." : "Submit Quality Audit"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-base border border-border-subtle text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-text-muted shrink-0" />
                  <span>
                    Log in as the verified report owner to submit satisfaction feedback or request case reopening.
                  </span>
                </div>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-800 border border-border-subtle text-white font-mono-data text-[11px] font-bold shrink-0 text-center transition-all"
                >
                  Sign In to Verify &rarr;
                </Link>
              </div>
            )}
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-4 px-6 text-center text-xs text-text-muted font-mono-data">
        CivicPulse Smart City Operations &bull; National Civic Infrastructure Initiative &copy; 2026
      </footer>
    </div>
  );
}