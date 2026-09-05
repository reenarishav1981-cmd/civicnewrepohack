import React from "react";
import { ShieldCheck, Lock, Eye } from "lucide-react";

export function CitizenTrustNotice({ className = "" }: { className?: string }) {
  return (
    <aside 
      className={`p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2.5 font-mono-data text-xs ${className}`}
      aria-label="Civic trust and privacy notice"
    >
      <div className="flex items-center gap-2 text-text-primary font-bold uppercase tracking-wider text-[11px]">
        <ShieldCheck className="w-4 h-4 text-civic-green" />
        <span>CivicPulse Trust &amp; Privacy Notice</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-text-secondary font-sans text-[11px] leading-relaxed">
        <div className="flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 text-civic-cyan shrink-0 mt-0.5" />
          <span><strong>Why Location Is Used:</strong> Coordinates are used exclusively to correlate related reports into single municipal work orders.</span>
        </div>
        <div className="flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-civic-blue shrink-0 mt-0.5" />
          <span><strong>No Public Exposure:</strong> Your contact number is kept private and only utilized for automated dispatch status verification.</span>
        </div>
      </div>
    </aside>
  );
}

export default CitizenTrustNotice;
