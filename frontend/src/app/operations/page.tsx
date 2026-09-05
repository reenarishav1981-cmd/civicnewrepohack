"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Incident, FieldTeam } from "@/types";
import { PriorityQueueRail } from "@/components/operations/PriorityQueueRail";
import { IncidentPreviewPanel } from "@/components/operations/IncidentPreviewPanel";
import { LiveActivityTicker, ActivityItem } from "@/components/operations/LiveActivityTicker";
import { CitySignalCanvas } from "@/components/spatial/CitySignalCanvas";
import { 
  Radio, 
  Sparkles, 
  Sliders, 
  ChevronDown, 
  Layers, 
  ShieldAlert,
  Activity,
  Search,
  X
} from "lucide-react";

export default function OperationsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("CP-1024");
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simScenarioIdx, setSimScenarioIdx] = useState<number>(0);
  const [newSignalPulse, setNewSignalPulse] = useState<{ x: number; y: number; id: string } | null>(null);

  // Responsive Drawer states for Tablet / Mobile
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState<boolean>(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);

  // Fetch live operations data
  const fetchOperationsData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [incRes, teamsRes, actRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch("/api/teams"),
        fetch("/api/activity")
      ]);

      const incData = await incRes.json();
      const teamsData = await teamsRes.json();
      const actData = await actRes.json();

      if (incData.success) {
        setIncidents(incData.data);
        // Preserve selection or fallback to first critical incident
        if (!selectedIncidentId && incData.data.length > 0) {
          setSelectedIncidentId(incData.data[0].id);
        }
      }
      if (teamsData.success) setTeams(teamsData.data);
      if (actData.success) setActivities(actData.data);
    } catch (e) {
      console.error("Operations telemetry sync error:", e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [selectedIncidentId]);

  // Initial mount load
  useEffect(() => {
    fetchOperationsData(true);
  }, []);

  // Stable 6-second polling loop that does NOT reset selection or layout
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOperationsData(false);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchOperationsData]);

  // Squad assignment handler
  const handleAssignTeam = async (teamId: string, notes: string, workerId?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!selectedIncidentId) return { success: false, error: "No incident selected" };
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, workerId, instructions: notes }),
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

      await fetchOperationsData(false);
      return { success: true, data: data.data };
    } catch (e: any) {
      console.error("Assignment dispatch error:", e);
      return { success: false, error: e.message || "Network connection error while dispatching squad." };
    } finally {
      setIsDispatching(false);
    }
  };

  // Live Hackathon Signal Simulation Trigger
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIndex: simScenarioIdx }),
      });
      const data = await res.json();
      if (data.success) {
        setSimScenarioIdx((prev) => prev + 1);
        setNewSignalPulse({
          x: 42 + Math.random() * 16,
          y: 40 + Math.random() * 20,
          id: data.data.report?.id || "R-NEW",
        });
        setTimeout(() => setNewSignalPulse(null), 4500);

        if (data.data.incident?.id) {
          setSelectedIncidentId(data.data.incident.id);
        }
        await fetchOperationsData(false);
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Find currently active incident and assigned team
  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;
  const activeTeam = activeIncident?.assignedTeamId
    ? teams.find((t) => t.id === activeIncident.assignedTeamId)
    : null;

  // Key Telemetry Summary
  const criticalCount = incidents.filter((i) => i.priority === "critical" || i.priorityScore >= 80).length;
  const totalSignals = incidents.reduce((acc, i) => acc + (i.connectedReportsCount || 1), 0);
  const resolvedCount = incidents.filter((i) => i.status === "resolved" || i.status === "closed").length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-canvas overflow-hidden select-none font-sans text-text-primary">
      
      {/* ========================================================================= */}
      {/* TOP OPERATIONS CONTROL TOOLBAR                                            */}
      {/* ========================================================================= */}
      <header className="h-12 bg-surface-base border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 font-mono-data text-xs z-30">
        
        {/* Left: Operations Command Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
            <Radio className="w-4 h-4 text-civic-cyan animate-pulse" />
            <span className="hidden sm:inline">Operations Mission Control</span>
            <span className="sm:hidden">Ops Control</span>
          </div>
          <span className="badge-intelligence text-[10px] hidden 2xl:inline-flex">
            Urban Sector 3 Corridor
          </span>
        </div>

        {/* Center-Left: Quick Search CP Input */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // slight delay to allow onMouseDown on suggestion items to fire
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = searchQuery.toLowerCase().trim();
                const matched = incidents.find(i => 
                  i.id.toLowerCase() === q ||
                  i.id.toLowerCase().includes(q) ||
                  (i.title && i.title.toLowerCase().includes(q))
                );
                if (matched) {
                  setSelectedIncidentId(matched.id);
                  setIsMobilePreviewOpen(true);
                  setIsSearchFocused(false);
                }
              }
            }}
            placeholder="Find CP (e.g. CP-1024)..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-surface-elevated/80 border border-border-subtle hover:border-border-medium rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-cyan focus:ring-1 focus:ring-civic-cyan/50 font-mono-data transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-0.5 rounded"
              title="Clear search"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Quick Autocomplete Suggestions Dropdown */}
          {searchQuery.trim().length > 0 && isSearchFocused && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-elevated border border-border-medium rounded-lg shadow-elevation-lg overflow-hidden z-50 font-mono-data max-h-64 overflow-y-auto">
              {(() => {
                const q = searchQuery.toLowerCase().trim();
                const matches = incidents.filter(i => 
                  i.id.toLowerCase().includes(q) ||
                  (i.title && i.title.toLowerCase().includes(q)) ||
                  (i.address && i.address.toLowerCase().includes(q)) ||
                  (i.category && i.category.toLowerCase().includes(q))
                );

                if (matches.length === 0) {
                  return (
                    <div className="p-3 text-xs text-text-muted text-center font-sans">
                      No CP found matching &quot;{searchQuery}&quot;
                    </div>
                  );
                }

                return matches.slice(0, 5).map((inc) => {
                  const isCrit = inc.priorityScore >= 80;
                  const isH = inc.priorityScore >= 55 && inc.priorityScore < 80;
                  return (
                    <button
                      key={inc.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedIncidentId(inc.id);
                        setIsMobilePreviewOpen(true);
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-surface-highlight border-b border-border-subtle/50 last:border-0 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-civic-cyan">
                          <span>{inc.id}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-base text-text-secondary font-sans font-normal truncate">
                            {inc.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-sans text-text-secondary truncate mt-0.5">
                          {inc.title}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${
                        isCrit ? "text-civic-red" : isH ? "text-civic-amber" : "text-civic-cyan"
                      }`}>
                        {inc.priorityScore}/100
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Center: Real City Telemetry Summary Counters */}
        <div className="hidden xl:flex items-center gap-5 text-xs text-text-secondary shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">ACTIVE:</span>
            <span className="font-bold text-white">{incidents.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">CRITICAL:</span>
            <span className="font-bold text-civic-red">{criticalCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">SIGNALS:</span>
            <span className="font-bold text-civic-cyan">{totalSignals}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">RESTORED:</span>
            <span className="font-bold text-civic-green">{resolvedCount}</span>
          </div>
        </div>

        {/* Right: Hackathon Demonstration Action & Mobile Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Hackathon Demonstration Simulation Trigger */}
          <button
            onClick={handleTriggerSimulation}
            disabled={isSimulating}
            className="btn-intelligence py-1 px-3 text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
            title="Inject a real citizen signal to demonstrate real-time correlation and priority recalculation"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSimulating ? "Correlating Signal..." : "Inject Live Signal (Demo)"}</span>
            <span className="sm:hidden">{isSimulating ? "..." : "+ Signal"}</span>
          </button>

          {/* Mobile Queue Toggle */}
          <button
            onClick={() => setIsMobileQueueOpen(!isMobileQueueOpen)}
            className="md:hidden p-1.5 rounded-lg bg-surface-elevated border border-border-medium text-text-secondary hover:text-white"
            aria-label="Toggle Queue"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-surface-elevated border border-border-medium text-text-secondary hover:text-white flex items-center gap-1"
            aria-label="Toggle Preview"
          >
            <span className="text-[11px] font-bold text-civic-cyan">{selectedIncidentId}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 3-ZONE SPATIAL WORKSPACE                                                  */}
      {/* ========================================================================= */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* ZONE 1: PRIORITY QUEUE RAIL (Left 320px on Desktop) */}
        <PriorityQueueRail
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => {
            setSelectedIncidentId(id);
            setIsMobileQueueOpen(false);
          }}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isLoading={isLoading}
          className={`w-80 shrink-0 absolute md:relative z-20 h-full transition-transform duration-200 ${
            isMobileQueueOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        />

        {/* ZONE 2: SPATIAL CITY SIGNAL CANVAS (Center Living Twin) */}
        <main className="flex-1 relative h-full overflow-hidden bg-canvas flex flex-col" aria-label="City Spatial Canvas">
          <CitySignalCanvas
            interactive={true}
            incidents={incidents}
            activeIncidentId={selectedIncidentId}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              setIsMobilePreviewOpen(true);
            }}
            newSignalPulse={newSignalPulse}
            className="w-full h-full"
          />
        </main>

        {/* ZONE 3: INCIDENT OPERATIONAL PREVIEW (Right 384px on Desktop) */}
        <IncidentPreviewPanel
          incident={activeIncident}
          assignedTeam={activeTeam}
          allTeams={teams}
          onAssignTeam={handleAssignTeam}
          isDispatching={isDispatching}
          onClose={() => setIsMobilePreviewOpen(false)}
          className={`w-96 shrink-0 absolute lg:relative right-0 z-20 h-full transition-transform duration-200 ${
            isMobilePreviewOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        />

      </div>

      {/* ========================================================================= */}
      {/* LIVE ACTIVITY TICKER (Bottom 40px)                                        */}
      {/* ========================================================================= */}
      <LiveActivityTicker
        activities={activities}
        onSelectIncident={(id) => setSelectedIncidentId(id)}
      />

    </div>
  );
}
