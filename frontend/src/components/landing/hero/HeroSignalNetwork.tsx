"use client";

import React from "react";

interface CitizenSignal {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
  targetIncidentId: string;
  targetX: number;
  targetY: number;
  color: string;
  dist: string;
}

const CITIZEN_SIGNALS: CitizenSignal[] = [
  { id: "R-8801", x: 16, y: 18, label: "R-8801", targetIncidentId: "CP-1024", targetX: 26, targetY: 28, color: "#38BDF8", dist: "40m" },
  { id: "R-8802", x: 38, y: 15, label: "R-8802", targetIncidentId: "CP-1024", targetX: 26, targetY: 28, color: "#38BDF8", dist: "85m" },
  { id: "R-8803", x: 14, y: 44, label: "R-8803", targetIncidentId: "CP-1024", targetX: 26, targetY: 28, color: "#38BDF8", dist: "110m" },
  { id: "R-8804", x: 88, y: 18, label: "R-8804", targetIncidentId: "CP-1019", targetX: 74, targetY: 26, color: "#FBBF24", dist: "60m" },
  { id: "R-8805", x: 12, y: 75, label: "R-8805", targetIncidentId: "CP-1033", targetX: 22, targetY: 64, color: "#38BDF8", dist: "90m" },
  { id: "R-8806", x: 88, y: 82, label: "R-8806", targetIncidentId: "CP-0991", targetX: 72, targetY: 68, color: "#34D399", dist: "50m" },
];

export function HeroSignalNetwork() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        transformStyle: "preserve-3d",
        transform: "translateZ(65px)",
      }}
    >
      {/* 1. SPATIAL SVG VECTOR ENERGY CONDUITS */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vector-cyan-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="vector-inter-cluster" x1="26%" y1="28%" x2="74%" y2="26%">
            <stop offset="0%" stopColor="#FF4D5E" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Inter-Cluster Correlation Highway (CP-1024 <-> Central Hub <-> CP-1019) */}
        <line
          x1="26"
          y1="28"
          x2="48"
          y2="42"
          stroke="url(#vector-cyan-flow)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
          className="animate-pulse opacity-70"
        />
        <line
          x1="48"
          y1="42"
          x2="74"
          y2="26"
          stroke="url(#vector-cyan-flow)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
          className="animate-pulse opacity-70"
        />
        <line
          x1="48"
          y1="42"
          x2="22"
          y2="64"
          stroke="url(#vector-cyan-flow)"
          strokeWidth="0.5"
          strokeDasharray="2 1.5"
          className="opacity-50"
        />
        <line
          x1="48"
          y1="42"
          x2="72"
          y2="68"
          stroke="url(#vector-cyan-flow)"
          strokeWidth="0.5"
          strokeDasharray="2 1.5"
          className="opacity-50"
        />

        {/* Citizen Signal Vectors converging to Incidents */}
        {CITIZEN_SIGNALS.map((sig) => (
          <g key={`beam-${sig.id}`}>
            <line
              x1={sig.x}
              y1={sig.y}
              x2={sig.targetX}
              y2={sig.targetY}
              stroke={sig.color}
              strokeWidth="0.5"
              strokeDasharray="1 1"
              strokeOpacity="0.7"
            />
            {/* Animated Packet along line */}
            <circle
              cx={(sig.x + sig.targetX) / 2}
              cy={(sig.y + sig.targetY) / 2}
              r="0.6"
              fill={sig.color}
              className="animate-pulse"
            />
          </g>
        ))}
      </svg>

      {/* 2. FLOATING CITIZEN OBSERVATION NODES */}
      {CITIZEN_SIGNALS.map((sig) => (
        <div
          key={sig.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${sig.x}%`,
            top: `${sig.y}%`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Signal Pill */}
          <div 
            className="px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-sm flex items-center gap-1 font-mono text-[8.5px] text-slate-300 select-none whitespace-nowrap"
            style={{
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: sig.color }}
            />
            <span>{sig.label}</span>
          </div>
        </div>
      ))}

    </div>
  );
}

export default HeroSignalNetwork;
