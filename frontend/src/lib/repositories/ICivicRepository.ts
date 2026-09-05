import { 
  Incident, 
  CitizenReport, 
  FieldTask, 
  FieldTeam, 
  IncidentStatus, 
  PriorityLevel, 
  TaskStatus,
  User 
} from "../../types";

/**
 * CivicPulse Storage Repository Interface
 * Enables interchangeable persistence backends (In-Memory -> Prisma/PostgreSQL).
 */
export interface ICivicRepository {
  // Incident Operations
  getIncidents(filters?: { status?: string; priority?: string; source?: string }): Promise<Incident[]>;
  getIncidentById(id: string): Promise<Incident | null>;
  createIncident(incident: Incident): Promise<Incident>;
  updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null>;

  // Report Operations
  getReports(filter?: { userId?: string }): Promise<CitizenReport[]>;
  getReportById(id: string): Promise<CitizenReport | null>;
  createReport(report: CitizenReport): Promise<CitizenReport>;
  connectReportToIncident(reportId: string, incidentId: string): Promise<void>;

  // Team Operations
  getTeams(): Promise<FieldTeam[]>;
  getTeamById(id: string): Promise<FieldTeam | null>;
  updateTeamStatus(teamId: string, status: FieldTeam["status"], activeIncidentId?: string): Promise<FieldTeam | null>;

  // Task Operations
  getTasks(filter?: string | { teamId?: string; assignedWorkerId?: string }): Promise<FieldTask[]>;
  getTaskById(id: string): Promise<FieldTask | null>;
  createTask(task: FieldTask): Promise<FieldTask>;
  updateTaskStatus(taskId: string, status: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<FieldTask | null>;

  // Activity & Timeline
  getActivityLogs(limit?: number): Promise<any[]>;
  addActivityLog(log: { actor: string; action: string; target: string; type: string }): Promise<void>;
  addTimelineEvent(incidentId: string, event: { title: string; description: string; type: any; actor?: string }): Promise<void>;

  // Atomic Domain Workflows
  assignTeamToIncident(incidentId: string, teamId: string, instructions?: string, workerId?: string): Promise<{ incident: Incident; task: FieldTask; team: FieldTeam }>;
  advanceTaskStatus(taskId: string, targetStatus: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<{ task: FieldTask; incidentStatus?: IncidentStatus }>;
  verifyIncident(incidentId: string, decision: "approve" | "reject", notes?: string, verifiedById?: string): Promise<{ incident: Incident; team?: FieldTeam }>;
  submitCitizenFeedback(incidentId: string, citizenId: string, feedbackStatus: "RESOLVED SUCCESSFULLY" | "ISSUE STILL EXISTS", feedbackNotes?: string): Promise<{ incident: Incident }>;
  reviewReopenRequest(incidentId: string, decision: "approve" | "reject", reviewNotes?: string, operatorId?: string): Promise<{ incident: Incident }>;
  processReportSubmissionAtomic(params: {
    report: CitizenReport;
    targetIncidentId?: string;
    newIncident?: Incident;
    aiPriorityScore?: number;
    aiPriorityLevel?: PriorityLevel;
    aiPriorityReason?: string;
  }): Promise<{ report: CitizenReport; incident: Incident }>;

  // User & Authentication Operations
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<(User & { passwordHash?: string | null }) | null>;
  createUser(user: { name: string; email: string; passwordHash: string; role?: string; phone?: string }): Promise<User>;
}
