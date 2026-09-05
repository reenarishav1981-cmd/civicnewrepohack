"use client";

import React, { useState, useMemo } from "react";
import { CivicHotspot, RiskLevel } from "@/lib/intelligence/predictiveTypes";
import { Incident } from "@/types";
import { MapPin, Flame, Filter, Layers, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface IntelligenceMapProps {
  hotspots: CivicHotspot[];
  incidents?: Incident[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspotId: string) => void;
  className?: string;
}

export function IntelligenceMap({
  hotspots,
  incidents = [],
  selectedHotspotId,
  onSelectHotspot,
  className = "",
}: IntelligenceMapProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredItem, setHoveredItem] = useState<{
    id: string;
    title: string;
    category: string;
    score: number;
    x: number;
    y: number;
    type: "hotspot" | "incident";
  } | null>(null);

  // Collect all points to calculate bounding box
  const points = useMemo(() => {
    const list: Array<{ lat: number; lng: number; category: string; score: number; id: string; type: "hotspot" | "incident"; title: string }> = [];

    hotspots.forEach((h) => {
      list.push({
        lat: h.latitude,
        lng: h.longitude,
        category: h.dominantCategory,
        score: h.hotspotRiskScore,
        id: h.id,
        type: "hotspot",
        title: `Hotspot: ${h.dominantCategory} Cluster (${h.incidentCount} cases)`,
      });
    });

    incidents.forEach((i) => {
      if (i.latitude && i.longitude) {
        list.push({
          lat: i.latitude,
          lng: i.longitude,
          category: i.category,
          score: i.priorityScore || 50,
          id: i.id,
          type: "incident",
          title: i.title,
        });
      }
    });

    return list;
  }, [hotspots, incidents]);

  // Compute bounding box
  const bounds = useMemo(() => {
    if (points.length === 0) {
      return { minLat: 21.16, maxLat: 21.19, minLng: 72.81, maxLng: 72.85 };
    }
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(0.01, maxLat - minLat);
    const lngSpan = Math.max(0.01, maxLng - minLng);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }, [points]);

  // Normalize point into SVG (width: 800, height: 480)
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 480;

  const projectPoint = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * SVG_WIDTH;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * SVG_HEIGHT;
    return { x: Math.max(20, Math.min(SVG_WIDTH - 20, x)), y: Math.max(20, Math.min(SVG_HEIGHT - 20, y)) };
  };

  const filteredHotspots = hotspots.filter((h) => {
    if (categoryFilter !== "all" && h.dominantCategory.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (severityFilter !== "all") {
      const lvl = h.hotspotRiskScore >= 75 ? "critical" : h.hotspotRiskScore >= 50 ? "high" : h.hotspotRiskScore >= 25 ? "moderate" : "low";
      if (lvl !== severityFilter.toLowerCase()) return false;
    }
    return true;
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    hotspots.forEach((h) => set.add(h.dominantCategory));
    incidents.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [hotspots, incidents]);

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 font-mono text-xs ${className}`}>
      
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider">
            Geospatial Intelligence Map &bull; Live Surface Grid
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (&gt;=75)</option>
              <option value="high">High (50-74)</option>
              <option value="moderate">Moderate (25-49)</option>
              <option value="low">Low (&lt;25)</option>
            </select>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
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
      <div className="relative w-full h-[460px] rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden">
        
        {/* Hover Tooltip Overlay */}
        {hoveredItem && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl z-30 font-mono text-[11px] space-y-1"
            style={{ left: `${hoveredItem.x}px`, top: `${hoveredItem.y}px` }}
          >
            <div className="font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>{hoveredItem.title}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
              <span>Category: <strong className="text-cyan-300">{hoveredItem.category}</strong></span>
              <span>Score: <strong className="text-white">{hoveredItem.score}/100</strong></span>
            </div>
            <span className="text-[9px] text-slate-400 block text-right">Click to inspect dossier</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          {/* Subtle Coordinate Grid Lines */}
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Coordinate Axis Reference */}
          <g className="text-[9px] fill-slate-400 font-mono">
            <text x="15" y="25">NW ({bounds.maxLat.toFixed(2)}°N, {bounds.minLng.toFixed(2)}°E)</text>
            <text x={SVG_WIDTH - 180} y="25">NE ({bounds.maxLat.toFixed(2)}°N, {bounds.maxLng.toFixed(2)}°E)</text>
            <text x="15" y={SVG_HEIGHT - 15}>SW ({bounds.minLat.toFixed(2)}°N, {bounds.minLng.toFixed(2)}°E)</text>
            <text x={SVG_WIDTH - 180} y={SVG_HEIGHT - 15}>SE ({bounds.minLat.toFixed(2)}°N, {bounds.maxLng.toFixed(2)}°E)</text>
          </g>

          {/* Incident Dots */}
          {incidents.map((inc) => {
            if (!inc.latitude || !inc.longitude) return null;
            const pt = projectPoint(inc.latitude, inc.longitude);
            return (
              <circle
                key={inc.id}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                className="fill-slate-500 opacity-60 hover:opacity-100 hover:fill-white cursor-pointer transition-all"
                onMouseEnter={() =>
                  setHoveredItem({
                    id: inc.id,
                    title: inc.title,
                    category: inc.category,
                    score: inc.priorityScore || 50,
                    x: pt.x,
                    y: pt.y,
                    type: "incident",
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
              />
            );
          })}

          {/* Hotspot Clusters */}
          {filteredHotspots.map((h) => {
            const pt = projectPoint(h.latitude, h.longitude);
            const isSelected = selectedHotspotId === h.id;
            const isCritical = h.hotspotRiskScore >= 75;
            const isHigh = h.hotspotRiskScore >= 50 && h.hotspotRiskScore < 75;

            const ringColor = isCritical ? "#ef4444" : isHigh ? "#f59e0b" : "#38bdf8";

            return (
              <g
                key={h.id}
                className="cursor-pointer"
                onClick={() => onSelectHotspot && onSelectHotspot(h.id)}
                onMouseEnter={() =>
                  setHoveredItem({
                    id: h.id,
                    title: `${h.dominantCategory} Cluster (${h.id})`,
                    category: h.dominantCategory,
                    score: h.hotspotRiskScore,
                    x: pt.x,
                    y: pt.y,
                    type: "hotspot",
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Outer Pulse Wave */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "44" : "32"}
                  fill={ringColor}
                  fillOpacity="0.12"
                  className="animate-pulse"
                />

                {/* Radius Boundary Ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "34" : "24"}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  strokeDasharray="4,2"
                />

                {/* Core Centroid Marker */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "8" : "6"}
                  fill={ringColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Label */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                >
                  {h.hotspotRiskScore}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/90 backdrop-blur-sm flex items-center gap-3 text-[10px] text-slate-300">
          <span className="font-bold uppercase text-slate-400">Risk Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical (&gt;=75)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> High (50-74)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Moderate (25-49)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Raw Incidents</span>
        </div>

      </div>

    </div>
  );
}
