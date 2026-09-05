"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

export const ScatteredSignalsScene: React.FC = () => {
  const rawReports = [
    { id: "R-8801", user: "Aarav Sharma", time: "08:15 AM", text: "Pothole outside school gate causing bus delays.", dist: "40m from gate", cat: "Road Hazard" },
    { id: "R-8802", user: "Pooja Patel", time: "08:22 AM", text: "Road damaged after rain near pedestrian crossing.", dist: "85m away", cat: "Road Hazard" },
    { id: "R-8803", user: "Mehul Chokshi", time: "08:45 AM", text: "Large crater near junction. Two-wheeler slipped!", dist: "110m away", cat: "Road Hazard" },
    { id: "R-8804", user: "Sneha Kapadia", time: "09:10 AM", text: "Dangerous road asphalt broken causing traffic crawl.", dist: "130m away", cat: "Traffic Hazard" },
    { id: "R-8805", user: "Rohan Desai", time: "09:30 AM", text: "Deep crater expanding near pedestrian crosswalk.", dist: "120m away", cat: "Road Hazard" },
  ];

  return (
    <section id="problem-scattered" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border-subtle bg-surface-base/30 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="badge-intelligence">
            THE SCATTERED SIGNALS PROBLEM
          </div>
          <h2 className="heading-section text-white">
            5 Scattered Reports. 1 Real Problem.
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto font-sans">
            When 5 different citizens report road damage using different words, traditional systems open 5 disconnected tickets. CivicPulse connects them into one prioritized incident.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left 6 Cols: 5 Scattered Citizen Signals */}
          <div className="lg:col-span-6 space-y-3 font-mono-data">
            <div className="text-xs font-bold text-text-secondary uppercase mb-2 flex items-center justify-between">
              <span>Disconnected Input Stream:</span>
              <span className="text-civic-cyan">5 Signals Floating</span>
            </div>

            {rawReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 card-quiet hover:border-border-accent transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{rep.id}</span>
                    <span className="text-text-secondary">&bull; {rep.user}</span>
                    <span className="text-[10px] text-text-muted">({rep.time})</span>
                  </div>
                  <p className="text-xs text-text-primary font-sans leading-relaxed">
                    &quot;{rep.text}&quot;
                  </p>
                </div>
                <div className="text-right shrink-0 text-[10px] text-civic-cyan">
                  <div>{rep.dist}</div>
                  <span className="badge-neutral text-[9px] mt-1 inline-block">
                    {rep.cat}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right 6 Cols: Unified Incident Emergence (CP-1024) */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 card-focal shadow-elevation-high space-y-6 relative overflow-hidden">
              
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle font-mono-data text-xs">
                <div className="flex items-center gap-2 text-civic-cyan font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>UNIFIED INCIDENT EMERGENCE</span>
                </div>
                <span className="badge-resolved text-[10px]">
                  18 SIGNALS CONNECTED &bull; 94% CONFIDENCE
                </span>
              </div>

              <div className="space-y-4 font-mono-data">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-civic-red/15 border border-civic-red/30 flex items-center justify-center text-civic-red shrink-0 font-bold text-lg">
                    !
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">INCIDENT CP-1024</span>
                      <span className="badge-critical text-[10px]">
                        CRITICAL (92/100)
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white font-sans mt-0.5">
                      Severe Road Hazard &bull; St. Xavier&apos;s School Crossing
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-text-secondary font-sans leading-relaxed">
                  CivicPulse correlated 18 independent citizen signals across a 250m radius. Multi-factor semantic embeddings confirmed severe vehicular skid risk during school dismissal hours.
                </p>

                <div className="p-4 rounded-md bg-surface-base border border-border-subtle space-y-2 text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Signal Compression:</span>
                    <span className="text-white font-bold">18 Citizen Reports &rarr; 1 Incident</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Location Anchor:</span>
                    <span className="text-civic-cyan">St. Xavier&apos;s School Pedestrian Crossing</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Recommended Squad:</span>
                    <span className="text-civic-green font-semibold">PWD Rapid Asphalt Compaction Unit</span>
                  </div>
                </div>

                <Link
                  href="/operations/incidents/CP-1024"
                  className="btn-primary w-full py-3 text-xs"
                >
                  <span>Open Incident Case File</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
