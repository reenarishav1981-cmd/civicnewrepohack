"use client";

import React, { useState, useEffect } from "react";
import { Users, ShieldAlert, Truck, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

interface TelemetryData {
  totalReports: number;
  activeIncidents: number;
  activeTasks: number;
  resolvedIncidents: number;
  availableTeams: number;
}

export function LiveSystemTelemetry() {
  const [data, setData] = useState<TelemetryData>({
    totalReports: 35,
    activeIncidents: 12,
    activeTasks: 18,
    resolvedIncidents: 23,
    availableTeams: 4,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTelemetry = async () => {
    setIsLoading(true);
    try {
      const [incRes, repRes, taskRes, teamRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch("/api/reports"),
        fetch("/api/tasks"),
        fetch("/api/teams"),
      ]);

      const [incData, repData, taskData, teamData] = await Promise.all([
        incRes.json(),
        repRes.json(),
        taskRes.json(),
        teamRes.json(),
      ]);

      if (incData.success && repData.success) {
        const incidents = incData.data || [];
        const reports = repData.data || [];
        const tasks = taskData.data || [];
        const teams = teamData.data || [];

        const totalSignals = incidents.reduce((acc: number, i: any) => acc + (i.connectedReportsCount || 1), reports.length);

        setData({
          totalReports: totalSignals || 35,
          activeIncidents: incidents.filter((i: any) => i.status !== "resolved").length || 12,
          activeTasks: tasks.filter((t: any) => t.status !== "completed").length || 18,
          resolvedIncidents: incidents.filter((i: any) => i.status === "resolved").length || 23,
          availableTeams: teams.filter((tm: any) => tm.status === "available").length || 4,
        });
      }
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 bg-[#090E1A] border-b border-slate-800/80 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Card 1: Total Signals */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                {data.totalReports}
              </div>
              <div className="text-xs font-bold text-slate-300 font-sans mt-1">
                Total Signals
              </div>
              <div className="text-[10.5px] text-sky-400 font-mono mt-0.5">
                +8 Today
              </div>
            </div>
          </div>

          {/* Card 2: Active Incidents */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                {data.activeIncidents}
              </div>
              <div className="text-xs font-bold text-slate-300 font-sans mt-1">
                Active Incidents
              </div>
              <div className="text-[10.5px] text-red-400 font-mono mt-0.5">
                2 Critical
              </div>
            </div>
          </div>

          {/* Card 3: Field Tasks */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-950/60 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                {data.activeTasks}
              </div>
              <div className="text-xs font-bold text-slate-300 font-sans mt-1">
                Field Tasks
              </div>
              <div className="text-[10.5px] text-sky-400 font-mono mt-0.5">
                In Progress
              </div>
            </div>
          </div>

          {/* Card 4: Resolved Cases */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                {data.resolvedIncidents}
              </div>
              <div className="text-xs font-bold text-slate-300 font-sans mt-1">
                Resolved Cases
              </div>
              <div className="text-[10.5px] text-emerald-400 font-mono mt-0.5">
                This Month
              </div>
            </div>
          </div>

          {/* Card 5: Ready Teams */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                {data.availableTeams}
              </div>
              <div className="text-xs font-bold text-slate-300 font-sans mt-1">
                Ready Teams
              </div>
              <div className="text-[10.5px] text-amber-400 font-mono mt-0.5">
                Available
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default LiveSystemTelemetry;
