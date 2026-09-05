"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Radio,
  Building2,
  TrendingUp,
  Flame,
  MapPin
} from "lucide-react";
import { ExecutiveHeader } from "@/components/executive/ExecutiveHeader";
import { DecisionPriorityBanner } from "@/components/executive/DecisionPriorityBanner";
import { TrajectoryComparisonCard } from "@/components/executive/TrajectoryComparisonCard";
import { DepartmentPerformanceTable } from "@/components/executive/DepartmentPerformanceTable";
import { AreaPerformanceGrid } from "@/components/executive/AreaPerformanceGrid";
import { AreaDossierDrawer } from "@/components/executive/AreaDossierDrawer";
import { DecisionQueueList } from "@/components/executive/DecisionQueueList";
import { DecisionDetailModal } from "@/components/executive/DecisionDetailModal";
import { 
  ExecutiveIntelligenceSnapshot, 
  DecisionRecommendation, 
  AreaPerformanceProfile 
} from "@/lib/executive";

export default function ExecutiveCockpitPage() {
  const [snapshot, setSnapshot] = useState<ExecutiveIntelligenceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal & Drawer selections
  const [selectedRecommendation, setSelectedRecommendation] = useState<DecisionRecommendation | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaPerformanceProfile | null>(null);

  const fetchExecutiveData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/executive/overview");
      if (res.status === 401 || res.status === 403) {
        setErrorMsg("Access restricted: Senior Municipal Operator or Administrator authentication required.");
        return;
      }

      const data = await res.json();
      if (data.success && data.data) {
        setSnapshot(data.data);
      } else {
        setErrorMsg("Failed to synchronize executive intelligence snapshot.");
      }
    } catch (e) {
      console.error("Executive fetch error:", e);
      setErrorMsg("Network error connecting to municipal decision telemetry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveData();
  }, [fetchExecutiveData]);

  const pendingCount = snapshot?.recommendations.filter((r) => r.status === "PENDING").length ?? 0;

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 font-sans pb-24">
      
      {/* ========================================================================= */}
      {/* TOP EXECUTIVE HEADER                                                      */}
      {/* ========================================================================= */}
      <ExecutiveHeader
        cityHealth={snapshot?.cityHealth}
        pressure={snapshot?.operationalPressure}
        pendingDecisionsCount={pendingCount}
        onRefresh={fetchExecutiveData}
        isLoading={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={fetchExecutiveData}
              className="px-3 py-1 rounded-lg bg-red-900/60 border border-red-500/50 text-white font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton Indicator */}
        {isLoading && !snapshot && (
          <div className="p-12 text-center text-slate-500 font-mono text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p>Evaluating multi-department SLAs, zone pressure, and counterfactual trajectories...</p>
          </div>
        )}

        {snapshot && (
          <>
            {/* ========================================================================= */}
            {/* SECTION 1: TODAY'S DECISION PRIORITIES                                    */}
            {/* ========================================================================= */}
            <DecisionPriorityBanner
              recommendations={snapshot.recommendations}
              onSelectRecommendation={(rec) => setSelectedRecommendation(rec)}
            />

            {/* ========================================================================= */}
            {/* SECTION 2: WHAT HAPPENS IF WE DO NOTHING? (Trajectory Models)              */}
            {/* ========================================================================= */}
            <TrajectoryComparisonCard projections={snapshot.projections} />

            {/* ========================================================================= */}
            {/* SECTION 3: DEPARTMENT PERFORMANCE MATRIX                                  */}
            {/* ========================================================================= */}
            <DepartmentPerformanceTable departments={snapshot.departments} />

            {/* ========================================================================= */}
            {/* SECTION 4: GEOGRAPHIC AREA PERFORMANCE GRID                               */}
            {/* ========================================================================= */}
            <AreaPerformanceGrid
              areas={snapshot.areas}
              onSelectArea={(area) => setSelectedArea(area)}
            />

            {/* ========================================================================= */}
            {/* SECTION 5: EXECUTIVE DECISION QUEUE                                       */}
            {/* ========================================================================= */}
            <DecisionQueueList
              recommendations={snapshot.recommendations}
              onSelectRecommendation={(rec) => setSelectedRecommendation(rec)}
            />
          </>
        )}

      </main>

      {/* ========================================================================= */}
      {/* AREA DOSSIER DRAWER                                                       */}
      {/* ========================================================================= */}
      <AreaDossierDrawer
        area={selectedArea}
        onClose={() => setSelectedArea(null)}
      />

      {/* ========================================================================= */}
      {/* DECISION DETAIL & ACTION MODAL                                            */}
      {/* ========================================================================= */}
      <DecisionDetailModal
        recommendation={selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
        onDecisionSubmitted={fetchExecutiveData}
      />

    </div>
  );
}
