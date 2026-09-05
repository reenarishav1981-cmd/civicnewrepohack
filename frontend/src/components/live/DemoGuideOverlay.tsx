"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  GraduationCap, 
  Layers, 
  Activity,
  Play
} from "lucide-react";

interface DemoGuideOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSimulation?: () => void;
}

const GUIDE_STEPS = [
  {
    step: 1,
    title: "Citizen Report Intake",
    subtitle: "Civic Signal Ingestion",
    description: "Citizens report potholes, water leakages, and hazards with GPS coordinates and photographic evidence. The system immediately ingests and indexes the raw signal.",
    highlight: "Citizen App → Camera Upload → Geolocation Anchoring",
    metric: "< 1.2s Latency",
  },
  {
    step: 2,
    title: "Multimodal AI Analysis",
    subtitle: "5 Deterministic Intelligence Engines",
    description: "Five specialized engines process the report concurrently: Semantic keyword analysis, Geospatial Great-Circle Haversine distance, Visual evidence inspection, Temporal recency, and Category classification.",
    highlight: "Semantic + Geospatial + Visual + Temporal + Category Engines",
    metric: "100% Explainable",
  },
  {
    step: 3,
    title: "Spatial-Semantic Correlation",
    subtitle: "Automated Duplicate Suppression",
    description: "When multiple citizens report the same road crater, CivicPulse calculates a multimodal fusion score (0-100%). Nearby duplicates are consolidated to prevent redundant work orders and accurately quantify affected citizens.",
    highlight: "Consolidation > 70% threshold without duplicate work orders",
    metric: "84% Match Score",
  },
  {
    step: 4,
    title: "Human-in-the-Loop Supervisory Decision",
    subtitle: "Affirmative Governance Guard",
    description: "The AI system does not possess autonomous dispatch authority. Municipal supervisors review AI correlation recommendations, with full power to accept or override with field rationale, logging telemetry to calculate Operator Agreement Rates.",
    highlight: "Operator Accept / Override with Telemetry Logging",
    metric: "88% Agreement Rate",
  },
  {
    step: 5,
    title: "Intelligent Team Dispatch",
    subtitle: "Proximity & Specialization Optimization",
    description: "Operations Control assigns the nearest specialized field squad (e.g. Rapid Road Squad Gamma). The assignment uses an atomic database transaction that locks the team and generates an immutable task for the designated crew leader.",
    highlight: "Atomic Assignment Transaction with Worker Data Isolation",
    metric: "1.2 km Distance",
  },
  {
    step: 6,
    title: "Field Execution & Verification Gate",
    subtitle: "Mandatory Before/After Proof",
    description: "Field workers transition tasks strictly: assigned → en_route → arrived → in_progress → completed. Task completion requires before/after photographic evidence. The incident moves to awaiting_verification—only a supervisor can sign off.",
    highlight: "Strict State Machine & Mandatory Evidence Upload",
    metric: "Zero False Closures",
  },
  {
    step: 7,
    title: "Predictive City Intelligence",
    subtitle: "Proactive Urban Health & Hotspots",
    description: "CivicPulse continuously evaluates spatial clusters, chronic infrastructure breakdown, and emerging spikes (with false-positive protection). The live City Health Score (0-100) guides municipal resource planning before crises escalate.",
    highlight: "Hotspots + Chronic Recurrence + City Health Score",
    metric: "Proactive Governance",
  },
];

export function DemoGuideOverlay({
  isOpen,
  onClose,
  onLaunchSimulation,
}: DemoGuideOverlayProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === GUIDE_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 font-mono text-xs space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              Smart City Evaluation Guide &bull; SIH Grand Finale Walkthrough
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-cyan-400 font-bold">
              STEP {currentStep.step} OF {GUIDE_STEPS.length}: {currentStep.subtitle.toUpperCase()}
            </span>
            <span className="text-slate-400">{Math.round(((currentStep.step) / GUIDE_STEPS.length) * 100)}% COMPLETE</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
              style={{ width: `${(currentStep.step / GUIDE_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content Card */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white">{currentStep.title}</h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] font-bold border border-slate-700">
              {currentStep.metric}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {currentStep.description}
          </p>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <strong>Key Architecture:</strong> {currentStep.highlight}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {onLaunchSimulation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchSimulation();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-colors shadow-lg shadow-pink-600/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Live Demo Scenario</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={() => setCurrentStepIdx((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish Guide</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
