"use client";

import React from "react";

// Isometric 3D Architectural Building definition
interface IsometricBuilding {
  id: string;
  x: number; // percentage on terrain slab
  y: number; // percentage on terrain slab
  width: number; // px
  depth: number; // px
  height: number; // 3D extrusion height in px
  zone: "school" | "hospital" | "tech" | "civic" | "residential";
  hasRooftopBeacon?: boolean;
  beaconColor?: string;
}

const CITY_BUILDINGS: IsometricBuilding[] = [
  // Civic Intelligence Central Core (Elevated Hub)
  { id: "b-core", x: 48, y: 42, width: 64, depth: 52, height: 70, zone: "civic", hasRooftopBeacon: true, beaconColor: "#38BDF8" },
  
  // Education & School Cluster (Near Incident CP-1024)
  { id: "b-school-1", x: 26, y: 28, width: 48, depth: 38, height: 50, zone: "school", hasRooftopBeacon: true, beaconColor: "#FF4D5E" },
  { id: "b-school-2", x: 34, y: 22, width: 36, depth: 32, height: 35, zone: "school" },
  { id: "b-school-3", x: 20, y: 36, width: 38, depth: 30, height: 28, zone: "school" },

  // Hospital & Health Quarters (Near Incident CP-1019)
  { id: "b-hosp-1", x: 74, y: 26, width: 54, depth: 42, height: 60, zone: "hospital", hasRooftopBeacon: true, beaconColor: "#FBBF24" },
  { id: "b-hosp-2", x: 84, y: 32, width: 40, depth: 34, height: 42, zone: "hospital" },
  
  // Tech Park & Flyover Ramp (Near Incident CP-1033)
  { id: "b-tech-1", x: 22, y: 64, width: 52, depth: 44, height: 55, zone: "tech", hasRooftopBeacon: true, beaconColor: "#38BDF8" },
  { id: "b-tech-2", x: 32, y: 72, width: 44, depth: 36, height: 38, zone: "tech" },
  { id: "b-tech-3", x: 14, y: 56, width: 38, depth: 32, height: 25, zone: "tech" },

  // Riverfront & APMC Logistics (Near Incident CP-0991)
  { id: "b-apmc-1", x: 72, y: 68, width: 56, depth: 46, height: 45, zone: "residential", hasRooftopBeacon: true, beaconColor: "#34D399" },
  { id: "b-apmc-2", x: 82, y: 60, width: 46, depth: 38, height: 35, zone: "residential" },
  { id: "b-apmc-3", x: 64, y: 78, width: 38, depth: 32, height: 24, zone: "residential" },
];

export function HeroCityLayer() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        transformStyle: "preserve-3d",
        transform: "translateZ(0px)",
      }}
    >
      {/* 1. TERRAIN SLAB: Architectural Base Platform */}
      <div 
        className="absolute inset-2 sm:inset-4 rounded-3xl border border-slate-700/70 shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(8, 14, 28, 0.98) 100%)",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Subtle Isometric Road Conduits & Waterway Vector Grid */}
        <svg className="w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="road-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="river-corridor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* District Grid Cells */}
          <g stroke="rgba(76, 141, 255, 0.1)" strokeWidth="0.25" fill="none">
            <line x1="0" y1="25" x2="100" y2="25" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="75" x2="100" y2="75" />
            <line x1="25" y1="0" x2="25" y2="100" />
            <line x1="50" y1="0" x2="50" y2="100" />
            <line x1="75" y1="0" x2="75" y2="100" />
          </g>

          {/* Central Tapi River Corridor Curve */}
          <path
            d="M 5,95 Q 40,80 50,50 T 95,5 L 100,10 L 60,60 Q 45,90 10,100 Z"
            fill="url(#river-corridor)"
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth="0.4"
          />

          {/* Main Arterial Road Network */}
          <g stroke="url(#road-glow)" strokeWidth="0.8" fill="none">
            {/* Outer Ring Conduit */}
            <rect x="14" y="14" width="72" height="72" rx="12" strokeDasharray="3 2" />
            {/* Inner Ring Corridor */}
            <circle cx="50" cy="50" r="22" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.6" />
            {/* Cross Highways */}
            <line x1="0" y1="50" x2="100" y2="50" strokeWidth="0.9" />
            <line x1="50" y1="0" x2="50" y2="100" strokeWidth="0.9" />
            {/* Diagonal Arteries */}
            <line x1="14" y1="14" x2="86" y2="86" strokeWidth="0.5" strokeOpacity="0.5" />
            <line x1="86" y1="14" x2="14" y2="86" strokeWidth="0.5" strokeOpacity="0.5" />
          </g>
        </svg>

        {/* Ambient Ground Lighting Spotlights */}
        <div className="absolute top-[28%] left-[26%] w-32 h-32 rounded-full bg-red-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[29%] left-[78%] w-32 h-32 rounded-full bg-amber-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[50%] left-[48%] w-36 h-36 rounded-full bg-sky-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[54%] left-[88%] w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* 2. ISOMETRIC 3D ARCHITECTURAL BUILDINGS WITH PHYSICAL FACES */}
      <div 
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {CITY_BUILDINGS.map((b) => (
          <div
            key={b.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.width}px`,
              height: `${b.depth}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Ground Shadow below building */}
            <div 
              className="absolute inset-0 rounded-lg bg-black/60 blur-md translate-y-3 scale-110"
              style={{ transform: "translateZ(0px)" }}
            />

            {/* 3D Extruded Building Box */}
            <div 
              className="relative w-full h-full rounded-md transition-all duration-300"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateZ(${b.height / 2}px)`,
              }}
            >
              {/* Front Face */}
              <div 
                className="absolute inset-0 rounded-b-md border-b border-l border-slate-600/50"
                style={{
                  background: "linear-gradient(to bottom, #1E293B, #0F172A)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                }}
              />

              {/* Roof / Top Face (Elevated along Z-axis) */}
              <div 
                className="absolute inset-0 rounded-md border border-slate-500/60 flex items-center justify-center"
                style={{
                  transform: `translateZ(${b.height / 2}px)`,
                  background: b.zone === "civic" 
                    ? "linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)" 
                    : "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
                  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Rooftop Solar/Architectural Grid Lines */}
                <div className="w-4/5 h-4/5 rounded border border-slate-600/40 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 opacity-40">
                  <div className="bg-slate-700/40 rounded-sm" />
                  <div className="bg-slate-700/40 rounded-sm" />
                  <div className="bg-slate-700/40 rounded-sm" />
                  <div className="bg-slate-700/40 rounded-sm" />
                </div>

                {/* Rooftop Node Beacon */}
                {b.hasRooftopBeacon && (
                  <div 
                    className="absolute w-2.5 h-2.5 rounded-full shadow-lg flex items-center justify-center"
                    style={{
                      backgroundColor: b.beaconColor,
                      boxShadow: `0 0 10px ${b.beaconColor}`,
                    }}
                  >
                    <span className="w-1 h-1 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default HeroCityLayer;
