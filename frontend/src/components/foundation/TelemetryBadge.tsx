import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Activity, 
  Radio, 
  Truck,
  FileSearch,
  Check
} from "lucide-react";
import { IncidentStatus, PriorityLevel } from "@/types";

export type TelemetryStatus = 
  | PriorityLevel
  | IncidentStatus
  | "intelligence" 
  | "neutral";

interface TelemetryBadgeProps {
  status: TelemetryStatus | string;
  label?: string;
  value?: string | number;
  showIcon?: boolean;
  className?: string;
}

export function TelemetryBadge({
  status,
  label,
  value,
  showIcon = true,
  className = "",
}: TelemetryBadgeProps) {
  let badgeClass = "badge-neutral";
  let defaultLabel = label || status.toUpperCase().replace(/_/g, " ");
  let IconComponent = Activity;

  switch (status) {
    case "critical":
      badgeClass = "badge-critical";
      defaultLabel = label || "CRITICAL";
      IconComponent = AlertTriangle;
      break;
    case "high":
      badgeClass = "badge-high";
      defaultLabel = label || "HIGH PRIORITY";
      IconComponent = AlertTriangle;
      break;
    case "medium":
      badgeClass = "badge-intelligence";
      defaultLabel = label || "MEDIUM";
      IconComponent = Radio;
      break;
    case "low":
      badgeClass = "badge-neutral";
      defaultLabel = label || "LOW";
      IconComponent = Radio;
      break;
    case "resolved":
    case "closed":
      badgeClass = "badge-resolved";
      defaultLabel = label || "VERIFIED RESOLVED";
      IconComponent = CheckCircle2;
      break;
    case "intelligence":
      badgeClass = "badge-intelligence";
      defaultLabel = label || "AI CORRELATED";
      IconComponent = Sparkles;
      break;
    case "in_progress":
      badgeClass = "badge-high";
      defaultLabel = label || "IN PROGRESS";
      IconComponent = Clock;
      break;
    case "assigned":
      badgeClass = "badge-intelligence";
      defaultLabel = label || "ASSIGNED";
      IconComponent = Truck;
      break;
    case "new":
      badgeClass = "badge-neutral";
      defaultLabel = label || "NEW SIGNAL";
      IconComponent = Radio;
      break;
    case "under_review":
    case "awaiting_verification":
    case "pending_verification":
      badgeClass = "badge-high";
      defaultLabel = label || "AWAITING VERIFICATION";
      IconComponent = FileSearch;
      break;
    case "neutral":
    default:
      badgeClass = "badge-neutral";
      defaultLabel = label || status.toUpperCase().replace(/_/g, " ");
      IconComponent = Activity;
      break;
  }

  return (
    <span 
      className={`${badgeClass} ${className}`}
      role="status"
      aria-label={`${defaultLabel}${value !== undefined ? `: ${value}` : ''}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{defaultLabel}</span>
      {value !== undefined && (
        <span className="opacity-80 font-normal">({value})</span>
      )}
    </span>
  );
}

export default TelemetryBadge;
