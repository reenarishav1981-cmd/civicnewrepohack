"use client";

import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Sparkles, 
  AlertTriangle, 
  Truck, 
  HardHat, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight
} from "lucide-react";

export const LifecycleExperience: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "REPORT",
      role: "Citizen Voice",
      icon: Smartphone,
      accent: "text-civic-cyan",
      badge: "badge-intelligence",
      heading: "Citizen identifies road damage outside school",
      desc: "A resident captures a photo of a dangerous crater outside St. Xavier's School and submits coordinates in 20 seconds.",
      metricLabel: "Initial Status",
      metricValue: "Signal Ingested (R-8801)",
    },
    {
      num: "02",
      title: "CONNECT",
      role: "AI Correlation",
      icon: Sparkles,
      accent: "text-civic-cyan",
      badge: "badge-intelligence",
      heading: "System links 18 independent reports into 1 case",
      desc: "Mathematical cosine similarity and geospatial clustering group 18 different complaint descriptions into canonical incident CP-1024.",
      metricLabel: "Correlation Confidence",
      metricValue: "94.2% Multi-Factor Match",
    },
    {
      num: "03",
      title: "PRIORITIZE",
      role: "Priority Engine",
      icon: AlertTriangle,
      accent: "text-civic-red",
      badge: "badge-critical",
      heading: "Escalates to CRITICAL (92/100) automatically",
      desc: "High signal velocity + school zone pedestrian vulnerability automatically raises priority to the top of the Operations queue.",
      metricLabel: "Priority Score",
      metricValue: "92 / 100 (Critical Escalation)",
    },
    {
      num: "04",
      title: "DISPATCH",
      role: "Operations Command",
      icon: Truck,
      accent: "text-civic-blue",
      badge: "badge-neutral",
      heading: "PWD Road Maintenance Alpha squad dispatched",
      desc: "Operations controller reviews the explainable AI dossier and routes the nearest specialized asphalt crew with 1 click.",
      metricLabel: "Dispatched Squad",
      metricValue: "Road Maintenance Alpha",
    },
    {
      num: "05",
      title: "EXECUTE",
      role: "Field Response",
      icon: HardHat,
      accent: "text-civic-amber",
      badge: "badge-high",
      heading: "Crew arrives, excavates, and compacts asphalt",
      desc: "Field lead progresses task through 5-stage touch HUD ([Arrived] -> [Work Started] -> [Evidence Uploaded]).",
      metricLabel: "Field Progress",
      metricValue: "Compaction Completed",
    },
    {
      num: "06",
      title: "RESOLVE",
      role: "Closed-Loop Proof",
      icon: CheckCircle2,
      accent: "text-civic-green",
      badge: "badge-resolved",
      heading: "Before/After evidence verified & case closed",
      desc: "High-resolution photographic evidence is verified. Incident CP-1024 is officially closed, notifying all 18 contributing citizens.",
      metricLabel: "Final Outcome",
      metricValue: "Verified Restored (Closed)",
    },
  ];

  // Auto-cycle through steps if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [steps.length]);

  const current = steps[activeStep];
  const Icon = current.icon;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border-subtle bg-surface-base/30 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="badge-intelligence">
            THE CONTINUOUS CIVIC PULSE
          </div>
          <h2 className="heading-section text-white">
            From First Signal to Verified Closure
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto font-sans">
            Follow the journey of an incident through the 6 stages of the CivicPulse operating system.
          </p>
        </div>

        {/* 6 Step Progress Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono-data text-xs">
          {steps.map((stg, i) => {
            const isCurrent = i === activeStep;
            const isPast = i < activeStep;
            return (
              <button
                key={stg.num}
                onClick={() => setActiveStep(i)}
                className={`p-3 rounded-md text-left transition-all cursor-pointer border ${
                  isCurrent
                    ? "bg-surface-elevated border-border-accent shadow-sm"
                    : isPast
                    ? "bg-surface-base/80 border-border-subtle text-text-secondary"
                    : "bg-surface-base/40 border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                  <span className={isCurrent ? "text-civic-cyan" : "text-text-muted"}>{stg.num}</span>
                  <span className="text-[9px] uppercase text-text-secondary">{stg.role.split(" ")[0]}</span>
                </div>
                <div className={`font-bold uppercase tracking-wider ${isCurrent ? "text-white" : "text-text-secondary"}`}>
                  {stg.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Display Panel */}
        <div className="p-6 sm:p-8 card-focal shadow-elevation-high font-mono-data">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Cols: Stage Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className={current.badge}>{current.role}</span>
                <span className="text-xs text-text-muted">&bull; STAGE {current.num} OF 06</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
                {current.heading}
              </h3>

              <p className="text-sm text-text-secondary font-sans leading-relaxed">
                {current.desc}
              </p>

              <div className="p-4 rounded-md bg-surface-base border border-border-subtle flex items-center justify-between text-xs">
                <span className="text-text-secondary">{current.metricLabel}:</span>
                <span className="font-bold text-white">{current.metricValue}</span>
              </div>
            </div>

            {/* Right 5 Cols: Visual Stage Indicator */}
            <div className="lg:col-span-5 p-6 rounded-md bg-void border border-border-subtle flex flex-col items-center justify-center text-center space-y-4 h-64">
              <div className="w-16 h-16 rounded-xl bg-surface-elevated border border-border-medium flex items-center justify-center shadow-elevation-md">
                <Icon className={`w-8 h-8 ${current.accent}`} />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase">Lifecycle Position</div>
                <div className="text-base font-bold text-white font-sans mt-0.5">
                  Phase {current.num} &bull; {current.title}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>Next Stage:</span>
                <span className="text-civic-cyan font-bold">{steps[(activeStep + 1) % steps.length].title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
