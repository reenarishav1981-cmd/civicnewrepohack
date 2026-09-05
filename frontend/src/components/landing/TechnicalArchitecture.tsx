import React from "react";
import { Server, Layers, Cpu, Database, CheckCircle2, Shield } from "lucide-react";

export function TechnicalArchitecture() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
            System Design &amp; Stack
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Technical Architecture &amp; Stack
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Engineered as a high-integrity, full-stack Next.js 14 operational system with zero mock wrappers and 100% deterministic mathematical execution.
          </p>
        </div>

        {/* 4-Layer Architecture Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-data text-xs">
          
          {/* Layer 1: Experience Layer */}
          <div className="p-5 rounded-2xl bg-surface-base border border-border-medium space-y-3">
            <div className="flex items-center gap-2 text-civic-cyan font-bold uppercase tracking-wider pb-2 border-b border-border-subtle">
              <Layers className="w-4 h-4" />
              <span>1. Experience Layer</span>
            </div>
            <ul className="space-y-2 text-[11px] text-text-secondary font-sans">
              <li>&bull; <strong className="text-white">Next.js 14 App Router</strong> (TypeScript)</li>
              <li>&bull; <strong className="text-white">Design Token System</strong> (Tailwind)</li>
              <li>&bull; <strong className="text-white">Mobile-First HUD</strong> (48px touch targets)</li>
              <li>&bull; <strong className="text-white">ARIA-Live</strong> for accessibility</li>
            </ul>
          </div>

          {/* Layer 2: Domain API Layer */}
          <div className="p-5 rounded-2xl bg-surface-base border border-border-medium space-y-3">
            <div className="flex items-center gap-2 text-civic-blue font-bold uppercase tracking-wider pb-2 border-b border-border-subtle">
              <Server className="w-4 h-4" />
              <span>2. Domain REST APIs</span>
            </div>
            <ul className="space-y-2 text-[11px] text-text-secondary font-sans">
              <li>&bull; <strong className="text-white">10 Native Endpoints</strong> (/api/*)</li>
              <li>&bull; <strong className="text-white">Non-mutating Previews</strong> (/reports/preview)</li>
              <li>&bull; <strong className="text-white">Lifecycle Mutations</strong> (/tasks/[id]/status)</li>
              <li>&bull; <strong className="text-white">Audit Event Streaming</strong> (/activity)</li>
            </ul>
          </div>

          {/* Layer 3: Intelligence Layer */}
          <div className="p-5 rounded-2xl bg-surface-base border border-border-medium space-y-3">
            <div className="flex items-center gap-2 text-civic-amber font-bold uppercase tracking-wider pb-2 border-b border-border-subtle">
              <Cpu className="w-4 h-4" />
              <span>3. Intelligence Core</span>
            </div>
            <ul className="space-y-2 text-[11px] text-text-secondary font-sans">
              <li>&bull; <strong className="text-white">Cosine Vector Embeddings</strong> (Text)</li>
              <li>&bull; <strong className="text-white">Haversine Geo Engine</strong> (650m)</li>
              <li>&bull; <strong className="text-white">Multi-Factor Risk Scoring</strong> (0-100)</li>
              <li>&bull; <strong className="text-white">Sensitive Anchor Proximity</strong></li>
            </ul>
          </div>

          {/* Layer 4: Storage Layer */}
          <div className="p-5 rounded-2xl bg-surface-base border border-border-medium space-y-3">
            <div className="flex items-center gap-2 text-civic-green font-bold uppercase tracking-wider pb-2 border-b border-border-subtle">
              <Database className="w-4 h-4" />
              <span>4. Prototype Storage</span>
            </div>
            <ul className="space-y-2 text-[11px] text-text-secondary font-sans">
              <li>&bull; <strong className="text-white">Singleton In-Memory DB</strong> (db.ts)</li>
              <li>&bull; <strong className="text-white">Relational Foreign Keys</strong> (id linkages)</li>
              <li>&bull; <strong className="text-white">Audited Event Timelines</strong></li>
              <li>&bull; <strong className="text-white">Production DB Ready</strong> (Postgres)</li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}

export default TechnicalArchitecture;
