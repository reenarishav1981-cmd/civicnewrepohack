import React, { useState } from "react";
import { Incident } from "@/types";
import { Camera, CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";

interface EvidenceGalleryProps {
  incident: Incident;
  className?: string;
}

export function EvidenceGallery({ incident, className = "" }: EvidenceGalleryProps) {
  const [sliderPos, setSliderPos] = useState(50);

  const beforeUrl = incident.beforeEvidenceUrl;
  const afterUrl = incident.afterEvidenceUrl;
  const isResolved = incident.status === "resolved" || incident.status === "closed";

  // Case 1: No evidence photos attached
  if (!beforeUrl && !afterUrl) {
    return (
      <section className={`card-quiet p-6 sm:p-7 space-y-4 font-mono-data ${className}`} aria-label="Physical Evidence Absence State">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
            <Camera className="w-4 h-4 text-civic-cyan" />
            <span>Physical Photographic Evidence</span>
          </div>
          <span className="badge-neutral text-[10px]">PENDING UPLOAD</span>
        </div>

        <div className="p-8 text-center rounded-xl bg-surface-base border border-dashed border-border-subtle space-y-2">
          <ImageIcon className="w-6 h-6 mx-auto text-text-muted opacity-40" />
          <h3 className="text-xs font-bold text-white font-sans">No Visual Evidence Attached</h3>
          <p className="text-[11px] text-text-secondary font-sans max-w-sm mx-auto leading-relaxed">
            Citizen reports for this incident were submitted via text/voice telemetry without photographic attachments. Dispatched field workers will capture site imagery upon arrival.
          </p>
        </div>
      </section>
    );
  }

  // Case 2: Only Before Photo is available (Work in progress)
  if (beforeUrl && !afterUrl) {
    return (
      <section className={`card-focal p-6 sm:p-7 space-y-5 font-mono-data ${className}`} aria-label="Initial Hazard Evidence">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle text-xs">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
            <Camera className="w-4 h-4 text-civic-cyan" />
            <span>Physical Evidence &bull; Initial Hazard Capture</span>
          </div>
          <span className="badge-high text-[10px]">
            ACTIVE REPAIR &bull; AWAITING RESTORATION PROOF
          </span>
        </div>

        <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden border border-border-medium bg-surface-base">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeUrl}
            alt="Initial road hazard evidence"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 badge-critical text-xs py-1 px-3 shadow-md">
            BEFORE ({incident.connectedReportsCount} CITIZEN SIGNALS)
          </div>
          <div className="absolute bottom-3 right-3 badge-neutral text-xs py-1 px-3 bg-surface-base/90 backdrop-blur-sm border border-border-subtle shadow-md">
            Restoration image will be uploaded by field crew
          </div>
        </div>
      </section>
    );
  }

  // Case 3: Both Before and After Photos Exist (Full comparison slider)
  return (
    <section className={`card-focal p-6 sm:p-7 space-y-5 font-mono-data ${className}`} aria-label="Physical Evidence & Restoration Comparison">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Camera className="w-4 h-4 text-civic-cyan" />
          <span>Physical Evidence &bull; Before / After Verification</span>
        </div>
        <div>
          {isResolved ? (
            <span className="badge-resolved text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESOLUTION VERIFIED (RESTORED)</span>
            </span>
          ) : (
            <span className="badge-high text-[10px]">
              <span>ACTIVE REPAIR &bull; PROOF ATTACHED</span>
            </span>
          )}
        </div>
      </div>

      {/* Draggable Split Comparison Slider */}
      <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden border border-border-medium select-none shadow-inner bg-surface-base">
        
        {/* After Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterUrl}
          alt="Restored physical site"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-3 right-3 badge-resolved z-10 flex items-center gap-1.5 shadow-md text-xs py-1 px-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>AFTER &bull; RESTORATION VERIFIED</span>
        </div>

        {/* Before Image */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeUrl}
            alt="Initial hazard state"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: "100%", height: "100%" }}
          />
          <div className="absolute bottom-3 left-3 badge-critical z-10 text-xs py-1 px-3 shadow-md">
            BEFORE ({incident.connectedReportsCount} CITIZEN SIGNALS)
          </div>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-white text-void flex items-center justify-center text-xs font-bold shadow-xl">
            &harr;
          </div>
        </div>

        {/* Range Scrub Controller */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
          aria-label="Drag before and after evidence comparison slider"
        />
      </div>

    </section>
  );
}

export default EvidenceGallery;
