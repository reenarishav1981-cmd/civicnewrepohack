"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Camera, ArrowRight } from "lucide-react";

export const ResolutionEvidenceScene: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border-subtle bg-surface-base/30 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="badge-resolved">
            CLOSED-LOOP ACCOUNTABILITY
          </div>
          <h2 className="heading-section text-white">
            Resolution should be proven.
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto font-sans">
            A ticket isn&apos;t resolved when a status changes in an office—it is resolved when photographic evidence confirms physical restoration on the street.
          </p>
        </div>

        {/* Large Dominating Before / After Interactive Slider */}
        <div className="max-w-5xl mx-auto card-focal p-4 sm:p-6 shadow-elevation-high space-y-4">
          
          <div className="flex items-center justify-between font-mono-data text-xs pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-white font-bold uppercase">
              <Camera className="w-4 h-4 text-civic-green" />
              <span>INCIDENT CP-1024 &bull; ST. XAVIER&apos;S CROSSING RESTORATION</span>
            </div>
            <span className="text-text-secondary">Drag slider to compare</span>
          </div>

          <div className="relative h-80 sm:h-[460px] w-full rounded-lg overflow-hidden border border-border-medium select-none shadow-inner">
            
            {/* After Image (Restored) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop"
              alt="Repaired road"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 badge-resolved z-10 flex items-center gap-1.5 shadow-elevation-md text-xs py-1.5 px-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>AFTER &bull; VERIFIED RESTORED</span>
            </div>

            {/* Before Image (Hazard) Dynamic Width */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&auto=format&fit=crop"
                alt="Dangerous pothole"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", height: "100%" }}
              />
              <div className="absolute bottom-4 left-4 badge-critical z-10 text-xs py-1.5 px-3">
                BEFORE &bull; 18 CITIZEN SIGNALS
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-void flex items-center justify-center text-xs font-bold shadow-xl">
                &harr;
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 font-mono-data text-xs text-text-secondary">
            <div>
              <span className="text-white font-bold">Execution Team:</span> PWD Rapid Asphalt Unit &bull; Completed in 2h 45m
            </div>
            <Link
              href="/operations/incidents/CP-1024"
              className="text-civic-cyan hover:underline flex items-center gap-1"
            >
              <span>View complete audit log in Case File</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
