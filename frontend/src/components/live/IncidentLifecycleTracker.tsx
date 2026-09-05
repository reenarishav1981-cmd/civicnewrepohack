"use client";

import React from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, Activity } from "lucide-react";

interface IncidentLifecycleTrackerProps {
  currentStage: string;
  incidentId?: string;
  className?: string;
}

const STAGES = [
  { key: "report", name: "Report Received", code: "new" },
  { key: "ai", name: "AI Analysis", code: "analyzing" },
  { key: "operator", name: "Operator Review", code: "operator_review" },
  { key: "assigned", name: "Team Dispatched", code: "assigned" },
  { key: "progress", name: "Work in Progress", code: "in_progress" },
  { key: "verification", name: "Field Verification", code: "awaiting_verification" },
  { key: "resolved", name: "Resolved & Closed", code: "resolved" },
];

export function IncidentLifecycleTracker({
  currentStage,
  incidentId,
  className = "",
}: IncidentLifecycleTrackerProps) {
  // Determine active index
  const normalizedStage = (currentStage || "new").toLowerCase();

  let activeIndex = 0;
  if (normalizedStage.includes("analyz")) activeIndex = 1;
  else if (normalizedStage.includes("review") || normalizedStage.includes("correlated") || normalizedStage.includes("approved")) activeIndex = 2;
  else if (normalizedStage.includes("assign") || normalizedStage.includes("en_route")) activeIndex = 3;
  else if (normalizedStage.includes("progress") || normalizedStage.includes("arrived")) activeIndex = 4;
  else if (normalizedStage.includes("verif") || normalizedStage.includes("completed") || normalizedStage.includes("inspection")) activeIndex = 5;
  else if (normalizedStage.includes("resolv") || normalizedStage.includes("close")) activeIndex = 6;

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Live Incident Lifecycle Pipeline {incidentId ? `&bull; ${incidentId}` : ""}
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold">
          STAGE {activeIndex + 1} OF {STAGES.length}
        </span>
      </div>

      {/* Pipeline Steps Flow */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
        {STAGES.map((stg, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={stg.key}>
              <div className="flex flex-col items-center text-center space-y-1.5 min-w-[90px]">
                
                {/* Node icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted
                      ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                      : isCurrent
                      ? "bg-cyan-950 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 animate-pulse"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Title */}
                <span
                  className={`text-[10px] font-bold ${
                    isCompleted
                      ? "text-emerald-400 font-sans"
                      : isCurrent
                      ? "text-white font-sans font-black"
                      : "text-slate-600 font-sans"
                  }`}
                >
                  {stg.name}
                </span>

                <span className="text-[8px] text-slate-500 uppercase">
                  {isCompleted ? "COMPLETED" : isCurrent ? "ACTIVE" : "PENDING"}
                </span>
              </div>

              {idx < STAGES.length - 1 && (
                <ChevronRight
                  className={`w-4 h-4 shrink-0 -mt-5 ${
                    idx < activeIndex ? "text-emerald-500" : "text-slate-800"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}
