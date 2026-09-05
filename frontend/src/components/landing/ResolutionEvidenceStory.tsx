import React from "react";
import { CheckCircle2, ShieldCheck, Camera, ArrowRight } from "lucide-react";

export function ResolutionEvidenceStory() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border-subtle bg-surface-base font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="font-mono-data text-xs font-bold text-civic-green uppercase tracking-wider flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verifiable Accountability</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Resolution Is an Operational Event. Not Just a Status Change.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            In CivicPulse, work orders cannot be closed by checking a paper box. Field crews submit authenticated photographic evidence, locking before/after proof directly into the public incident dossier.
          </p>
        </div>

        {/* Before / After Evidence Side-by-Side Comparison */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface-elevated border border-border-medium space-y-6 font-mono-data text-xs max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
              <Camera className="w-4 h-4 text-civic-cyan" />
              <span>Restoration Audit Proof (Case File CP-1024)</span>
            </div>
            <span className="badge-resolved text-[10px]">Restoration Confirmed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Before Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-civic-red font-bold uppercase">Initial Hazard (Before)</span>
                <span className="text-text-muted font-sans text-[10px]">Citizen Observation</span>
              </div>
              <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-civic-red/40 bg-surface-base">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"
                  alt="Initial road pothole crater"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 badge-critical text-[10px] bg-void/80 backdrop-blur-sm">
                  Active Hazard &bull; Critical Priority
                </div>
              </div>
              <p className="text-[11px] text-text-secondary font-sans leading-snug">
                Deep road crater outside St. Xavier school causing two-wheeler skids.
              </p>
            </div>

            {/* After Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-civic-green font-bold uppercase">Restored Site (After)</span>
                <span className="text-text-muted font-sans text-[10px]">Squad Alpha Verification</span>
              </div>
              <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-civic-green/40 bg-surface-base">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop"
                  alt="Restored asphalt patch"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 badge-resolved text-[10px] bg-void/80 backdrop-blur-sm">
                  Repaired &amp; Compacted
                </div>
              </div>
              <p className="text-[11px] text-text-secondary font-sans leading-snug">
                3 craters excavated, hot mix asphalt applied, and smooth traffic flow restored.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default ResolutionEvidenceStory;
