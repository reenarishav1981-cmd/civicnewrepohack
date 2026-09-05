/**
 * CivicPulse Phase 8 — Department Performance Engine
 * Evaluates municipal departments across real categories, SLAs, backlogs, and resolution velocity.
 */

import { Incident, FieldTask } from "@/types";
import { DepartmentPerformanceProfile, DepartmentStatus } from "./executiveTypes";

export const MUNICIPAL_SLA_HOURS: Record<string, number> = {
  ROAD_HAZARD: 48,
  WATER_LEAKAGE: 24,
  SANITATION: 24,
  STREETLIGHT: 36,
  DEFAULT: 48,
};

export const DEPARTMENT_MAPPINGS: Record<string, string> = {
  "Road Hazard": "Public Works / Road Infrastructure",
  "Pothole": "Public Works / Road Infrastructure",
  "Pavement Cavity": "Public Works / Road Infrastructure",
  "Water Leakage": "Water Supply & Sewerage",
  "Pipeline Burst": "Water Supply & Sewerage",
  "Drainage Overflow": "Water Supply & Sewerage",
  "Sanitation": "Public Health & Solid Waste",
  "Garbage": "Public Health & Solid Waste",
  "Solid Waste": "Public Health & Solid Waste",
  "Streetlight": "Electrical & Energy",
  "Electrical": "Electrical & Energy",
  "Public Safety": "Disaster Management & Emergency Response",
  "Tree Fall": "Disaster Management & Emergency Response",
};

/**
 * Maps an incident category to its governing municipal department
 */
export function mapCategoryToDepartment(category: string): string {
  if (!category) return "General Municipal Operations";
  const normalized = category.trim();
  for (const [key, dept] of Object.entries(DEPARTMENT_MAPPINGS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return dept;
    }
  }
  return "General Municipal Operations";
}

/**
 * Resolves SLA allowance in hours for an incident based on its category
 */
export function getDepartmentSLAHours(category: string): number {
  const norm = (category || "").toLowerCase();
  if (norm.includes("road") || norm.includes("pothole")) return MUNICIPAL_SLA_HOURS.ROAD_HAZARD;
  if (norm.includes("water") || norm.includes("drain") || norm.includes("leak")) return MUNICIPAL_SLA_HOURS.WATER_LEAKAGE;
  if (norm.includes("sanit") || norm.includes("garb") || norm.includes("waste")) return MUNICIPAL_SLA_HOURS.SANITATION;
  if (norm.includes("light") || norm.includes("electr") || norm.includes("power")) return MUNICIPAL_SLA_HOURS.STREETLIGHT;
  return MUNICIPAL_SLA_HOURS.DEFAULT;
}

/**
 * Evaluates department status with strict deterministic priority order:
 * 1. CRITICAL: SLA breach > 40% OR Active Backlog > 15 OR Critical Incidents >= 3
 * 2. NEEDS_ATTENTION: SLA breach > 25% OR Reopen Rate > 15%
 * 3. HEALTHY: Resolution Rate >= 85% AND SLA breach < 15%
 * 4. STABLE: Default when performance is within acceptable operational bounds
 */
export function evaluateDepartmentStatus(
  resolutionRate: number,
  slaBreachRate: number,
  reopenRate: number,
  activeBacklog: number,
  criticalCount: number
): DepartmentStatus {
  // 1. CRITICAL Check
  if (slaBreachRate > 0.40 || activeBacklog > 15 || criticalCount >= 3) {
    return "CRITICAL";
  }

  // 2. NEEDS_ATTENTION Check
  if (slaBreachRate > 0.25 || reopenRate > 0.15) {
    return "NEEDS_ATTENTION";
  }

  // 3. HEALTHY Check
  if (resolutionRate >= 0.85 && slaBreachRate < 0.15) {
    return "HEALTHY";
  }

  // 4. STABLE Fallback
  return "STABLE";
}

/**
 * Analyzes operational performance across all municipal departments
 */
export function analyzeDepartmentPerformance(
  incidents: Incident[],
  tasks: FieldTask[] = []
): DepartmentPerformanceProfile[] {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Group incidents by mapped department
  const deptGroups = new Map<string, Incident[]>();

  // Ensure primary standard departments are always initialized
  const standardDepts = [
    "Public Works / Road Infrastructure",
    "Water Supply & Sewerage",
    "Public Health & Solid Waste",
    "Electrical & Energy",
    "Disaster Management & Emergency Response",
  ];
  standardDepts.forEach((d) => deptGroups.set(d, []));

  incidents.forEach((inc) => {
    const dept = mapCategoryToDepartment(inc.category);
    if (!deptGroups.has(dept)) {
      deptGroups.set(dept, []);
    }
    deptGroups.get(dept)!.push(inc);
  });

  const profiles: DepartmentPerformanceProfile[] = [];

  deptGroups.forEach((deptIncidents, deptName) => {
    const totalIncidents = deptIncidents.length;
    const categoriesSet = new Set<string>();

    let activeIncidents = 0;
    let resolvedIncidents = 0;
    let reopenedCount = 0;
    let criticalIncidentCount = 0;
    let velocityCount24h = 0;
    let totalResolutionHours = 0;
    let slaBreaches = 0;

    deptIncidents.forEach((inc) => {
      categoriesSet.add(inc.category);

      const isResolved = inc.status === "resolved" || inc.status === "closed";
      const createdMs = new Date(inc.createdAt).getTime();
      const updatedMs = new Date(inc.updatedAt).getTime();

      // Velocity in rolling 24 hours
      if (now - createdMs <= ONE_DAY_MS) {
        velocityCount24h++;
      }

      // Critical priority check
      if (inc.priority === "critical" || (inc.priorityScore && inc.priorityScore >= 75)) {
        criticalIncidentCount++;
      }

      // Reopened check
      if (inc.reopenedAt || inc.status === "reopen_requested") {
        reopenedCount++;
      }

      if (isResolved) {
        resolvedIncidents++;
        const durationHours = Math.max(1, (updatedMs - createdMs) / (1000 * 60 * 60));
        totalResolutionHours += durationHours;

        const maxSLA = getDepartmentSLAHours(inc.category);
        if (durationHours > maxSLA) {
          slaBreaches++;
        }
      } else {
        activeIncidents++;
      }
    });

    const resolutionRate = totalIncidents > 0 ? Number((resolvedIncidents / totalIncidents).toFixed(2)) : 0;
    const averageResolutionHours = resolvedIncidents > 0 ? Math.round(totalResolutionHours / resolvedIncidents) : 0;
    const slaComplianceRate = resolvedIncidents > 0 ? Number(((resolvedIncidents - slaBreaches) / resolvedIncidents).toFixed(2)) : 1.0;
    const slaBreachRate = Number((1.0 - slaComplianceRate).toFixed(2));
    const reopenRate = resolvedIncidents > 0 ? Number((reopenedCount / resolvedIncidents).toFixed(2)) : 0;
    const activeBacklog = activeIncidents;

    const status = evaluateDepartmentStatus(
      resolutionRate,
      slaBreachRate,
      reopenRate,
      activeBacklog,
      criticalIncidentCount
    );

    profiles.push({
      department: deptName,
      categoryNames: Array.from(categoriesSet),
      totalIncidents,
      activeIncidents,
      resolvedIncidents,
      resolutionRate,
      averageResolutionHours,
      slaComplianceRate,
      slaBreachRate,
      reopenRate,
      incidentVelocity: velocityCount24h,
      activeBacklog,
      criticalIncidentCount,
      status,
    });
  });

  return profiles;
}
