"use client";

import React from "react";
import { AiCoreNucleus } from "@/components/AiCoreNucleus";
import { Cpu, MapPin, School, Sparkles } from "lucide-react";

export const IntelligenceCoreScene: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border-subtle relative bg-void">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left 5 Cols: Editorial Explanation */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="badge-intelligence">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE CONNECTION MOMENT</span>
            </div>

            <h2 className="heading-section text-white">
              What looks like 5 complaints is actually 1 incident.
            </h2>

            <p className="text-sm text-text-secondary font-sans leading-relaxed">
              CivicPulse combines mathematical cosine similarity, Haversine geospatial proximity, and sensitive municipal zone weighting to reveal hidden relationships across independent reports.
            </p>

            <div className="space-y-3 font-mono-data pt-2">
              <div className="p-3.5 card-quiet flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-civic-cyan/15 border border-civic-cyan/30 flex items-center justify-center text-civic-cyan shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">1. Semantic Understanding (40%)</div>
                  <p className="text-[11px] text-text-secondary font-sans mt-0.5">&quot;deep pothole&quot; and &quot;road broken&quot; share identical vector meaning.</p>
                </div>
              </div>

              <div className="p-3.5 card-quiet flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-civic-blue/15 border border-civic-blue/30 flex items-center justify-center text-civic-blue shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">2. Geospatial Proximity (40%)</div>
                  <p className="text-[11px] text-text-secondary font-sans mt-0.5">Calculates exact spatial clustering within 250m radius.</p>
                </div>
              </div>

              <div className="p-3.5 card-quiet flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-civic-amber/15 border border-civic-amber/30 flex items-center justify-center text-civic-amber shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">3. Sensitive Zone Context (20%)</div>
                  <p className="text-[11px] text-text-secondary font-sans mt-0.5">Elevates priority when near school gates or hospital corridors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: The Spatial Visual Nucleus */}
          <div className="lg:col-span-7">
            <AiCoreNucleus confidence={94} />
          </div>

        </div>

      </div>
    </section>
  );
};
