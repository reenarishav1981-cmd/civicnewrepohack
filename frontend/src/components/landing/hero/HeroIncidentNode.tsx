"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert
} from "lucide-react";

export interface IncidentNodeData {
  id: string;
  x: number; // percentage on terrain
  y: number; // percentage on terrain
  elevationZ: number; // translateZ in px
  priority: "critical" | "high" | "medium" | "resolved";
  priorityText: string;
  priorityScore: number;
  title: string;
  signalsCount: number;
  isFocal?: boolean;
}

interface HeroIncidentNodeProps {
  node: IncidentNodeData;
}

export function HeroIncidentNode({ node }: HeroIncidentNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  let color = "#38BDF8";
  let badgeBg = "bg-sky-950/80 border-sky-500/60 text-sky-300";
  let glowColor = "rgba(56, 189, 248, 0.4)";

  if (node.priority === "critical") {
    color = "#FF4D5E";
    badgeBg = "bg-red-950/90 border-red-500/80 text-red-200";
    glowColor = "rgba(255, 77, 94, 0.5)";
  } else if (node.priority === "high") {
    color = "#FBBF24";
    badgeBg = "bg-amber-950/90 border-amber-500/80 text-amber-200";
    glowColor = "rgba(251, 191, 36, 0.45)";
  } else if (node.priority === "resolved") {
    color = "#34D399";
    badgeBg = "bg-emerald-950/90 border-emerald-500/80 text-emerald-200";
    glowColor = "rgba(52, 211, 153, 0.4)";
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transformStyle: "preserve-3d",
        transform: `translateZ(${node.elevationZ}px)`,
        zIndex: node.isFocal ? 40 : 25,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. GROUND ANCHOR VERTICAL LIGHT NEEDLE (Spanning from Z=0 to floating card) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0.5 pointer-events-none"
        style={{
          height: `${node.elevationZ}px`,
          transformOrigin: "top center",
          transform: `rotateX(90deg) translateZ(-${node.elevationZ / 2}px)`,
          background: `linear-gradient(to bottom, ${color}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* 2. GROUND RADAR RIPPLE */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full animate-ping opacity-30"
        style={{
          width: node.isFocal ? "54px" : "36px",
          height: node.isFocal ? "54px" : "36px",
          backgroundColor: color,
          animationDuration: node.priority === "critical" ? "2.5s" : "4s",
          transform: `translateZ(-${node.elevationZ}px)`,
        }}
      />

      {/* 3. FLOATING 3D GLASS INCIDENT CARD */}
      <Link
        href={`/operations/incidents/${node.id}`}
        className={`relative block px-3 py-1.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 font-mono text-xs select-none ${badgeBg} ${
          isHovered ? "scale-110 ring-2 ring-white" : "hover:scale-105"
        }`}
        style={{
          boxShadow: `0 16px 32px -6px ${glowColor}, 0 4px 12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Status Icon */}
          {node.priority === "critical" && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-bounce" />
          )}
          {node.priority === "high" && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          {node.priority === "medium" && (
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          )}
          {node.priority === "resolved" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          {/* Incident ID & Priority */}
          <span className="font-black text-white tracking-tight">{node.id}</span>
          <span className="text-[9.5px] uppercase font-bold opacity-90">{node.priorityText}</span>
          
          {/* Priority Score Tag */}
          <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-white font-bold ml-0.5">
            {node.priorityScore}
          </span>
        </div>

        {/* Hover Details Micro-Tooltip */}
        {isHovered && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 rounded-lg bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-[10px] space-y-1 animate-in fade-in duration-150 z-50">
            <p className="text-slate-200 font-sans leading-tight line-clamp-2">
              {node.title}
            </p>
            <div className="flex items-center justify-between text-sky-400 pt-1 border-t border-slate-800 text-[9.5px]">
              <span>{node.signalsCount} Reports Clustered</span>
              <span className="flex items-center">
                <span>Dossier</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}
      </Link>

    </div>
  );
}

export default HeroIncidentNode;
