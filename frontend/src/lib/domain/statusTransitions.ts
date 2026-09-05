import { IncidentStatus, TaskStatus } from "@/types";

// Valid Task Status Progression: Strict forward workflow
export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  assigned: ["en_route"],
  en_route: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
  completed: ["verified", "in_progress"],
  verified: []
};

// Valid Incident Status Progression
export const VALID_INCIDENT_TRANSITIONS: Record<string, string[]> = {
  new: ["under_review", "assigned"],
  under_review: ["assigned", "new"],
  assigned: ["in_progress"],
  in_progress: ["awaiting_verification", "pending_verification"],
  awaiting_verification: ["resolved", "in_progress"],
  pending_verification: ["resolved", "in_progress"],
  resolved: ["closed", "in_progress"],
  closed: []
};

export function getAllowedNextTaskStatuses(current: TaskStatus): TaskStatus[] {
  return VALID_TASK_TRANSITIONS[current] || [];
}

export function canTransitionTaskStatus(current: TaskStatus, target: TaskStatus): boolean {
  // Disallow no-ops or self-transitions to prevent redundant execution and duplicate events
  if (current === target) return false;
  const allowed = VALID_TASK_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function canTransitionIncidentStatus(current: string, target: string): boolean {
  if (current === target) return false;
  const allowed = VALID_INCIDENT_TRANSITIONS[current] || [];
  return allowed.includes(target);
}
