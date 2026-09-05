"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles, AlertTriangle } from "lucide-react";
import { CitySignalCanvas } from "@/components/CitySignalCanvas";

export const HeroSignalUniverse: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-void">
      
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-civic-blue/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="badge-intelligence">
            <span className="w-1.5 h-1.5 rounded-full bg-civic-cyan animate-pulse" />
            <span>CIVIC INTELLIGENCE SYSTEM</span>
          </div>

          <h1 className="heading-display text-white">
            Your city is <br />
            <span className="bg-gradient-to-r from-civic-cyan via-civic-blue to-blue-400 bg-clip-text text-transparent">
              already speaking.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary font-normal leading-relaxed max-w-xl font-sans">
            Millions of civic signals exist every day. Reports, complaints, photos, coordinates. The problem is not the lack of information—the problem is that the information remains disconnected.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2 font-mono-data">
            <Link
              href="/operations"
              className="btn-primary py-3 px-6 text-sm"
            >
              <span>Explore the Signal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#problem-scattered"
              className="btn-secondary py-3 px-5 text-sm"
            >
              <span>Watch the Workflow</span>
              <ChevronDown className="w-4 h-4 text-civic-cyan" />
            </a>
          </div>

          {/* Key Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border-subtle max-w-lg font-mono-data">
            <div>
              <div className="text-2xl font-bold text-white">18 : 1</div>
              <div className="text-[11px] text-text-secondary mt-0.5">Signal Compression</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-civic-cyan">94.2%</div>
              <div className="text-[11px] text-text-secondary mt-0.5">Correlation Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-civic-green">4.2x</div>
              <div className="text-[11px] text-text-secondary mt-0.5">Faster Dispatch</div>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Signal Universe Environment */}
        <div className="lg:col-span-6 relative">
          <div className="card-focal p-2 shadow-elevation-high relative overflow-hidden">
            
            {/* Header Overlay */}
            <div className="flex items-center justify-between p-3 border-b border-border-subtle font-mono-data text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
                <span>SURAT METRO &bull; SPATIAL SIGNAL UNIVERSE</span>
              </div>
              <span className="badge-intelligence text-[10px]">
                LIVE GEOMETRY
              </span>
            </div>

            {/* Spatial Canvas Viewport with Subtle Parallax */}
            <div className="h-[360px] sm:h-[400px] w-full rounded-lg overflow-hidden relative">
              <CitySignalCanvas activeIncidentId="CP-1024" height="100%" />
            </div>

            {/* Emerging Incident Preview Card */}
            <div className="m-2 p-3.5 card-elevated flex items-center justify-between shadow-elevation-md font-mono-data">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-civic-red/15 border border-civic-red/30 flex items-center justify-center text-civic-red shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">CP-1024</span>
                    <span className="badge-critical text-[9px] py-0.2 px-1.5">
                      18 Signals &bull; Critical
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 font-sans">
                    Road Hazard near St. Xavier&apos;s School &bull; AI Confidence 94%
                  </p>
                </div>
              </div>

              <Link
                href="/operations/incidents/CP-1024"
                className="btn-primary py-1.5 px-3 text-xs"
              >
                Inspect
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
