import { ICivicRepository } from "./ICivicRepository";
import { db } from "../db";
import { 
  Incident, 
  CitizenReport, 
  FieldTask, 
  FieldTeam, 
  IncidentStatus,
  TaskStatus,
  PriorityLevel,
  User 
} from "../../types";
import { canTransitionTaskStatus, getAllowedNextTaskStatuses } from "../domain/statusTransitions";
import { NotFoundError, ConflictError, UnprocessableEntityError, ForbiddenError } from "../errors/AppError";

/**
 * In-Memory Adapter implementation of ICivicRepository.
 * Delegates seamlessly to existing src/lib/db.ts without breaking working seed data.
 */
export class InMemoryCivicRepository implements ICivicRepository {
  async getIncidents(filters?: { status?: string; priority?: string }): Promise<Incident[]> {
    let list = db.getIncidents();
    if (filters?.status && filters.status !== "all") {
      list = list.filter(i => i.status === filters.status);
    }
    if (filters?.priority && filters.priority !== "all") {
      list = list.filter(i => i.priority === filters.priority);
    }
    return list;
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const inc = db.getIncidentById(id);
    return inc || null;
  }

  async createIncident(incident: Incident): Promise<Incident> {
    return db.createIncident(incident);
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const updated = db.updateIncident(id, updates);
    return updated || null;
  }

  async getReports(filter?: { userId?: string }): Promise<CitizenReport[]> {
    let reports = db.getReports();
    if (filter?.userId) {
      reports = reports.filter(r => r.userId === filter.userId);
    }
    return reports;
  }

  async getReportById(id: string): Promise<CitizenReport | null> {
    const report = db.getReports().find(r => r.id === id);
    return report || null;
  }

  async createReport(report: CitizenReport): Promise<CitizenReport> {
    return db.addReport(report);
  }

  async connectReportToIncident(reportId: string, incidentId: string): Promise<void> {
    db.connectReportToIncident(reportId, incidentId);
  }

  async getTeams(): Promise<FieldTeam[]> {
    return db.getTeams();
  }

  async getTeamById(id: string): Promise<FieldTeam | null> {
    const team = db.getTeamById(id);
    return team || null;
  }

  async updateTeamStatus(teamId: string, status: FieldTeam["status"], activeIncidentId?: string): Promise<FieldTeam | null> {
    const team = db.updateTeam(teamId, { status, activeIncidentId });
    return team || null;
  }

  async getTasks(filter?: string | { teamId?: string; assignedWorkerId?: string }): Promise<FieldTask[]> {
    let tasks = db.getTasks();
    if (typeof filter === "string") {
      tasks = tasks.filter(t => t.teamId === filter);
    } else if (filter) {
      if (filter.teamId) tasks = tasks.filter(t => t.teamId === filter.teamId);
      if (filter.assignedWorkerId) tasks = tasks.filter(t => t.assignedWorkerId === filter.assignedWorkerId);
    }
    return tasks;
  }

  async getTaskById(id: string): Promise<FieldTask | null> {
    const task = db.getTaskById(id);
    return task || null;
  }

