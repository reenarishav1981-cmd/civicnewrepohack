export interface PublicTimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  type: string;
}

/**
 * Transforms internal IncidentTimelineEvent objects into clean, public-safe
 * transparency records. Strips any internal technician names, contact info, or operational codes.
 */
export function mapTimelineEventToPublicEvent(event: any): PublicTimelineEvent {
  const type = event.type || "";
  let stage = "Status Update";
  let title = event.title || "Operational Update";
  let description = event.description || "The municipal operations system logged an activity.";

  switch (type) {
    case "signal_received":
      stage = "Report Received";
      title = "Citizen Report Registered";
      description = "Your civic report has been received and registered into the municipal operations grid.";
      break;

    case "ai_correlated":
      stage = "Report Assessment";
      title = "Issue Validated by Municipal Systems";
      description = "Report verified and correlated with urban infrastructure records for priority response.";
      break;

    case "team_assigned":
      stage = "Team Assigned";
      title = "Response Team Assigned";
      description = "A specialized municipal response crew has been assigned to address the reported hazard.";
      break;

    case "task_en_route":
      stage = "Team En Route";
      title = "Response Team Travelling to Site";
      description = "The dedicated field team has departed and is travelling to the reported location.";
      break;

    case "worker_arrived":
      stage = "Team On Site";
      title = "Response Team Arrived";
      description = "The response team has arrived on site and initialized physical safety inspection.";
      break;

    case "work_started":
      stage = "Work In Progress";
      title = "Municipal Repair Work Started";
      description = "Technical restoration, repair, and site remediation work is actively in progress.";
      break;

    case "evidence_uploaded":
      stage = "Work Completed";
      title = "Field Repairs Concluded";
      description = "Field work has concluded. Photographic proof submitted for quality inspection.";
      break;

    case "pending_verification":
      stage = "Under Inspection";
      title = "Undergoing Supervisory Inspection";
      description = "Site restoration dossier is undergoing review by municipal operations.";
      break;

    case "resolved":
      stage = "Resolved";
      title = "Incident Officially Resolved";
      description = "Repairs have been officially verified and approved. Incident is now closed.";
      break;

    case "reopen_requested":
      stage = "Reopen Requested";
      title = "Citizen Reported Issue Persists";
      description = "Citizen reported that the problem requires further attention. Supervisory review initialized.";
      break;

    case "incident_reopened":
      stage = "Incident Reopened";
      title = "Case Reopened for Remediation";
      description = "Municipal supervisor approved case reopening. Incident scheduled for further field action.";
      break;

    case "reopen_request_rejected":
      stage = "Review Concluded";
      title = "Supervisory Review Concluded";
      description = "Site inspection confirmed verified resolution criteria met. Original resolution upheld.";
      break;

    default:
      stage = "Operational Update";
      title = event.title || "Progress Update";
      description = event.description || "Field status was updated.";
      break;
  }

  const rawTime = event.time || event.createdAt;
  let formattedTime = "Recent";
  if (rawTime) {
    try {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        formattedTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + 
          " • " + d.toLocaleDateString([], { month: "short", day: "numeric" });
      } else {
        formattedTime = String(rawTime);
      }
    } catch {
      formattedTime = String(rawTime);
    }
  }

  return {
    id: event.id || `pt-${Date.now()}`,
    stage,
    title,
    description,
    timestamp: formattedTime,
    completed: true,
    type,
  };
}