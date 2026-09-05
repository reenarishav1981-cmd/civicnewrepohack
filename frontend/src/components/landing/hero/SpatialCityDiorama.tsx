"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Activity, 
  ShieldAlert,
  Radio,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface IncidentPin {
  id: string;
  label: string;
  priority: "critical" | "high" | "medium" | "resolved";
  priorityText: string;
  top: string;
  left: string;
  title: string;
  signals: number;
  color: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
}

const INCIDENT_PINS: IncidentPin[] = [
  {
    id: "CP-1024",
    label: "CP-1024",
    priority: "critical",
    priorityText: "CRITICAL",
    top: "25%",
    left: "56%",
    title: "Severe Road Hazard Near School",
    signals: 18,
    color: "#FF4D5E",
    borderColor: "border-red-500/80",
    glowColor: "rgba(255, 77, 94, 0.4)",
    badgeBg: "bg-red-950/80 border-red-500/60 text-red-300",
  },
  {
    id: "CP-1019",
    label: "CP-1019",
    priority: "high",
    priorityText: "HIGH",
    top: "29%",
    left: "78%",
    title: "Drinking Water Pipeline Rupture",
    signals: 7,
    color: "#FBBF24",
    borderColor: "border-amber-500/80",
    glowColor: "rgba(251, 191, 36, 0.35)",
    badgeBg: "bg-amber-950/80 border-amber-500/60 text-amber-300",
  },
  {
    id: "CP-1033",
    label: "CP-1033",
    priority: "medium",
    priorityText: "STANDARD",
    top: "50%",
    left: "48%",
    title: "Streetlight Circuit Darkness",
    signals: 4,
    color: "#38BDF8",
    borderColor: "border-sky-500/80",
    glowColor: "rgba(56, 189, 248, 0.35)",
    badgeBg: "bg-sky-950/80 border-sky-500/60 text-sky-300",
  },
  {
    id: "CP-0991",
    label: "CP-0991",
    priority: "resolved",
    priorityText: "RESOLVED",
    top: "54%",
    left: "88%",
    title: "Overflowing Drainage Desilted",
    signals: 6,
    color: "#34D399",
    borderColor: "border-emerald-500/80",
    glowColor: "rgba(52, 211, 153, 0.35)",
    badgeBg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-300",
  },
];