  async createTask(task: FieldTask): Promise<FieldTask> {
    return db.createTask(task);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<FieldTask | null> {
    const result = await this.advanceTaskStatus(taskId, status, updates);
    return result.task;
  }

  async getActivityLogs(limit: number = 30): Promise<any[]> {
    return db.getActivityLogs().slice(0, limit);
  }

  async addActivityLog(log: { actor: string; action: string; target: string; type: string }): Promise<void> {
    db.addActivityLog({
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: log.type as any,
      title: log.action,
      description: `${log.action} on ${log.target}`,
      actor: log.actor
    });
  }

  async addTimelineEvent(incidentId: string, event: { title: string; description: string; type: any; actor?: string }): Promise<void> {
    const incident = db.getIncidentById(incidentId);
    if (incident) {
      incident.timeline = incident.timeline || [];
      incident.timeline.unshift({
        id: `TL-${Date.now()}`,
        time: "Just now",
        title: event.title,
        description: event.description,
        type: event.type,
        actor: event.actor
      });
      db.updateIncident(incidentId, { timeline: incident.timeline });
    }
  }

  async assignTeamToIncident(incidentId: string, teamId: string, instructions?: string): Promise<{ incident: Incident; task: FieldTask; team: FieldTeam }> {
    const incident = db.getIncidentById(incidentId);
    if (!incident) throw new Error("Incident not found");
    if (incident.status === "resolved" || incident.status === "closed") {
      throw new Error(`Incident '${incidentId}' is already ${incident.status} and cannot be assigned.`);
    }

    const team = db.getTeamById(teamId);
    if (!team) throw new Error("Team not found");
    if (team.status !== "available") {
      throw new Error(`Team '${team.name}' is currently ${team.status} and cannot be assigned.`);
    }

    db.updateTeam(teamId, { status: "dispatched", activeIncidentId: incidentId });

    // Resolve assigned worker: match phone first, then fallback to leaderName
    let workerUser = team.phone ? db.getUsers().find(u => u.phone === team.phone && u.role === "worker") : undefined;
    if (!workerUser) {
      workerUser = db.getUsers().find(u => u.name === team.leaderName && u.role === "worker");
    }

    const taskId = `TSK-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: FieldTask = {
      id: taskId,
      incidentId,
      teamId,
      workerName: team.leaderName,
      assignedWorkerId: workerUser ? workerUser.id : undefined,
      status: "assigned",
      priority: incident.priority,
      instructions: instructions || `Respond immediately to ${incident.title}. Inspect site hazard and commence restoration work.`,
      siteAddress: incident.address,
      latitude: incident.latitude,
      longitude: incident.longitude,
      distanceKm: 1.2,
      beforePhotoUrl: incident.beforeEvidenceUrl,
      assignedAt: new Date().toISOString()
    };
    db.createTask(newTask);

    const updatedTimeline = [
      ...(incident.timeline || []),
      {
        id: `tl-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Team Dispatched",
        description: `${team.name} (${team.leaderName}) dispatched to site with priority instructions.`,
        type: "team_assigned" as const,
        actor: "Operations Control"
      }
    ];

    const updatedIncident = db.updateIncident(incidentId, {
      status: "assigned",
      assignedTeamId: teamId,
      assignedTeamName: team.name,
      timeline: updatedTimeline
    })!;

    const updatedTeam = db.getTeamById(teamId)!;

