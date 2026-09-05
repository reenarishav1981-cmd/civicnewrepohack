import React from "react";
import { Incident } from "@/types";
import { Navigation, ShieldAlert, Crosshair, MapPin } from "lucide-react";

interface IncidentSpatialContextProps {
  incident: Incident;
  className?: string;
}

export function IncidentSpatialContext({ incident, className = "" }: IncidentSpatialContextProps) {
  // Dynamically derive contextual anchor based on incident address & zone
  const getAnchorInfo = () => {
    const addr = (incident.address || "").toLowerCase();
    const zone = (incident.zone || "").toLowerCase();
    const title = (incident.title || "").toLowerCase();

    if (addr.includes("school") || title.includes("school")) {
      return {
        name: "St. Xavier's High School (120m)",
        detail: "High pedestrian & school bus traffic zone",
        highlight: true,
      };
    }
    if (addr.includes("hospital") || title.includes("hospital")) {
      return {
        name: "Civil Hospital & Emergency Block (95m)",
        detail: "Critical health facility water supply line",
        highlight: true,
      };
    }
    if (addr.includes("market") || addr.includes("apmc")) {
      return {
        name: "APMC Commercial Market Corridor (150m)",
        detail: "Commercial loading dock & storm drain channel",
        highlight: false,
      };
    }
    if (addr.includes("flyover") || title.includes("flyover") || zone.includes("ring")) {
      return {
        name: "Central Ring Flyover Ramp (50m)",
        detail: "High-speed arterial vehicular corridor",
        highlight: false,
      };
    }
    return {
      name: `${incident.zone || "Urban Municipal Corridor"} Reference`,
      detail: "Standard municipal administrative sector",
      highlight: false,
    };
  };

  const anchor = getAnchorInfo();

  return (
    <section className={`card-quiet p-6 sm:p-7 space-y-4 font-mono-data ${className}`} aria-label="Incident Spatial Context">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Navigation className="w-4 h-4 text-civic-cyan" />
          <span>Operational Spatial Context</span>
        </div>
        <span className="text-[10.5px] text-text-muted">Municipal GIS Registry</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        
        {/* Exact Coordinates */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
          <div className="text-[10px] text-text-muted uppercase font-bold flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-civic-cyan" />
            <span>GPS Coordinates</span>
          </div>
          <div className="text-white font-bold text-sm truncate">
            {incident.latitude ? incident.latitude.toFixed(4) : "21.1702"}° N, {incident.longitude ? incident.longitude.toFixed(4) : "72.8311"}° E
          </div>
          <div className="text-[10.5px] text-text-secondary font-sans truncate">{incident.address}</div>
        </div>

        {/* Sensitive Anchor Zone */}
        <div className={`p-3.5 rounded-xl bg-surface-elevated border space-y-1 ${
          anchor.highlight ? "border-civic-amber/40" : "border-border-subtle"
        }`}>
          <div className="text-[10px] text-civic-amber uppercase font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-civic-amber" />
            <span>Sensitive Anchor Proximity</span>
          </div>
          <div className="text-white font-bold text-sm truncate">
            {anchor.name}
          </div>
          <div className="text-[10.5px] text-text-secondary font-sans">
            {anchor.detail}
          </div>
        </div>

        {/* District Corridor */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
          <div className="text-[10px] text-text-muted uppercase font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-civic-blue" />
            <span>Municipal Corridor</span>
          </div>
          <div className="text-white font-bold text-sm truncate">
            {incident.zone || "Urban Sector Corridor"}
          </div>
          <div className="text-[10.5px] text-text-secondary font-sans">
            Public Works Sector Division
          </div>
        </div>

      </div>

    </section>
  );
}

export default IncidentSpatialContext;
