"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  Radio, 
  Activity, 
  Flame, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Play, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Users, 
  MapPin,
  Wifi,
  WifiOff
} from "lucide-react";
import { LiveCityMap } from "@/components/live/LiveCityMap";
import { LiveEventStream } from "@/components/live/LiveEventStream";
import { LiveAIActivityPanel } from "@/components/live/LiveAIActivityPanel";
import { IncidentLifecycleTracker } from "@/components/live/IncidentLifecycleTracker";
import { CriticalAlertPanel } from "@/components/live/CriticalAlertPanel";
import { AIDecisionLiveExplanation } from "@/components/live/AIDecisionLiveExplanation";
import { LiveCityHealth } from "@/components/live/LiveCityHealth";
import { OperatorActionCenter } from "@/components/live/OperatorActionCenter";
import { DemoSimulationControls } from "@/components/live/DemoSimulationControls";
import { DemoGuideOverlay } from "@/components/live/DemoGuideOverlay";
import { RealtimeEvent, CriticalAlertPayload, AIActivityState } from "@/lib/realtime";
import { Incident, FieldTeam } from "@/types";

export default function LiveOperationsCommandCenterPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlertPayload[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connectionState, setConnectionState] = useState<"SSE CONNECTED" | "POLLING FALLBACK" | "RECONNECTING">("RECONNECTING");
  const [lastEventTime, setLastEventTime] = useState<string>("Just now");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Demo Simulation State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStepIdx, setDemoStepIdx] = useState<number>(0);
  const [demoCurrentIncident, setDemoCurrentIncident] = useState<any>(null);

  // SIH Guided Walkthrough Modal
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Active AI Activity States for the 5 engines
  const [aiActivityStates, setAiActivityStates] = useState<Record<string, AIActivityState>>({});

  // Active pipeline stage for lifecycle tracker
  const [currentLifecycleStage, setCurrentLifecycleStage] = useState<string>("new");

  // Track latest event timestamp for delta polling
  const latestTimestampRef = useRef<string>(new Date().toISOString());

  // 1. Initial snapshot fetch
  const fetchInitialSnapshot = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [incRes, teamsRes, alertsRes, eventsRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch("/api/teams"),
        fetch("/api/realtime/alerts"),
        fetch("/api/realtime/events?limit=25"),
      ]);

      if (incRes.status === 401 || incRes.status === 403) {
        setErrorMsg("Access restricted: Municipal Operator or Administrator authentication required.");
        return;
      }

      const incData = await incRes.json();
      const teamsData = await teamsRes.json();
      const alertsData = await alertsRes.json();
      const eventsData = await eventsRes.json();

      if (incData.success) setIncidents(incData.data);
      if (teamsData.success) setTeams(teamsData.data);
      if (alertsData.success) setAlerts(alertsData.alerts);
      if (eventsData.success) {
        setEvents(eventsData.events);
        if (eventsData.events.length > 0) {
          latestTimestampRef.current = eventsData.events[eventsData.events.length - 1].timestamp;
        }
      }
    } catch (e: any) {
      console.error("Snapshot sync error:", e);
      setErrorMsg("Network error connecting to operations telemetry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialSnapshot();
  }, [fetchInitialSnapshot]);

  // 2. Real-Time Transport: SSE with automatic Delta-Polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource("/api/realtime/stream");

        eventSource.onopen = () => {
          setConnectionState("SSE CONNECTED");
        };

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.eventType) {
              handleIncomingEvent(parsed);
            }
          } catch (err) {}
        };

        eventSource.onerror = () => {
          setConnectionState("POLLING FALLBACK");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Activate polling fallback
          startPollingFallback();
        };
      } catch (err) {
        startPollingFallback();
      }
    };

    const startPollingFallback = () => {
      if (fallbackInterval) return;
      setConnectionState("POLLING FALLBACK");
      fallbackInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/realtime/events?since=${encodeURIComponent(latestTimestampRef.current)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.events) && data.events.length > 0) {
            data.events.forEach((evt: RealtimeEvent) => handleIncomingEvent(evt));
            latestTimestampRef.current = data.events[data.events.length - 1].timestamp;
          }
        } catch (err) {}
      }, 4000);
    };

    const handleIncomingEvent = (evt: RealtimeEvent) => {
      setEvents((prev) => {
        // Prevent duplicates
        if (prev.some((p) => p.eventId === evt.eventId)) return prev;
        return [...prev, evt];
      });

      setLastEventTime("Just now");
      latestTimestampRef.current = evt.timestamp;

      // Handle AI Activity Updates
      if (evt.eventType === "AI_CORRELATION_COMPLETED" && evt.payload?.engine) {
        setAiActivityStates((prev) => ({
          ...prev,
          [evt.payload.engine]: {
            engine: evt.payload.engine,
            status: evt.payload.status || "matched",
            confidenceScore: evt.payload.confidenceScore,
            lastProcessedAt: evt.timestamp,
            details: evt.payload.details,
          },
        }));
      }

      // Handle Incident Status Progression in Tracker
      if (evt.payload?.status) {
        setCurrentLifecycleStage(evt.payload.status);
      }

      // Handle Simulation Events
      if (evt.source === "simulation" && evt.payload?.incident) {
        setDemoCurrentIncident(evt.payload.incident);
        setDemoStepIdx(evt.payload.stepIndex || 0);
        if (evt.payload.incident?.status) {
          setCurrentLifecycleStage(evt.payload.incident.status);
        }
      }
    };

    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Demo Simulation API Handlers
  const handleSimAction = async (action: "start" | "pause" | "step" | "reset") => {
    setIsDemoMode(true);
    try {
      const res = await fetch("/api/realtime/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setIsDemoRunning(data.data.status?.isRunning || false);
        if (data.data.currentStep?.data) {
          setDemoCurrentIncident(data.data.currentStep.data);
          setDemoStepIdx(data.data.currentStep.stepIndex);
          setCurrentLifecycleStage(data.data.currentStep.data.status);
        }
      }
    } catch (e) {
      console.error("Simulation control error:", e);
    }
  };

  const handleExitDemo = () => {
    handleSimAction("reset");
    setIsDemoMode(false);
    setIsDemoRunning(false);
    setDemoCurrentIncident(null);
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 font-sans pb-24">
      
      {/* ========================================================================= */}
      {/* TOP COMMAND HEADER                                                        */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold tracking-widest text-cyan-400 uppercase">
                CIVICPULSE LIVE CITY OPERATIONS &bull; SURAT MUNICIPAL COMMAND
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Live Mission Control Center</span>
            </h1>
          </div>

          {/* Right Status Beacons & Actions */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            
            {/* Connection Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              {connectionState === "SSE CONNECTED" ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="text-[10px] text-slate-300 font-bold uppercase">{connectionState}</span>
            </div>

            {/* SIH Presentation Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 font-bold transition-all shadow-lg shadow-purple-950/40"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>SIH Presentation Guide</span>
            </button>

            {/* Launch Simulation Trigger */}
            <button
              type="button"
              onClick={() => {
                if (!isDemoMode) {
                  setIsDemoMode(true);
                  handleSimAction("start");
                } else {
                  handleExitDemo();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                isDemoMode
                  ? "bg-pink-950 border border-pink-500/50 text-pink-300 shadow-lg shadow-pink-950/40"
                  : "bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current text-pink-400" />
              <span>{isDemoMode ? "Active Demo Mode" : "Demo Simulation"}</span>
            </button>

            {/* Link to Predictive Intelligence */}
            <Link
              href="/operations/intelligence"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Predictive Ops</span>
            </Link>

          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={fetchInitialSnapshot}
              className="px-3 py-1 rounded-lg bg-red-900/60 border border-red-500/50 text-white font-mono text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEMO SIMULATION CONTROLS BAR (When active)                                */}
        {/* ========================================================================= */}
        {isDemoMode && (
          <DemoSimulationControls
            isRunning={isDemoRunning}
            currentStepIndex={demoStepIdx}
            totalSteps={11}
            currentStepTitle={demoCurrentIncident?.title || "Citizen Submits Report"}
            onStart={() => handleSimAction("start")}
            onPause={() => handleSimAction("pause")}
            onStepForward={() => handleSimAction("step")}
            onReset={() => handleSimAction("reset")}
            onExit={handleExitDemo}
          />
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: LIVE CITY HEALTH & OPERATOR ACTION CENTER                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-4">
            <LiveCityHealth
              score={82}
              status="STABLE"
              trendDelta={4.2}
              className="h-full"
            />
          </div>

          <div className="lg:col-span-8">
            <OperatorActionCenter
              unreviewedDecisionsCount={3}
              criticalIncidentsCount={incidents.filter((i) => i.priority === "critical").length || 2}
              slaRisksCount={1}
              emergingAlertsCount={2}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 (HERO): LIVE CITY MAP & LIVE EVENT STREAM                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 8 Cols: Live City Map */}
          <div className="lg:col-span-8">
            <LiveCityMap
              incidents={incidents}
              teams={teams}
              simulatedIncident={isDemoMode ? demoCurrentIncident : undefined}
            />
          </div>

          {/* Right 4 Cols: Live Event Stream */}
          <div className="lg:col-span-4">
            <LiveEventStream events={events} />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: LIVE AI ACTIVITY & INCIDENT LIFECYCLE PIPELINE                 */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <LiveAIActivityPanel activityStates={aiActivityStates} />

          <IncidentLifecycleTracker
            currentStage={currentLifecycleStage}
            incidentId={demoCurrentIncident?.incidentId || incidents[0]?.id || "CP-1024"}
          />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: CRITICAL ALERTS & LIVE AI EXPLANATION                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7">
            <CriticalAlertPanel alerts={alerts} />
          </div>

          <div className="lg:col-span-5">
            <AIDecisionLiveExplanation
              decisionTitle={demoCurrentIncident ? "Correlated Duplicate: Road Cavity near St. Xavier School" : undefined}
              confidenceScore={demoCurrentIncident?.aiScore || 84}
              explanationFactors={demoCurrentIncident?.aiExplanation || undefined}
            />
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* SIH JUDGE PRESENTATION GUIDE OVERLAY MODAL                                */}
      {/* ========================================================================= */}
      <DemoGuideOverlay
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLaunchSimulation={() => {
          setIsDemoMode(true);
          handleSimAction("start");
        }}
      />

    </div>
  );
}
