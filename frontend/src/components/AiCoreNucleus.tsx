"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Cpu, MapPin, School, AlertTriangle } from "lucide-react";

interface AiCoreNucleusProps {
  confidence?: number;
  className?: string;
}

export const AiCoreNucleus: React.FC<AiCoreNucleusProps> = ({
  confidence = 94,
  className = "",
}) => {
  const [pulseStep, setPulseStep] = useState(0);
  const [calcConfidence, setCalcConfidence] = useState(72);

  // Animate dynamic correlation calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let start = 72;
    const end = confidence;
    const timer = setInterval(() => {
      if (start < end) {
        start += 1;
        setCalcConfidence(start);
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [confidence]);

  return (
    <div className={`relative w-full rounded-2xl bg-[#080D18] border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl font-mono-data ${className}`}>
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#53D7FF]/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 text-[#53D7FF] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>AI CORRELATION NUCLEUS &bull; MULTI-STREAM FUSION</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#43D19E]/15 text-[#43D19E] font-bold border border-[#43D19E]/30 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43D19E] animate-pulse" />
          CALCULATING LIVE
        </div>
      </div>

      {/* Main Spatial Processing Core (Matching References 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-6">
        
        {/* Left 4 Cols: 3 Incoming Data Streams */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[10px] text-[#7F93AF] uppercase font-bold tracking-wider">
            Incoming Signal Streams:
          </div>

          {/* Stream 1: Semantic */}
          <div className="p-3 rounded-xl bg-[#0D1424] border border-white/10 relative overflow-hidden group hover:border-[#53D7FF]/50 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#53D7FF]" />
                1. Semantic Vector
              </span>
              <span className="text-[#53D7FF] font-bold">91.4%</span>
            </div>
            <p className="text-[11px] text-[#7F93AF] font-sans mt-1">
              &quot;pothole near school&quot; &harr; &quot;road broken opposite gate&quot;
            </p>
            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#53D7FF] rounded-full" style={{ width: "91.4%" }} />
            </div>
          </div>

          {/* Stream 2: Geographic */}
          <div className="p-3 rounded-xl bg-[#0D1424] border border-white/10 relative overflow-hidden group hover:border-[#4C8DFF]/50 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#4C8DFF]" />
                2. Geospatial Radius
              </span>
              <span className="text-[#4C8DFF] font-bold">120m</span>
            </div>
            <p className="text-[11px] text-[#7F93AF] font-sans mt-1">
              Haversine distance within Sector 3 street cluster
            </p>
            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#4C8DFF] rounded-full" style={{ width: "88%" }} />
            </div>
          </div>

          {/* Stream 3: Civic Context */}
          <div className="p-3 rounded-xl bg-[#0D1424] border border-white/10 relative overflow-hidden group hover:border-[#FFB648]/50 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#FFB648]" />
                3. Sensitive Anchor
              </span>
              <span className="text-[#FFB648] font-bold">School Zone</span>
            </div>
            <p className="text-[11px] text-[#7F93AF] font-sans mt-1">
              St. Xavier&apos;s High School crossing (High pedestrian hazard)
            </p>
            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#FFB648] rounded-full" style={{ width: "96%" }} />
            </div>
          </div>
        </div>

        {/* Center 5 Cols: The Spatial Visual Nucleus */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative h-64 sm:h-72">
          
          <svg className="w-full h-full" viewBox="0 0 300 240" fill="none">
            {/* Isometric Platform Grid Floor */}
            <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8">
              <line x1="20" y1="180" x2="280" y2="180" />
              <line x1="40" y1="200" x2="260" y2="200" />
              <line x1="60" y1="220" x2="240" y2="220" />
              <line x1="60" y1="140" x2="150" y2="220" />
              <line x1="240" y1="140" x2="150" y2="220" />
            </g>

            {/* Converging Stream Fiber Channels */}
            {/* Stream 1 Path */}
            <path d="M 10 70 C 60 70, 90 120, 150 120" stroke="#53D7FF" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="3 3" />
            {/* Stream 2 Path */}
            <path d="M 10 120 C 70 120, 90 120, 150 120" stroke="#4C8DFF" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="3 3" />
            {/* Stream 3 Path */}
            <path d="M 10 170 C 60 170, 90 120, 150 120" stroke="#FFB648" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="3 3" />

            {/* Converged Output Vector to Right */}
            <path d="M 150 120 C 210 120, 240 120, 290 120" stroke="#43D19E" strokeWidth="2.5" strokeOpacity="0.85" />

            {/* Orbital Concentric Energy Rings */}
            <circle cx="150" cy="120" r="56" stroke="rgba(83, 215, 255, 0.2)" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" style={{ transformOrigin: "150px 120px", animationDuration: "20s" }} />
            <circle cx="150" cy="120" r="38" stroke="rgba(76, 141, 255, 0.3)" strokeWidth="1.2" />

            {/* Central Luminous Sphere Nucleus */}
            <g className="cursor-pointer">
              <circle cx="150" cy="120" r="28" fill="#53D7FF" fillOpacity="0.15" className="animate-ping" style={{ transformOrigin: "150px 120px", animationDuration: "3s" }} />
              <circle cx="150" cy="120" r="22" fill="#0D1424" stroke="#53D7FF" strokeWidth="2" />
              <circle cx="150" cy="120" r="8" fill="#53D7FF" />
              <text x="150" y="123" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">CORE</text>
            </g>
          </svg>
        </div>

        {/* Right 3 Cols: AI Confidence Output */}
        <div className="lg:col-span-3 p-5 rounded-xl bg-[#111A2D] border border-[#43D19E]/30 space-y-3 text-center sm:text-left">
          <div className="text-[10px] text-[#7F93AF] uppercase font-bold">
            Output Confidence:
          </div>
          
          <div className="text-4xl sm:text-5xl font-extrabold text-[#43D19E] tracking-tight">
            {calcConfidence}%
          </div>

          <div className="text-xs font-bold text-white font-sans">
            RELATED INCIDENT DETECTED
          </div>

          <p className="text-[11px] text-[#7F93AF] font-sans leading-relaxed">
            Multi-factor analysis confirmed 18 citizen signals converge on canonical incident <span className="text-[#53D7FF] font-bold font-mono-data">CP-1024</span>.
          </p>
        </div>

      </div>

      {/* Footer Rule */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#7F93AF]">
        <span>MODEL: DETERMINISTIC CIVIC VECTOR EMBEDDINGS</span>
        <span className="text-[#43D19E]">&bull; LATENCY: 12ms &bull; 0% HALLUCINATION</span>
      </div>

    </div>
  );
};
