import React from "react";
import { CheckCircle2, ShieldCheck, Zap, Radio, Sparkles, Navigation, Layers } from "lucide-react";

const CAPABILITIES = [
  {
    title: "Multi-Factor Signal Correlation",
    desc: "Cosine text vectorization + 650m Haversine proximity + category matching clusters duplicate reports automatically.",
    icon: Sparkles,
  },
  {
    title: "Non-Mutating Real-Time Preview",
    desc: "Debounced live preview lets citizens and operators evaluate AI correlation without altering database state.",
    icon: Radio,
  },
  {
    title: "Dynamic Risk Scoring (0-100)",
    desc: "Multi-factor priority scales dynamically from hazard vocabulary, community surge volume, and sensitive anchors.",
    icon: ShieldCheck,
  },
  {
    title: "Explainable AI Factor Breakdown",
    desc: "Every priority score and correlation candidate includes human-readable mathematical justification badges.",
    icon: Layers,
  },
  {
    title: "5-Stage Field Execution Lifecycle",
    desc: "Mobile-first work order HUD tracks real progress: Assigned → En Route → Arrived → In Progress → Completed.",
    icon: Navigation,
  },
  {
    title: "Cross-System State Propagation",
    desc: "Field resolutions and citizen submissions instantly synchronize across Command Center and Incident Dossiers.",
    icon: Zap,
  },
];

export function SystemCapabilities() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle bg-surface-base font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
            Verified Functionality
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Core System Capabilities
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Every capability listed here is backed by real operational code, active REST APIs, and running domain state machines.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono-data text-xs">
          {CAPABILITIES.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-elevated border border-border-subtle hover:border-border-medium transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-civic-cyan/10 text-civic-cyan border border-civic-cyan/20 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">
                  {cap.title}
                </h3>
                <p className="text-xs text-text-secondary font-sans leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default SystemCapabilities;
