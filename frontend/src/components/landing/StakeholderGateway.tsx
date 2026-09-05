import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Shield, HardHat, CheckCircle2, Radio, Sparkles, Navigation } from "lucide-react";

export function StakeholderGateway() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle bg-surface-base font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
            Stakeholder Ecosystem
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            One System. Three Operational Perspectives.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Tailored, low-cognitive-load interfaces engineered for the specific reality of every civic participant.
          </p>
        </div>

        {/* 3 Distinct Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Citizen Perspective */}
          <div className="p-6 sm:p-7 rounded-2xl bg-surface-elevated border border-civic-cyan/30 flex flex-col justify-between space-y-6 hover:border-civic-cyan/60 transition-all font-mono-data text-xs group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-civic-cyan/15 text-civic-cyan border border-civic-cyan/30 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              
              <div className="space-y-1 font-sans">
                <div className="text-[10px] text-civic-cyan font-mono-data uppercase font-bold">
                  Public Entry Layer
                </div>
                <h3 className="text-xl font-bold text-white">
                  Citizen Reporting
                </h3>
              </div>

              <p className="text-xs text-text-secondary font-sans leading-relaxed">
                Simple, fast, mobile-first issue reporting with live transparent correlation feedback and zero bureaucratic friction.
              </p>

              <ul className="space-y-2 text-[11px] text-text-muted font-sans pt-2 border-t border-border-subtle">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                  <span>Real-time AI correlation preview</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                  <span>Browser GPS &amp; sector mesh</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                  <span>Live community observation tracking</span>
                </li>
              </ul>
            </div>

            <Link
              href="/citizen"
              className="btn-primary py-3 text-xs font-bold font-sans flex items-center justify-center gap-2 w-full"
            >
              <span>Launch Citizen Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Operations Perspective */}
          <div className="p-6 sm:p-7 rounded-2xl bg-surface-elevated border border-civic-blue/40 flex flex-col justify-between space-y-6 hover:border-civic-blue/80 transition-all font-mono-data text-xs group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-civic-blue/15 text-civic-blue border border-civic-blue/30 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              
              <div className="space-y-1 font-sans">
                <div className="text-[10px] text-civic-blue font-mono-data uppercase font-bold">
                  Municipal Mission Control
                </div>
                <h3 className="text-xl font-bold text-white">
                  Operations Command
                </h3>
              </div>

              <p className="text-xs text-text-secondary font-sans leading-relaxed">
                Spatial intelligence grid for municipal dispatchers to triage clustered incidents, inspect explainable AI factors, and assign squads.
              </p>

              <ul className="space-y-2 text-[11px] text-text-muted font-sans pt-2 border-t border-border-subtle">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-blue shrink-0" />
                  <span>Dynamic Priority Queue &amp; Geo Grid</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-blue shrink-0" />
                  <span>Signal Constellation Dossier View</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-blue shrink-0" />
                  <span>1-Click Squad Dispatch &amp; Timeline</span>
                </li>
              </ul>
            </div>

            <Link
              href="/operations"
              className="btn-secondary py-3 text-xs font-bold font-sans flex items-center justify-center gap-2 w-full border-civic-blue/40 hover:border-civic-blue"
            >
              <span>Open Command Center</span>
              <ArrowRight className="w-3.5 h-3.5 text-civic-blue" />
            </Link>
          </div>

          {/* Card 3: Field Worker Perspective */}
          <div className="p-6 sm:p-7 rounded-2xl bg-surface-elevated border border-civic-green/30 flex flex-col justify-between space-y-6 hover:border-civic-green/60 transition-all font-mono-data text-xs group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-civic-green/15 text-civic-green border border-civic-green/30 flex items-center justify-center">
                <HardHat className="w-6 h-6" />
              </div>
              
              <div className="space-y-1 font-sans">
                <div className="text-[10px] text-civic-green font-mono-data uppercase font-bold">
                  Last-Mile Execution
                </div>
                <h3 className="text-xl font-bold text-white">
                  Field Worker Hub
                </h3>
              </div>

              <p className="text-xs text-text-secondary font-sans leading-relaxed">
                Rugged, high-contrast mobile execution HUD for on-site crews to navigate, execute repair stages, and submit verified completion proof.
              </p>

              <ul className="space-y-2 text-[11px] text-text-muted font-sans pt-2 border-t border-border-subtle">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0" />
                  <span>5-Stage lifecycle stepper HUD</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0" />
                  <span>Google Maps navigation deep link</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0" />
                  <span>Before/After restoration verification</span>
                </li>
              </ul>
            </div>

            <Link
              href="/field"
              className="px-4 py-3 rounded-xl border border-civic-green/30 bg-surface-base hover:bg-civic-green/10 text-white transition-all text-xs font-bold flex items-center justify-center gap-2 w-full font-sans"
            >
              <span>Access Field Hub</span>
              <ArrowRight className="w-3.5 h-3.5 text-civic-green" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}

export default StakeholderGateway;
