"use client";

import React from "react";
import { Play, Pause, StepForward, RotateCcw, X, ShieldAlert, Sparkles } from "lucide-react";

interface DemoSimulationControlsProps {
  isRunning: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStepTitle?: string;
  onStart: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onExit: () => void;
  className?: string;
}

export function DemoSimulationControls({
  isRunning,
  currentStepIndex,
  totalSteps,
  currentStepTitle = "Citizen Submits Report",
  onStart,
  onPause,
  onStepForward,
  onReset,
  onExit,
  className = "",
}: DemoSimulationControlsProps) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-r from-pink-950/70 via-slate-900 to-purple-950/70 border border-pink-500/50 shadow-2xl font-mono text-xs flex flex-wrap items-center justify-between gap-4 ${className}`}>
      
      {/* Badge & Stage Info */}
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 rounded-lg bg-pink-500 text-slate-950 font-black text-[10px] tracking-wider uppercase animate-pulse">
          DEMO SIMULATION MODE
        </span>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-pink-300 font-bold">
              STEP {currentStepIndex + 1} OF {totalSteps}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-[10px] text-slate-300 font-bold font-sans">
              {currentStepTitle}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 block font-sans">
            Deterministic 30s scenario &bull; Zero database contamination &bull; In-memory execution
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
            title="Pause Simulation"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold transition-all shadow-lg shadow-pink-500/20"
            title="Start Simulation"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Scenario</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStepForward}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all"
          title="Advance exactly one step"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span>Step</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-all"
          title="Reset to T+0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset T+0</span>
        </button>

        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-red-400 font-bold border border-red-500/30 transition-all ml-2"
          title="Exit Demo Mode"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Demo</span>
        </button>
      </div>

    </div>
  );
}