export function SpatialCityDiorama() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<IncidentPin | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: normX * 8, y: normY * 8 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setHoveredPin(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] rounded-2xl overflow-hidden select-none border border-slate-700/60 shadow-2xl bg-[#090E1A] group"
      style={{ perspective: "1200px" }}
    >
      {/* 1. ATMOSPHERIC LIGHTING & AERIAL CITYSCAPE IMAGE */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transform: `scale(1.04) translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        }}
      >
        {/* Base Aerial City Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-city.jpg"
          alt="CivicPulse Spatial Urban Digital Twin"
          className="w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.05]"
        />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090E1A] via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090E1A]/40 via-transparent to-[#090E1A]/40" />
      </div>

      {/* 2. DYNAMIC SPATIAL VECTOR CONNECTION BEAMS */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="beam-red-sky" x1="56%" y1="25%" x2="48%" y2="50%">
            <stop offset="0%" stopColor="#FF4D5E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="beam-red-amber" x1="56%" y1="25%" x2="78%" y2="29%">
            <stop offset="0%" stopColor="#FF4D5E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="beam-amber-emerald" x1="78%" y1="29%" x2="88%" y2="54%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Vector Line 1: CP-1024 to CP-1033 */}
        <line
          x1="56%"
          y1="25%"
          x2="48%"
          y2="50%"
          stroke="url(#beam-red-sky)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="opacity-70 animate-pulse"
        />

        {/* Vector Line 2: CP-1024 to CP-1019 */}
        <line
          x1="56%"
          y1="25%"
          x2="78%"
          y2="29%"
          stroke="url(#beam-red-amber)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="opacity-70 animate-pulse"
        />

        {/* Vector Line 3: CP-1019 to CP-0991 */}
        <line
          x1="78%"
          y1="29%"
          x2="88%"
          y2="54%"
          stroke="url(#beam-amber-emerald)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="opacity-60"
        />
      </svg>

      {/* 3. INTERACTIVE 3D HOLOGRAPHIC INCIDENT BEACONS */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {INCIDENT_PINS.map((pin) => {
          const isHovered = hoveredPin?.id === pin.id;

          return (
            <div
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform duration-300 hover:scale-110"
              style={{
                top: pin.top,
                left: pin.left,
              }}
              onMouseEnter={() => setHoveredPin(pin)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              {/* Radar Wave Ripple radiating from ground point */}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full pointer-events-none animate-ping opacity-40"
                style={{
                  backgroundColor: pin.color,
                  animationDuration: pin.priority === "critical" ? "2.2s" : "3.5s",
                }}
              />

              {/* Concentric Ground Target Ring */}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 w-16 h-8 rounded-[100%] border pointer-events-none"
                style={{
                  borderColor: pin.color,
                  boxShadow: `0 0 16px ${pin.glowColor}`,
                  opacity: 0.8,
                }}
              />

              {/* Spatial Floating Beacon Pill */}
              <Link
                href={`/operations/incidents/${pin.id}`}
                className={`relative px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-2xl flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-tight transition-all duration-200 ${pin.badgeBg} ${
                  isHovered ? "ring-2 ring-white scale-105" : ""
                }`}
                style={{
                  boxShadow: `0 8px 24px -4px ${pin.glowColor}`,
                }}
              >
                {/* Pin Icon */}
                {pin.priority === "critical" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />}
                {pin.priority === "high" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {pin.priority === "medium" && <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                {pin.priority === "resolved" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}

                {/* ID & Status */}
                <span className="text-white">{pin.label}</span>
                <span className="opacity-90">{pin.priorityText}</span>
              </Link>

              {/* Ground Anchor Light Needle */}
              <div
                className="w-0.5 h-4 mx-auto"
                style={{
                  background: `linear-gradient(to bottom, ${pin.color}, transparent)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 4. CONTEXTUAL HOVER POPUP */}
      {hoveredPin && (
        <div
          className="absolute z-30 pointer-events-none p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 animate-in fade-in duration-150 max-w-xs"
          style={{
            top: `calc(${hoveredPin.top} - 85px)`,
            left: `clamp(15%, ${hoveredPin.left}, 75%)`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-sm">{hoveredPin.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${hoveredPin.badgeBg}`}>
              {hoveredPin.priorityText}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-snug">
            {hoveredPin.title}
          </p>
          <div className="flex items-center justify-between text-[10px] text-sky-400 pt-1 border-t border-slate-800">
            <span>{hoveredPin.signals} Clustered Signals</span>
            <span className="flex items-center gap-0.5">
              <span>View Dossier</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {/* 5. FLOATING TELEMETRY HUD CARD (BOTTOM RIGHT) */}
      <div className="absolute bottom-4 right-4 z-20 p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center gap-4 text-xs font-mono">
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Active Incidents
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-white">12</span>
            <span className="text-[11px] text-red-400 font-bold">&uarr; 2</span>
          </div>
          <div className="text-[9.5px] text-slate-400 font-sans mt-0.5">
            Requiring Attention
          </div>
        </div>

        {/* Mini Frequency Bar Chart */}
        <div className="flex items-end gap-1 h-8 pl-2 border-l border-slate-800">
          <div className="w-1.5 bg-red-500/40 rounded-t h-3" />
          <div className="w-1.5 bg-red-500/50 rounded-t h-4" />
          <div className="w-1.5 bg-red-500/60 rounded-t h-5" />
          <div className="w-1.5 bg-red-500/70 rounded-t h-4" />
          <div className="w-1.5 bg-red-500/80 rounded-t h-6" />
          <div className="w-1.5 bg-red-500 rounded-t h-8 animate-pulse" />
        </div>
      </div>

    </div>
  );
}

export default SpatialCityDiorama;
