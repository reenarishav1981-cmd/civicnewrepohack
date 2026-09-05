import React, { useState, useEffect } from "react";
import { Incident, CitizenReport } from "@/types";
import { Sparkles, Radio, CheckCircle2, MapPin } from "lucide-react";

interface SignalCorrelationEvidenceProps {
  incident: Incident;
  connectedReports: CitizenReport[];
  className?: string;
}

export function SignalCorrelationEvidence({
  incident,
  connectedReports,
  className = "",
}: SignalCorrelationEvidenceProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    connectedReports.length > 0 ? connectedReports[0].id : null
  );

  useEffect(() => {
    if (connectedReports.length > 0 && !selectedReportId) {
      setSelectedReportId(connectedReports[0].id);
    }
  }, [connectedReports, selectedReportId]);

  const selectedReport = connectedReports.find((r) => r.id === selectedReportId) || connectedReports[0] || null;

  // Derive constellation topology nodes from real connected reports or count
  const hasRealReports = connectedReports.length > 0;
  const signalCount = hasRealReports ? connectedReports.length : incident.connectedReportsCount || 1;

  return (
    <section className={`card-focal p-6 sm:p-7 space-y-6 font-mono-data ${className}`} aria-label="Signal Correlation Evidence Network">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-civic-cyan uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Signal Correlation Topology &bull; Multi-Citizen Mesh</span>
        </div>
        <span className="badge-intelligence text-[10px]">
          {incident.connectedReportsCount} CITIZEN OBSERVATIONS CORRELATED INTO {incident.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left 7 Cols: Dynamic SVG Constellation Orbit */}
        <div className="lg:col-span-7 relative h-[360px] sm:h-[400px] w-full flex items-center justify-center bg-canvas rounded-xl border border-border-subtle overflow-hidden">
          
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            {/* Coordinate Concentric Orbit Rings */}
            <circle cx="200" cy="200" r="145" stroke="rgba(83, 215, 255, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="200" cy="200" r="90" stroke="rgba(76, 141, 255, 0.2)" strokeWidth="1" />
            <circle cx="200" cy="200" r="35" stroke="rgba(255, 93, 108, 0.25)" strokeWidth="1" />

            {/* Connecting Vector Lines from Centroid to Satellite Signals */}
            {Array.from({ length: signalCount }).map((_, idx) => {
              const rep = hasRealReports ? connectedReports[idx] : null;
              const angle = (idx * (2 * Math.PI)) / signalCount;
              const x = 200 + 145 * Math.cos(angle);
              const y = 200 + 145 * Math.sin(angle);
              const isSelected = rep && selectedReport?.id === rep.id;

              return (
                <line
                  key={`vector-path-${idx}`}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke={isSelected ? "#53D7FF" : "#4C8DFF"}
                  strokeWidth={isSelected ? 2 : 1.2}
                  strokeOpacity={isSelected ? 0.9 : 0.35}
                  strokeDasharray={isSelected ? "none" : "2 2"}
                />
              );
            })}

            {/* Central Centroid Node: Canonical Incident */}
            <g className="cursor-pointer">
              <circle cx="200" cy="200" r="34" fill="#FF5D6C" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: "3.5s" }} />
              <circle cx="200" cy="200" r="24" fill="#111A2D" stroke="#FF5D6C" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="8" fill="#FF5D6C" />
              <text x="200" y="242" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace">{incident.id}</text>
              <text x="200" y="255" textAnchor="middle" fill="#FF5D6C" fontSize="9" fontWeight="bold" fontFamily="monospace">SCORE {incident.priorityScore}</text>
            </g>

            {/* Satellite Signal Nodes around the Orbit */}
            {Array.from({ length: signalCount }).map((_, idx) => {
              const rep = hasRealReports ? connectedReports[idx] : null;
              const reportId = rep ? rep.id : `SIG-${idx + 1}`;
              const angle = (idx * (2 * Math.PI)) / signalCount;
              const x = 200 + 145 * Math.cos(angle);
              const y = 200 + 145 * Math.sin(angle);
              const isSelected = rep && selectedReport?.id === rep.id;

              return (
                <g
                  key={`satellite-signal-${idx}`}
                  onClick={() => {
                    if (rep) setSelectedReportId(rep.id);
                  }}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 14 : 10}
                    fill="#0D1424"
                    stroke={isSelected ? "#53D7FF" : "#4C8DFF"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all"
                  />
                  <circle cx={x} cy={y} r="4" fill={isSelected ? "#53D7FF" : "#4C8DFF"} />
                  <text
                    x={x}
                    y={y > 200 ? y + 18 : y - 14}
                    textAnchor="middle"
                    fill={isSelected ? "#53D7FF" : "#7F93AF"}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {reportId}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right 5 Cols: Selected Satellite Signal Inspection Card */}
        <div className="lg:col-span-5 space-y-3.5">
          
          {hasRealReports && selectedReport ? (
            <div className="p-5 rounded-xl bg-surface-elevated border border-border-focus shadow-elevation-md space-y-3">
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-civic-cyan animate-pulse" />
                  {selectedReport.id} &bull; {selectedReport.userName || "Verified Citizen"}
                </span>
                <span className="badge-neutral text-[9px] font-sans">
                  {selectedReport.category}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-base border border-border-subtle">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Citizen Observation:</div>
                <p className="text-xs text-text-primary font-sans leading-relaxed">
                  &quot;{selectedReport.description}&quot;
                </p>
              </div>

              {/* Citizen Photo Thumbnail if present */}
              {selectedReport.mediaUrl && (
                <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border-subtle bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedReport.mediaUrl}
                    alt="Citizen attached evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-sky-400">
                    Citizen Photo Attached
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-0.5">
                <div>
                  <span className="text-text-muted text-[10px] block">Address:</span>
                  <span className="text-white truncate block">{selectedReport.address || incident.address}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted text-[10px] block">Timestamp:</span>
                  <span className="text-white">
                    {new Date(selectedReport.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-base border border-border-subtle text-[11px] text-text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                <span className="font-sans">Matched by multimodal fusion (spatial, semantic &amp; visual signals).</span>
              </div>

            </div>
          ) : (
            <div className="p-5 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
              <div className="text-xs font-bold text-white uppercase">Aggregate Signal Cluster</div>
              <p className="text-xs text-text-secondary font-sans leading-relaxed">
                This incident was formed from {incident.connectedReportsCount} correlated citizen observations in the immediate sector. Individual signal details are cataloged under the master incident.
              </p>
              <div className="p-3 rounded-lg bg-surface-base border border-border-subtle text-xs text-text-muted">
                Confidence Threshold: <span className="text-civic-cyan font-bold">{Math.round(incident.aiConfidence * 100)}%</span>
              </div>
            </div>
          )}

          {/* Cluster Metrics Summary */}
          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2 text-xs">
            <div className="text-[10px] text-text-muted uppercase font-bold flex items-center justify-between">
              <span>Cluster Topology Metrics</span>
              <span className="text-civic-green font-bold">Canonical {incident.id}</span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>Cluster Radius:</span>
              <span className="text-white font-bold">~250 meters</span>
            </div>
            <div className="flex justify-between text-text-secondary text-[11px]">
              <span>Vector Similarity:</span>
              <span className="text-civic-cyan font-bold">{Math.round(incident.aiConfidence * 100)}% Mathematical Cosine Match</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}

export default SignalCorrelationEvidence;
