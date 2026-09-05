"use client";

import React, { useState } from "react";
import { Layers, ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { DepartmentPerformanceProfile, DepartmentStatus } from "@/lib/executive";

interface DepartmentPerformanceTableProps {
  departments: DepartmentPerformanceProfile[];
  className?: string;
}

export function DepartmentPerformanceTable({
  departments,
  className = "",
}: DepartmentPerformanceTableProps) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const getStatusBadge = (status: DepartmentStatus) => {
    switch (status) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-500/40">CRITICAL</span>;
      case "NEEDS_ATTENTION":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">NEEDS ATTENTION</span>;
      case "HEALTHY":
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">HEALTHY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">STABLE</span>;
    }
  };

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 p-6 font-mono text-xs space-y-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Department Performance &amp; SLA Compliance Matrix
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold">
          {departments.length} Municipal Directorates
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-center">Active Backlog</th>
              <th className="py-2.5 px-3 text-center">Resolution Rate</th>
              <th className="py-2.5 px-3 text-center">SLA Compliance</th>
              <th className="py-2.5 px-3 text-center">Velocity (24h)</th>
              <th className="py-2.5 px-3 text-center">Critical</th>
              <th className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {departments.map((d) => {
              const isExpanded = expandedDept === d.department;

              return (
                <React.Fragment key={d.department}>
                  <tr
                    onClick={() => setExpandedDept(isExpanded ? null : d.department)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-sans font-bold text-white text-xs">
                      {d.department}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={d.activeBacklog > 8 ? "text-amber-400" : "text-slate-300"}>
                        {d.activeBacklog}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                      {Math.round(d.resolutionRate * 100)}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={d.slaComplianceRate < 0.70 ? "text-red-400" : "text-emerald-400"}>
                        {Math.round(d.slaComplianceRate * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      +{d.incidentVelocity}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {d.criticalIncidentCount > 0 ? (
                        <span className="text-red-400">{d.criticalIncidentCount}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {isExpanded ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
                    </td>
                  </tr>

                  {/* Expanded Category Detail */}
                  {isExpanded && (
                    <tr className="bg-slate-950/60">
                      <td colSpan={8} className="p-4 border-b border-slate-800">
                        <div className="space-y-2 font-sans text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                            <span className="text-slate-400">
                              Average Resolution Time: <strong className="text-white">{d.averageResolutionHours} hours</strong>
                            </span>
                            <span className="text-slate-400">
                              Reopen Rate: <strong className="text-amber-400">{Math.round(d.reopenRate * 100)}%</strong>
                            </span>
                            <span className="text-slate-400">
                              Total Lifetime Cases: <strong className="text-white">{d.totalIncidents}</strong>
                            </span>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">
                              Associated Incident Categories:
                            </span>
                            <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                              {d.categoryNames.length > 0 ? (
                                d.categoryNames.map((c) => (
                                  <span key={c} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                    {c}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500">General service tasks</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
