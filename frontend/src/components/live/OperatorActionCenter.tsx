"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldAlert, Clock, TrendingUp, ArrowRight } from "lucide-react";

interface OperatorActionCenterProps {
  unreviewedDecisionsCount?: number;
  criticalIncidentsCount?: number;
  slaRisksCount?: number;
  emergingAlertsCount?: number;
  className?: string;
}

export function OperatorActionCenter({
  unreviewedDecisionsCount = 3,
  criticalIncidentsCount = 2,
  slaRisksCount = 1,
  emergingAlertsCount = 2,
  className = "",
}: OperatorActionCenterProps) {
  const items = [
    {
      title: "Unreviewed AI Decisions",
      count: unreviewedDecisionsCount,
      href: "/operations",
      icon: Sparkles,
      color: "text-purple-400 border-purple-500/30 bg-purple-950/20",
    },
    {
      title: "Critical Priority Incidents",
      count: criticalIncidentsCount,
      href: "/operations",
      icon: ShieldAlert,
      color: "text-red-400 border-red-500/30 bg-red-950/20",
    },
    {
      title: "SLA Containment Risks",
      count: slaRisksCount,
      href: "/operations",
      icon: Clock,
      color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
    },
    {
      title: "Emerging Surge Anomalies",
      count: emergingAlertsCount,
      href: "/operations/intelligence",
      icon: TrendingUp,
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs ${className}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 ${item.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase truncate">{item.title}</span>
              <Icon className="w-3.5 h-3.5 shrink-0" />
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white font-mono">{item.count}</span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                <span>View</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
