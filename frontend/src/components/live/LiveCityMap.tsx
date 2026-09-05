"use client";

import React, { useState, useMemo } from "react";
import { Incident, FieldTeam } from "@/types";
import { IncidentMiniDossier } from "./IncidentMiniDossier";
import { 
  Layers, 
  MapPin, 
  Flame, 
  ShieldAlert, 
  Building2, 
  GraduationCap, 
  Cross, 
  Train, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Users
} from "lucide-react";

interface LiveCityMapProps {
  incidents: Incident[];
  teams?: FieldTeam[];
  hotspots?: Array<{ id: string; latitude: number; longitude: number; hotspotRiskScore: number; dominantCategory: string }>;
  simulatedIncident?: any;
  className?: string;
}

// Verified municipal sensitive anchors in Surat
const SENSITIVE_ANCHORS = [
  { id: "SENS-1", name: "St. Xavier High School", type: "school", lat: 21.1703, lng: 72.8312, radius: 250 },
  { id: "SENS-2", name: "Civil Hospital & Trauma Center", type: "hospital", lat: 21.1758, lng: 72.8252, radius: 300 },
  { id: "SENS-3", name: "Surat Central Railway Station", type: "transit", lat: 21.2045, lng: 72.8408, radius: 400 },
];

export function LiveCityMap({
  incidents,
  teams = [],
  hotspots = [],
  simulatedIncident,
  className = "",
}: LiveCityMapProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSensitiveZones, setShowSensitiveZones] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showWorkers, setShowWorkers] = useState<boolean>(true);

  // Collect all points for dynamic bounding box calculation
  const allPoints = useMemo(() => {
    const list: Array<{ lat: number; lng: number }> = [];
    incidents.forEach((i) => {
      if (i.latitude && i.longitude) list.push({ lat: i.latitude, lng: i.longitude });
    });
    teams.forEach((t) => {
      if (t.currentLatitude && t.currentLongitude) list.push({ lat: t.currentLatitude, lng: t.currentLongitude });
    });
    SENSITIVE_ANCHORS.forEach((a) => list.push({ lat: a.lat, lng: a.lng }));
    if (simulatedIncident?.latitude && simulatedIncident?.longitude) {
      list.push({ lat: simulatedIncident.latitude, lng: simulatedIncident.longitude });
    }
    return list;
  }, [incidents, teams, simulatedIncident]);

  const bounds = useMemo(() => {
    if (allPoints.length === 0) {
      return { minLat: 21.16, maxLat: 21.21, minLng: 72.81, maxLng: 72.86 };
    }
    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(0.015, maxLat - minLat);
    const lngSpan = Math.max(0.015, maxLng - minLng);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }, [allPoints]);

  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 520;

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * SVG_WIDTH;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * SVG_HEIGHT;
    return {
      x: Math.max(25, Math.min(SVG_WIDTH - 25, x)),
      y: Math.max(25, Math.min(SVG_HEIGHT - 25, y)),
    };
  };

  const getMarkerColor = (inc: Incident | any) => {
    if (inc.status === "correlated") return "#a855f7"; // PURPLE
    if (inc.status === "resolved" || inc.status === "closed") return "#10b981"; // GREEN
    if (inc.status === "in_progress" || inc.status === "assigned") return "#38bdf8"; // BLUE
    if (inc.priority === "critical" || (inc.priorityScore && inc.priorityScore >= 75)) return "#ef4444"; // RED
    return "#f59e0b"; // ORANGE
  };

  return (
    <div className={`relative rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs ${className}`}>
      
      {/* Top Map Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Live City Geospatial Surface Grid &bull; Surat Municipal Grid
          </span>
        </div>

        {/* Layer Toggles & Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSensitiveZones((s) => !s)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] flex items-center gap-1.5 ${
              showSensitiveZones ? "bg-amber-950/60 border-amber-500/40 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Sensitive Zones</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHotspots((s) => !s)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] flex items-center gap-1.5 ${
              showHotspots ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hotspots</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWorkers((s) => !s)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] flex items-center gap-1.5 ${
              showWorkers ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Field Teams</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-[520px] bg-slate-950 overflow-hidden">
        
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="liveGrid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#liveGrid)" />

          {/* Coordinate Bounds Header */}
          <g className="text-[9px] fill-slate-500 font-mono">
            <text x="15" y="25">NW ({bounds.maxLat.toFixed(3)}°N, {bounds.minLng.toFixed(3)}°E)</text>
            <text x={SVG_WIDTH - 200} y="25">NE ({bounds.maxLat.toFixed(3)}°N, {bounds.maxLng.toFixed(3)}°E)</text>
            <text x="15" y={SVG_HEIGHT - 15}>SW ({bounds.minLat.toFixed(3)}°N, {bounds.minLng.toFixed(3)}°E)</text>
            <text x={SVG_WIDTH - 200} y={SVG_HEIGHT - 15}>SE ({bounds.minLat.toFixed(3)}°N, {bounds.maxLng.toFixed(3)}°E)</text>
          </g>

          {/* 1. Sensitive Zones Buffers */}
          {showSensitiveZones &&
            SENSITIVE_ANCHORS.map((anchor) => {
              const pt = project(anchor.lat, anchor.lng);
              return (
                <g key={anchor.id} opacity="0.85">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="48"
                    fill="#f59e0b"
                    fillOpacity="0.06"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <rect
                    x={pt.x - 6}
                    y={pt.y - 6}
                    width="12"
                    height="12"
                    rx="3"
                    fill="#f59e0b"
                    fillOpacity="0.4"
                  />
                  <text
                    x={pt.x}
                    y={pt.y + 18}
                    textAnchor="middle"
                    className="fill-amber-400 font-mono text-[8px] font-bold"
                  >
                    {anchor.name}
                  </text>
                </g>
              );
            })}

          {/* 2. Hotspots Rings */}
          {showHotspots &&
            hotspots.map((h) => {
              const pt = project(h.latitude, h.longitude);
              const isCrit = h.hotspotRiskScore >= 75;
              const ringColor = isCrit ? "#ef4444" : "#38bdf8";

              return (
                <g key={h.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="36"
                    fill={ringColor}
                    fillOpacity="0.10"
                    className="animate-pulse"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="28"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                </g>
              );
            })}

          {/* 3. Assigned Field Teams & Vectors */}
          {showWorkers &&
            teams.map((team) => {
              if (!team.currentLatitude || !team.currentLongitude) return null;
              const pt = project(team.currentLatitude, team.currentLongitude);
              const isDispatched = team.status === "dispatched";

              return (
                <g key={team.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="7"
                    fill={isDispatched ? "#38bdf8" : "#10b981"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="fill-cyan-300 font-mono text-[8px] font-bold"
                  >
                    {team.name.split(" ")[0]} ({team.status.toUpperCase()})
                  </text>
                </g>
              );
            })}

          {/* 4. Live Production Incidents */}
          {incidents.map((inc) => {
            if (!inc.latitude || !inc.longitude) return null;
            const pt = project(inc.latitude, inc.longitude);
            const color = getMarkerColor(inc);
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <g
                key={inc.id}
                className="cursor-pointer"
                onClick={() => setSelectedIncident(inc)}
              >
                {/* Pulse wave for critical / active */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "18" : "14"}
                  fill={color}
                  fillOpacity="0.25"
                  className="animate-pulse"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "8" : "6"}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                >
                  {inc.id}
                </text>
              </g>
            );
          })}

          {/* 5. Simulated Incident (If active in demo mode) */}
          {simulatedIncident?.latitude && simulatedIncident?.longitude && (
            <g
              className="cursor-pointer"
              onClick={() => setSelectedIncident(simulatedIncident as any)}
            >
              <circle
                cx={project(simulatedIncident.latitude, simulatedIncident.longitude).x}
                cy={project(simulatedIncident.latitude, simulatedIncident.longitude).y}
                r="24"
                fill="#ec4899"
                fillOpacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={project(simulatedIncident.latitude, simulatedIncident.longitude).x}
                cy={project(simulatedIncident.latitude, simulatedIncident.longitude).y}
                r="9"
                fill="#ec4899"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                x={project(simulatedIncident.latitude, simulatedIncident.longitude).x}
                y={project(simulatedIncident.latitude, simulatedIncident.longitude).y - 14}
                textAnchor="middle"
                className="fill-pink-400 font-mono text-[9px] font-black uppercase"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
              >
                DEMO: {simulatedIncident.incidentId || "DEMO-INC-901"}
              </text>
            </g>
          )}

        </svg>

        {/* Mini Dossier Overlay */}
        {selectedIncident && (
          <IncidentMiniDossier
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            isDemo={selectedIncident.id.startsWith("DEMO")}
          />
        )}

        {/* Color Legend Bar */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md flex flex-wrap items-center gap-3 text-[10px] text-slate-300 font-mono">
          <span className="font-bold text-slate-400 uppercase">Live Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Resolved</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Correlated</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Demo Simulation</span>
        </div>

      </div>

    </div>
  );
}
