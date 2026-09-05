import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  Users, 
  HardHat, 
  CheckCircle2, 
  ArrowRight,
  Radio
} from "lucide-react";

const STAGES = [
  {
    step: "01",
    title: "Citizen Signal Capture",
    icon: FileText,
    route: "/citizen",
    routeLabel: "Citizen Portal",
    summary: "Citizens submit observations via web GPS or sector presets with optional photos.",
    details: "Inputs are immediately vectorized into semantic embeddings. Real-time debounced preview queries active incidents within 650m radius without database mutation.",
  },
  {
    step: "02",
    title: "AI Signal Correlation",
    icon: Sparkles,
    route: null,
    routeLabel: null,
    summary: "Evaluates multi-factor composite confidence across 3 distinct dimensional signals.",
    details: "Weights 40% Cosine Text Similarity, 40% Haversine Geographic Proximity, and 20% Category Match. Signals exceeding 72% confidence are automatically clustered into 1 master case file.",
  },
  {
    step: "03",
    title: "Incident Intelligence",
    icon: ShieldAlert,
    route: "/operations",
    routeLabel: "Command Center",
    summary: "Clustered signals generate or update a master Incident Case File (e.g. CP-1024).",
    details: "Priority score (0-100) dynamically scales based on keyword severity, signal surge velocity, and proximity to sensitive infrastructure anchors (schools, hospitals, transit hubs).",
  },
  {
    step: "04",
    title: "Operations Decision",
    icon: Users,
    route: "/operations",
    routeLabel: "Command Center",
    summary: "Command operators inspect the Incident Dossier and dispatch specialized squads.",
    details: "Operators review signal constellation maps, AI factor breakdowns, and squad readiness before issuing binding field work orders with specific instructions.",
  },
  {
    step: "05",
    title: "Field Execution HUD",
    icon: HardHat,
    route: "/field",
    routeLabel: "Field Worker Hub",
    summary: "Dispatched squads progress through the 5-stage physical execution lifecycle.",
    details: "Workers advance: Assigned → En Route → Arrived → In Progress → Completed via mobile HUD with Google Maps deep-links and on-site notes.",
  },
  {
    step: "06",
    title: "Verified Resolution",
    icon: CheckCircle2,
    route: "/operations",
    routeLabel: "View Dossier",
    summary: "Restoration proof is locked into the incident audit timeline.",
    details: "Before/after physical evidence and completion timestamps synchronize across all operational dashboards, closing the loop with complete public transparency.",
  },
];

export function CivicIntelligenceLoop() {
  const [activeStage, setActiveStage] = useState(0);
  const current = STAGES[activeStage];
  const Icon = current.icon;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle bg-surface-base font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Operational Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            The CivicPulse Intelligence Loop
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            One continuous operational path from fragmented human observation to verified municipal restoration.
          </p>
        </div>

        {/* 6-Stage Interactive Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono-data text-xs">
          {STAGES.map((stg, idx) => {
            const isSelected = idx === activeStage;
            const StepIcon = stg.icon;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStage(idx)}
                className={`p-3 rounded-xl border text-left transition-all space-y-1.5 min-h-[48px] ${
                  isSelected
                    ? "bg-surface-elevated border-border-focus text-white ring-1 ring-civic-cyan/40 shadow-elevation-sm"
                    : "bg-surface-base border-border-subtle text-text-secondary hover:text-white hover:border-border-medium"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${isSelected ? "text-civic-cyan" : "text-text-muted"}`}>
                    STAGE {stg.step}
                  </span>
                  <StepIcon className={`w-3.5 h-3.5 ${isSelected ? "text-civic-cyan" : "text-text-muted"}`} />
                </div>
                <div className="text-xs font-bold truncate font-sans text-white">
                  {stg.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep Dive Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface-elevated border border-border-medium space-y-6 font-mono-data text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-civic-cyan/15 text-civic-cyan border border-civic-cyan/30">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-civic-cyan uppercase font-bold">
                  STAGE {current.step} IN DETAIL
                </span>
                <h3 className="text-xl font-bold text-white font-sans">
                  {current.title}
                </h3>
              </div>
            </div>

            {current.route && (
              <Link
                href={current.route}
                className="btn-primary py-2 px-4 text-xs font-bold font-sans flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Open {current.routeLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-sans">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-muted font-mono-data uppercase">
                Operational Purpose:
              </span>
              <p className="text-text-primary leading-relaxed text-xs sm:text-sm">
                {current.summary}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-muted font-mono-data uppercase">
                Technical Execution:
              </span>
              <p className="text-text-secondary leading-relaxed text-xs sm:text-sm">
                {current.details}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default CivicIntelligenceLoop;
