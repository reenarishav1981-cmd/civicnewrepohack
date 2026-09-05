import React, { useState } from "react";
import { Incident } from "@/types";
import { MapPin, Users, Activity, Filter, Search, X } from "lucide-react";

interface PriorityQueueRailProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (filter: string) => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function PriorityQueueRail({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  isLoading = false,
  className = "",
}: PriorityQueueRailProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const activeSearch = searchQuery !== undefined ? searchQuery : internalQuery;

  const handleSearchChange = (val: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const query = activeSearch.toLowerCase().trim();

  // Filter incidents based on Search Query, Priority, and Status
  const filteredIncidents = incidents.filter((inc) => {
    // 0. Search Query Dimension (CP ID, Title, Address, Category, Assigned Worker)
    if (query) {
      const matchId = inc.id.toLowerCase().includes(query);
      const matchTitle = inc.title ? inc.title.toLowerCase().includes(query) : false;
      const matchAddress = inc.address ? inc.address.toLowerCase().includes(query) : false;
      const matchCategory = inc.category ? inc.category.toLowerCase().includes(query) : false;
      const matchWorker = inc.assignedWorkerName ? inc.assignedWorkerName.toLowerCase().includes(query) : false;

      if (!matchId && !matchTitle && !matchAddress && !matchCategory && !matchWorker) {
        return false;
      }
    }

    // Direct ID search override: If operator typed exact/partial CP ID, don't hide it due to priority/status tabs
    const isDirectIdMatch = query && inc.id.toLowerCase().includes(query);
    if (!isDirectIdMatch) {
      // 1. Priority Dimension
      if (priorityFilter === "critical" && inc.priorityScore < 80) return false;
      if (priorityFilter === "high" && (inc.priorityScore < 55 || inc.priorityScore >= 80)) return false;
      if (priorityFilter === "standard" && inc.priorityScore >= 55) return false;

      // 2. Status Dimension
      if (statusFilter === "new" && inc.status !== "new") return false;
      if (statusFilter === "active" && (inc.status === "resolved" || inc.status === "closed")) return false;
      if (statusFilter === "assigned" && inc.status !== "assigned") return false;
      if (statusFilter === "in_progress" && inc.status !== "in_progress") return false;
      if (statusFilter === "resolved" && (inc.status !== "resolved" && inc.status !== "closed")) return false;
    }

    return true;
  });

  // Sort strictly by highest priority score
  const sortedIncidents = [...filteredIncidents].sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

  return (
    <aside 
      className={`flex flex-col h-full bg-surface-base border-r border-border-subtle ${className}`}
      aria-label="Priority Incident Queue"
    >
      {/* Top Header & Filter Controls */}
      <div className="p-4 border-b border-border-subtle space-y-3 shrink-0">
        <div className="flex items-center justify-between font-mono-data">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-civic-red animate-pulse" aria-hidden="true" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Priority Incident Queue
            </h2>
          </div>
          <span className="badge-critical text-[10px]">
            {sortedIncidents.length} Ranked
          </span>
        </div>

        {/* CP Quick Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={activeSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && sortedIncidents.length > 0) {
                onSelectIncident(sortedIncidents[0].id);
              }
            }}
            placeholder="Search CP (e.g. CP-1024) or text..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-elevated/80 border border-border-subtle hover:border-border-medium rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-cyan focus:ring-1 focus:ring-civic-cyan/50 font-mono-data transition-all"
          />
          {activeSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-0.5 rounded"
              title="Clear search"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dimension 1: Priority Filter Strip */}
        <div className="space-y-1 font-mono-data">
          <div className="text-[9.5px] text-text-muted uppercase font-bold">Priority Filter:</div>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10.5px]">
            {[
              { id: "all", label: "All Priority" },
              { id: "critical", label: "Critical" },
              { id: "high", label: "High" },
              { id: "standard", label: "Standard" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onPriorityFilterChange(p.id)}
                className={`px-2 py-0.5 rounded transition-all whitespace-nowrap border text-[10px] ${
                  priorityFilter === p.id
                    ? "bg-surface-elevated text-civic-cyan border-border-focus font-bold shadow-sm"
                    : "bg-transparent text-text-muted border-transparent hover:text-text-primary hover:border-border-subtle"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension 2: Status Filter Strip */}
        <div className="space-y-1 font-mono-data">
          <div className="text-[9.5px] text-text-muted uppercase font-bold">Status Filter:</div>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10.5px]">
            {[
              { id: "all", label: "All" },
              { id: "new", label: "New" },
              { id: "active", label: "Active" },
              { id: "assigned", label: "Assigned" },
              { id: "in_progress", label: "In-Field" },
              { id: "resolved", label: "Resolved" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => onStatusFilterChange(s.id)}
                className={`px-2 py-0.5 rounded transition-all whitespace-nowrap border text-[10px] ${
                  statusFilter === s.id
                    ? "bg-surface-elevated text-white border-border-focus font-bold shadow-sm"
                    : "bg-transparent text-text-muted border-transparent hover:text-text-primary hover:border-border-subtle"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Cards Queue */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono-data">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-text-muted space-y-2">
            <Activity className="w-5 h-5 animate-spin mx-auto text-civic-cyan" />
            <p>Syncing city telemetry...</p>
          </div>
        ) : sortedIncidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted space-y-2.5 border border-dashed border-border-subtle rounded-xl m-2">
            <Filter className="w-5 h-5 mx-auto opacity-40 text-civic-cyan" />
            <p className="font-sans text-xs">
              {activeSearch ? (
                <>No incident found matching &quot;<span className="text-civic-cyan font-mono">{activeSearch}</span>&quot;</>
              ) : (
                "No incidents match the active filters."
              )}
            </p>
            {activeSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="text-[11px] text-civic-cyan hover:underline font-mono-data"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            const isCritical = incident.priorityScore >= 80;
            const isHigh = incident.priorityScore >= 55 && incident.priorityScore < 80;
            const isResolved = incident.status === "resolved" || incident.status === "closed";

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectIncident(incident.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group text-left ${
                  isSelected
                    ? "bg-surface-elevated border-border-focus shadow-elevation-md ring-1 ring-civic-cyan/30"
                    : "bg-surface-base border-border-subtle hover:bg-surface-elevated/70 hover:border-border-medium"
                }`}
              >
                {/* Left Priority Accent Stripe */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                    isCritical
                      ? "bg-civic-red"
                      : isHigh
                      ? "bg-civic-amber"
                      : isResolved
                      ? "bg-civic-green"
                      : "bg-civic-cyan"
                  }`}
                  aria-hidden="true"
                />

                <div className="pl-2 space-y-1.5">
                  {/* Top Bar: ID, Category, Badges & Priority Score */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-text-primary group-hover:text-civic-cyan transition-colors">
                        {incident.id}
                      </span>
                      {incident.status === "new" && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-950 text-sky-400 border border-sky-500/40">
                          NEW
                        </span>
                      )}
                      {incident.source === "demo" && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          DEMO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="badge-neutral text-[9px] py-0 px-1.5 font-sans">
                        {incident.category}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isCritical
                            ? "text-civic-red"
                            : isHigh
                            ? "text-civic-amber"
                            : isResolved
                            ? "text-civic-green"
                            : "text-civic-cyan"
                        }`}
                      >
                        {incident.priorityScore}
                        <span className="text-[10px] text-text-muted font-normal">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Incident Title */}
                  <h3 className="text-xs font-sans font-bold text-text-primary line-clamp-1 leading-snug">
                    {incident.title}
                  </h3>

                  {/* Assigned Worker Indicator */}
                  {incident.assignedWorkerName && (
                    <div className="text-[10px] text-civic-cyan font-mono truncate">
                      Assigned: <span className="font-bold">{incident.assignedWorkerName}</span>
                    </div>
                  )}

                  {/* Metadata Row: Location & Connected Signal Count */}
                  <div className="flex items-center justify-between text-[10.5px] text-text-secondary pt-0.5 font-sans">
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      <MapPin className="w-3 h-3 text-civic-cyan shrink-0" />
                      <span className="truncate">{incident.address}</span>
                    </span>
                    <span className="flex items-center gap-1 text-text-muted shrink-0 font-mono-data text-[10px]">
                      <Users className="w-3 h-3 text-civic-blue" />
                      <span>{incident.connectedReportsCount} signals</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default PriorityQueueRail;
