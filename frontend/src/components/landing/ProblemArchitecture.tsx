import React from "react";
import { AlertTriangle, CheckCircle2, ArrowRight, XCircle } from "lucide-react";

export function ProblemArchitecture() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
            Operational Dilemma
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Why Traditional Municipal Reporting Fails
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Standard city helplines treat every incoming complaint as an isolated ticket. When 50 citizens report the same water main rupture, dispatchers are overwhelmed with duplicate noise while actual emergency severity remains hidden.
          </p>
        </div>

        {/* 2-Column Comparison Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Fragmented Chaos */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-base border border-civic-red/30 space-y-6 font-mono-data text-xs">
            <div className="flex items-center gap-2 text-civic-red font-bold uppercase tracking-wider pb-3 border-b border-border-subtle">
              <XCircle className="w-5 h-5" />
              <span>Fragmented Legacy Workflow</span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-red font-mono-data uppercase font-bold">01. Scattered Observations</span>
                <p className="text-text-secondary">50 citizens submit separate tickets across WhatsApp, portals, and call centers.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-red font-mono-data uppercase font-bold">02. Manual Triage Bottleneck</span>
                <p className="text-text-secondary">Operators spend hours manually reading identical complaints with zero spatial correlation.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-red font-mono-data uppercase font-bold">03. Blind First-In-First-Out Dispatch</span>
                <p className="text-text-secondary">Minor complaints receive the same priority as fatal structural bridge hazards.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-red font-mono-data uppercase font-bold">04. Unverified Closure</span>
                <p className="text-text-secondary">Tickets marked &quot;Closed&quot; on paper with zero physical photographic proof.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Connected CivicPulse Workflow */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-base border border-civic-cyan/30 space-y-6 font-mono-data text-xs">
            <div className="flex items-center gap-2 text-civic-cyan font-bold uppercase tracking-wider pb-3 border-b border-border-subtle">
              <CheckCircle2 className="w-5 h-5" />
              <span>The CivicPulse Connected System</span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-cyan font-mono-data uppercase font-bold">01. Intelligent Clustering</span>
                <p className="text-text-secondary">AI vector embeddings + Haversine geo-distance instantly cluster duplicate reports into 1 master case file.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-cyan font-mono-data uppercase font-bold">02. Explainable Risk Scoring</span>
                <p className="text-text-secondary">Priority (0-100) dynamically calculated from signal surge volume, safety keywords, and sensitive anchors.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-cyan font-mono-data uppercase font-bold">03. Coordinated Field Work Orders</span>
                <p className="text-text-secondary">Specialized squads dispatched with direct navigation, location coordinates, and operational briefings.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
                <span className="text-[10px] text-civic-cyan font-mono-data uppercase font-bold">04. Verifiable Photographic Resolution</span>
                <p className="text-text-secondary">Before/after physical evidence locked into the public municipal audit ledger.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default ProblemArchitecture;
