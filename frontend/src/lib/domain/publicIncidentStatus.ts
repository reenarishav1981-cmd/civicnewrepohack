export interface PublicIncidentStatusInfo {
  publicStatus: string;
  statusCode: string;
  description: string;
  stageKey: 
    | "report_received" 
    | "team_assigned" 
    | "team_en_route" 
    | "team_arrived" 
    | "in_progress" 
    | "under_inspection" 
    | "reopen_requested" 
    | "resolved";
  isResolved: boolean;
  progressPercentage: number;
}

/**
 * Maps internal incident and active field task status to a citizen-safe,
 * public transparency status descriptor.
 */
export function getPublicIncidentStatus(
  incidentStatus: string,
  taskStatus?: string | null
): PublicIncidentStatusInfo {
  const normInc = (incidentStatus || "").toLowerCase().trim();
  const normTask = (taskStatus || "").toLowerCase().trim();

  // 1. Resolved / Closed
  if (normInc === "resolved" || normInc === "closed") {
    return {
      publicStatus: "RESOLVED",
      statusCode: "resolved",
      description: "The work has been officially verified and the incident has been resolved.",
      stageKey: "resolved",
      isResolved: true,
      progressPercentage: 100,
    };
  }

  // 2. Reopen Requested
  if (normInc === "reopen_requested") {
    return {
      publicStatus: "REOPEN REQUESTED",
      statusCode: "reopen_requested",
      description: "Citizen reported issue still exists. Municipal operations reviewing case for re-dispatch.",
      stageKey: "reopen_requested",
      isResolved: false,
      progressPercentage: 85,
    };
  }

  // 3. Awaiting Verification / Inspection
  if (normInc === "awaiting_verification" || normInc === "pending_verification") {
    return {
      publicStatus: "WORK COMPLETED — UNDER INSPECTION",
      statusCode: "awaiting_verification",
      description: "Field work has been completed and is awaiting official supervisory verification.",
      stageKey: "under_inspection",
      isResolved: false,
      progressPercentage: 80,
    };
  }

  // 4. In Progress (Task or Incident)
  if (normTask === "in_progress" || (normInc === "in_progress" && normTask !== "arrived" && normTask !== "en_route")) {
    return {
      publicStatus: "WORK IN PROGRESS",
      statusCode: "in_progress",
      description: "Municipal crews are actively working on the issue on-site.",
      stageKey: "in_progress",
      isResolved: false,
      progressPercentage: 60,
    };
  }

  // 5. Arrived
  if (normTask === "arrived") {
    return {
      publicStatus: "TEAM ON SITE",
      statusCode: "arrived",
      description: "The response team has arrived at the location and initialized site safety inspection.",
      stageKey: "team_arrived",
      isResolved: false,
      progressPercentage: 45,
    };
  }

  // 6. En Route
  if (normTask === "en_route") {
    return {
      publicStatus: "TEAM EN ROUTE",
      statusCode: "en_route",
      description: "The response team is travelling to the location.",
      stageKey: "team_en_route",
      isResolved: false,
      progressPercentage: 30,
    };
  }

  // 7. Assigned
  if (normInc === "assigned" || normTask === "assigned") {
    return {
      publicStatus: "TEAM ASSIGNED",
      statusCode: "assigned",
      description: "A municipal response team has been assigned.",
      stageKey: "team_assigned",
      isResolved: false,
      progressPercentage: 20,
    };
  }

  // 8. New / Under Review / Default
  return {
    publicStatus: "REPORT RECEIVED",
    statusCode: "under_review",
    description: "Your report has been received and is being assessed by municipal operations.",
    stageKey: "report_received",
    isResolved: false,
    progressPercentage: 10,
  };
}

/**
 * Standard 7-stage public journey steps for visual stepper/HUD
 */
export const PUBLIC_LIFECYCLE_STAGES = [
  { key: "report_received", label: "Report Received", stepNum: 1 },
  { key: "team_assigned", label: "Team Assigned", stepNum: 2 },
  { key: "team_en_route", label: "Team En Route", stepNum: 3 },
  { key: "team_arrived", label: "Team On Site", stepNum: 4 },
  { key: "in_progress", label: "Work In Progress", stepNum: 5 },
  { key: "under_inspection", label: "Under Inspection", stepNum: 6 },
  { key: "resolved", label: "Resolved", stepNum: 7 },
];