    return {
      incident: updatedIncident,
      task: newTask,
      team: updatedTeam
    };
  }

  async advanceTaskStatus(taskId: string, targetStatus: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<{ task: FieldTask; incidentStatus?: IncidentStatus }> {
    const task = db.getTaskById(taskId);
    if (!task) throw new NotFoundError("Task not found");

    if (!canTransitionTaskStatus(task.status, targetStatus)) {
      const allowed = getAllowedNextTaskStatuses(task.status);
      throw new ConflictError(
        `Invalid task transition from '${task.status}' to '${targetStatus}'. Allowed next states: ${allowed.join(", ") || "none"}.`
      );
    }

    if (targetStatus === "completed") {
      const missingRequirements: string[] = [];
      const afterPhoto = (updates?.afterPhotoUrl || "").trim();
      const notes = (updates?.workerNotes || "").trim();

      if (!afterPhoto) missingRequirements.push("afterPhotoUrl");
      if (!notes || notes.length < 5) missingRequirements.push("workerNotes");

      if (missingRequirements.length > 0) {
        throw new UnprocessableEntityError("Completion evidence is required", {
          missingRequirements,
          currentStatus: task.status,
          requestedStatus: targetStatus
        });
      }
    }

    const updatedTask = db.updateTask(taskId, {
      status: targetStatus,
      ...(updates || {})
    })!;

    const incident = db.getIncidentById(task.incidentId);
    let newIncidentStatus: IncidentStatus | undefined = undefined;

    if (incident) {
      newIncidentStatus = incident.status;
      let timelineTitle = "Field Status Update";
      let timelineDesc = `Worker ${task.workerName} updated status to ${targetStatus}`;
      let eventType = "work_started";

      if (targetStatus === "en_route") {
        timelineTitle = "Field Team En Route";
        timelineDesc = `${task.workerName} has departed and is en route to site.`;
        eventType = "task_en_route";
      } else if (targetStatus === "arrived") {
        newIncidentStatus = "in_progress";
        timelineTitle = "Team Arrived on Site";
        timelineDesc = `${task.workerName} arrived at site. Equipment setup and inspection initialized.`;
        eventType = "worker_arrived";
      } else if (targetStatus === "in_progress") {
        newIncidentStatus = "in_progress";
        timelineTitle = "Restoration Work in Progress";
        timelineDesc = updates?.workerNotes || "Field maintenance and technical repair actively in progress.";
        eventType = "work_started";
      } else if (targetStatus === "completed") {
        timelineTitle = "Field Work Completed";
        timelineDesc = updates?.workerNotes || "Site repairs completed successfully. After-work evidence submitted.";
        eventType = "evidence_uploaded";

        const allIncidentTasks = db.getTasks().filter(t => t.incidentId === task.incidentId);
        const allCompleted = allIncidentTasks.every(t => t.id === taskId ? true : t.status === "completed");

        if (allCompleted) {
          newIncidentStatus = "awaiting_verification";
        }
      }

      const currentTimeline = incident.timeline || [];
      currentTimeline.unshift({
        id: `tl-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: timelineTitle,
        description: timelineDesc,
        type: eventType as any,
        actor: task.workerName
      });

      if (targetStatus === "completed" && newIncidentStatus === "awaiting_verification") {
        currentTimeline.unshift({
          id: `tl-${Date.now() + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: "Awaiting Operational Quality Verification",
          description: "All assigned field work has concluded. Incident dossier submitted to Operations Control for inspection and sign-off.",
          type: "pending_verification" as any,
          actor: "CivicPulse Automated Workflow"
        });
      }

      db.updateIncident(incident.id, {
        status: newIncidentStatus,
        afterEvidenceUrl: updates?.afterPhotoUrl || incident.afterEvidenceUrl,
        timeline: currentTimeline
      });
    }

    return {
      task: updatedTask,
      incidentStatus: newIncidentStatus
    };
  }

  async verifyIncident(
    incidentId: string,
    decision: "approve" | "reject",
    notes?: string,
    verifiedById?: string
  ): Promise<{ incident: Incident; team?: FieldTeam }> {
    const incident = db.getIncidentById(incidentId);
    if (!incident) throw new NotFoundError("Incident not found");

    if (incident.status !== "awaiting_verification") {
      throw new ConflictError(
        `Incident '${incidentId}' is currently '${incident.status}' and cannot be verified. Status must be 'awaiting_verification'.`
      );
    }

    let updatedIncident: Incident;
    let releasedTeam: FieldTeam | undefined = undefined;

    const currentTimeline = incident.timeline || [];

    if (decision === "approve") {
      if (incident.assignedTeamId) {
        releasedTeam = db.updateTeam(incident.assignedTeamId, {
          status: "available",
          activeIncidentId: undefined
        });
      }

      currentTimeline.unshift({
        id: `tl-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Incident Verified & Resolved",
        description: notes || "Work quality and photographic evidence inspected and approved by Operations Control. Case file resolved.",
        type: "resolved" as any,
        actor: verifiedById ? "Operations Lead" : "Operations Control"
      });

      updatedIncident = db.updateIncident(incidentId, {
        status: "resolved",
        timeline: currentTimeline
      })!;
    } else {
      currentTimeline.unshift({
        id: `tl-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: "Verification Rejected — Remediation Required",
        description: notes || "Work inspection failed verification criteria. Field crew instructed to return to site for remediation.",
        type: "work_started" as any,
        actor: verifiedById ? "Operations Lead" : "Operations Control"
      });

      updatedIncident = db.updateIncident(incidentId, {
        status: "in_progress",
        timeline: currentTimeline
      })!;
    }

    return {
      incident: updatedIncident,
      team: releasedTeam
    };
  }

  async processReportSubmissionAtomic(params: {
    report: CitizenReport;
    targetIncidentId?: string;
    newIncident?: Incident;
    aiPriorityScore?: number;
    aiPriorityLevel?: PriorityLevel;
    aiPriorityReason?: string;
  }): Promise<{ report: CitizenReport; incident: Incident }> {
    let targetIncident: Incident;

    if (params.newIncident) {
      targetIncident = db.createIncident(params.newIncident);
    } else if (params.targetIncidentId) {
      db.connectReportToIncident(params.report.id, params.targetIncidentId);
      targetIncident = db.getIncidentById(params.targetIncidentId)!;
    } else {
      throw new Error("Either newIncident or targetIncidentId must be provided");
    }

    const savedReport = db.addReport({
      ...params.report,
      incidentId: targetIncident.id
    });

    return {
      report: savedReport,
      incident: targetIncident
    };
  }

  async submitCitizenFeedback(
    incidentId: string,
    citizenId: string,
    feedbackStatus: "RESOLVED SUCCESSFULLY" | "ISSUE STILL EXISTS",
    feedbackNotes?: string
  ): Promise<{ incident: Incident }> {
    const incident = db.getIncidentById(incidentId);
    if (!incident) throw new NotFoundError("Incident not found");

    const userReports = db.getReports().filter(r => r.incidentId === incidentId && r.userId === citizenId);
    if (userReports.length === 0) {
      throw new ForbiddenError("Access denied: only the reporting citizen can submit resolution feedback.");
    }

    if (incident.status !== "resolved" && incident.status !== "closed") {
      throw new ConflictError(`Feedback can only be submitted for resolved incidents. Current status: '${incident.status}'.`);
    }

    const isIssuePersisting = feedbackStatus === "ISSUE STILL EXISTS";
    const targetStatus = isIssuePersisting ? "reopen_requested" : "resolved";

    const updated = db.updateIncident(incidentId, {
      status: targetStatus,
      citizenFeedbackStatus: feedbackStatus,
      citizenFeedbackNotes: feedbackNotes,
      reopenedAt: isIssuePersisting ? new Date().toISOString() : undefined,
      reopenedReason: isIssuePersisting ? (feedbackNotes || "Citizen reported problem persists") : undefined,
      reopenedByCitizenId: isIssuePersisting ? citizenId : undefined,
    });

    if (isIssuePersisting) {
      this.addTimelineEvent(incidentId, {
        title: "Citizen Feedback: Issue Still Exists",
        description: feedbackNotes || "Citizen indicated issue has recurred. Reopen requested.",
        type: "reopen_requested",
        actor: "Citizen Reporter"
      });
    } else {
      this.addTimelineEvent(incidentId, {
        title: "Citizen Feedback: Resolved Successfully",
        description: feedbackNotes || "Citizen verified and confirmed satisfactory resolution.",
        type: "resolved",
        actor: "Citizen Reporter"
      });
    }

    return { incident: updated! };
  }

  async reviewReopenRequest(
    incidentId: string,
    decision: "approve" | "reject",
    reviewNotes?: string,
    operatorId?: string
  ): Promise<{ incident: Incident }> {
    const incident = db.getIncidentById(incidentId);
    if (!incident) throw new NotFoundError("Incident not found");

    if (incident.status !== "reopen_requested") {
      throw new ConflictError(`Incident is in '${incident.status}' status. Reopening review requires 'reopen_requested' status.`);
    }

    let targetStatus: IncidentStatus;
    let timelineTitle: string;
    let timelineDesc: string;
    let timelineType: string;

    if (decision === "approve") {
      targetStatus = "in_progress";
      timelineTitle = "Reopen Request Approved";
      timelineDesc = reviewNotes || "Municipal operations approved case reopening. Incident scheduled for remediation dispatch.";
      timelineType = "incident_reopened";
    } else {
      targetStatus = "resolved";
      timelineTitle = "Reopen Request Rejected";
      timelineDesc = reviewNotes || "Municipal operations reviewed case file and confirmed resolution standards met.";
      timelineType = "reopen_request_rejected";
    }

    const updated = db.updateIncident(incidentId, {
      status: targetStatus,
      assignedTeamId: decision === "approve" ? undefined : incident.assignedTeamId,
      assignedTeamName: decision === "approve" ? undefined : incident.assignedTeamName,
    });

    this.addTimelineEvent(incidentId, {
      title: timelineTitle,
      description: timelineDesc,
      type: timelineType,
      actor: operatorId ? "Operations Supervisor" : "Operations Control"
    });

    return { incident: updated! };
  }

  // User & Authentication Operations
  async getUserById(id: string): Promise<User | null> {
    const user = db.getUserById(id);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string | null }) | null> {
    const user = db.getUserByEmail(email);
    return user || null;
  }

  async createUser(data: { name: string; email: string; passwordHash: string; role?: string; phone?: string }): Promise<User> {
    const user: User & { passwordHash?: string | null } = {
      id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: (data.role ? data.role.toLowerCase() : "citizen") as any,
      phone: data.phone
    };
    db.createUser(user);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

// Singleton repository instance for Stage 1
export const civicRepository = new InMemoryCivicRepository();
