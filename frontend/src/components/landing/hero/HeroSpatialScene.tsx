"use client";

import React, { useState, useRef, useEffect } from "react";
import { HeroCityLayer } from "./HeroCityLayer";
import { HeroSignalNetwork } from "./HeroSignalNetwork";
import { HeroIncidentNode, IncidentNodeData } from "./HeroIncidentNode";
import { HeroTelemetryHUD } from "./HeroTelemetryHUD";

const INCIDENT_NODES: IncidentNodeData[] = [
  {
    id: "CP-1024",
    x: 26,
    y: 28,
    elevationZ: 190,
    priority: "critical",
    priorityText: "CRITICAL",
    priorityScore: 92,
    title: "Severe Road Hazard Near School",
    signalsCount: 18,
    isFocal: true,
  },
  {
    id: "CP-1019",
    x: 74,
    y: 26,
    elevationZ: 130,
    priority: "high",
    priorityText: "HIGH",
    priorityScore: 78,
    title: "Drinking Water Pipeline Rupture",
    signalsCount: 7,
  },
  {
    id: "CP-1033",
    x: 22,
    y: 64,
    elevationZ: 120,
    priority: "medium",
    priorityText: "STANDARD",
    priorityScore: 54,
    title: "Streetlight Circuit Darkness",
    signalsCount: 4,
  },
  {
    id: "CP-0991",
    x: 72,
    y: 68,
    elevationZ: 110,
    priority: "resolved",
    priorityText: "RESOLVED",
    priorityScore: 40,
    title: "Overflowing Drainage Desilted",
    signalsCount: 6,
  },
];

export function HeroSpatialScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 18, y: -12 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    // Controlled, elegant 3D tilt: base tilt 18deg X, -12deg Y + subtle offset
    setRotation({
      x: 18 + normY * -8, // ±4deg delta
      y: -12 + normX * 10, // ±5deg delta
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 18, y: -12 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[420px] sm:h-[500px] lg:h-[540px] flex items-center justify-center select-none"
      style={{
        perspective: "1400px",
      }}
      aria-label="3D Spatial Civic Intelligence System Diorama"
    >
      {/* Ambient Depth Background Light Spot */}
      <div className="absolute w-[450px] h-[300px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none -z-10" />

      {/* 3D ROTATING SCENE ROOT */}
      <div
        className="relative w-[92%] sm:w-[90%] h-[88%] sm:h-[85%] transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(2deg)`,
        }}
      >
        {/* LAYER 1 & 2 & 3: ISOMETRIC ARCHITECTURAL BUILDINGS & TERRAIN SLAB (Z=0px) */}
        <HeroCityLayer />

        {/* LAYER 4: MULTI-PLANE SIGNAL NETWORK & CONDUITS (Z=65px) */}
        <HeroSignalNetwork />

        {/* LAYER 5 & 6: 3D FLOATING GLASS INCIDENT OBJECTS (Z=110px - 190px) */}
        {INCIDENT_NODES.map((node) => (
          <HeroIncidentNode key={node.id} node={node} />
        ))}

        {/* LAYER 7: FLOATING 3D TELEMETRY HUD (Z=160px) */}
        <HeroTelemetryHUD />
      </div>

    </div>
  );
}

export default HeroSpatialScene;
