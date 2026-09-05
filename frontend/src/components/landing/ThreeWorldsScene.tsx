"use client";

import React from "react";
import Link from "next/link";
import { 
  Smartphone, 
  ShieldAlert, 
  HardHat, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export const ThreeWorldsScene: React.FC = () => {
  const worlds = [
    {
      title: "CITIZEN PORTAL",
      tagline: "Human. Simple. Connected.",
      href: "/citizen",
      icon: Smartphone,
      accent: "text-civic-cyan",
      badge: "badge-intelligence",
      desc: "Fast guided reporting in under 30 seconds. Real-time correlation prevents duplicate fatigue by linking similar nearby complaints automatically.",
      features: [
        "Live debounced duplicate detection",
        "Visual photo upload & GPS tagging",
        "Real-time ticket tracking feed",
      ],
      cta: "Open Citizen Portal",
    },
    {
      title: "OPERATIONS COMMAND",
      tagline: "Spatial. Dense. Mission-Critical.",
      href: "/operations",
      icon: ShieldAlert,
      accent: "text-civic-blue",
      badge: "badge-neutral",
      desc: "Full-viewport spatial intelligence map with live incident cluster ranking, explainable AI factor breakdowns, and single-click squad dispatch.",
      features: [
        "Dynamic 0-100 priority engine",
        "Contextual incident dossier drawer",
        "Real-time telemetry activity stream",
      ],
      cta: "Open Operations Center",
    },
    {
      title: "FIELD WORKER HUB",
      tagline: "High-Contrast. Touch-First. Actionable.",
      href: "/field",
      icon: HardHat,
      accent: "text-civic-green",
      badge: "badge-resolved",
      desc: "Designed for outdoor sunlight and one-handed mobile operation. 5-stage touch progression bar with before/after evidence capture.",
      features: [
        "5-stage task lifecycle HUD",
        "Clear operations work notes",
        "Instant before/after photo upload",
      ],
      cta: "Open Field Worker Hub",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border-subtle relative bg-void">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="badge-intelligence">
            THE UNIFIED CIVIC ECOSYSTEM
          </div>
          <h2 className="heading-section text-white">
            Three Experiences. One Response Loop.
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto font-sans">
            Every user interacts with an experience tailored specifically to their environment, while sharing the same unified real-time database.
          </p>
        </div>

        {/* 3 Connected World Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono-data">
          {worlds.map((w, idx) => {
            const Icon = w.icon;
            return (
              <div
                key={w.title}
                className="p-6 card-elevated hover:border-border-accent transition-all flex flex-col justify-between space-y-6 relative group shadow-elevation-md"
              >
                {/* Step Connector Number */}
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className={w.badge}>{w.title}</span>
                  </div>
                  <span className="text-xs font-bold text-text-muted">0{idx + 1}</span>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-base border border-border-medium flex items-center justify-center shadow-sm">
                    <Icon className={`w-6 h-6 ${w.accent}`} />
                  </div>
                  <div className="text-xs text-text-secondary">{w.tagline}</div>
                  <p className="text-xs text-text-primary font-sans leading-relaxed">
                    {w.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
                  {w.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                      <span className="font-sans text-[11px]">{f}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={w.href}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>{w.cta}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
