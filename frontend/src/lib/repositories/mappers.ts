import { 
  Incident, 
  CitizenReport, 
  FieldTask, 
  FieldTeam, 
  IncidentTimelineEvent, 
  IssueCategory, 
  PriorityLevel, 
  IncidentStatus, 
  ReportStatus, 
  TaskStatus,
  AIExplanationFactor,
  User
} from "../../types";
import { 
  Incident as PrismaIncident, 
  CitizenReport as PrismaReport, 
  FieldTask as PrismaTask, 
  FieldTeam as PrismaTeam,
  IncidentTimelineEvent as PrismaTimeline,
  User as PrismaUser
} from "@prisma/client";

export function mapPrismaUserToDomain(p: PrismaUser): User {
  return {
    id: p.id,
    name: p.name,
    role: (p.role ? p.role.toLowerCase() : "citizen") as any,
    email: p.email || undefined,
    phone: p.phone || undefined,
    avatarUrl: p.avatarUrl || undefined,
    teamId: (p as any).teamId || undefined,
    isAvailable: (p as any).isAvailable !== undefined ? (p as any).isAvailable : true
  };
}

export function mapPrismaIncidentToDomain(
  p: PrismaIncident & { 
    timelineEvents?: PrismaTimeline[]; 
    reports?: PrismaReport[]; 
    fieldTasks?: PrismaTask[]; 
    assignedTeam?: PrismaTeam | null; 
  }
): Incident {
  let explanations: AIExplanationFactor[] = [];
  if (p.aiExplanationJson) {
    try {
      explanations = JSON.parse(p.aiExplanationJson);
    } catch {
      explanations = [];
    }
  }

  const timeline: IncidentTimelineEvent[] = (p.timelineEvents || []).map((t) => ({
    id: t.id,
    time: t.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: t.title,
    description: t.description,
    type: t.type as any,
    actor: t.actor || undefined
  }));

  return {
    id: p.id,
    title: p.title,
    category: p.category as IssueCategory,
    priority: p.priority as PriorityLevel,
    priorityScore: p.priorityScore,
    priorityReason: p.priorityReason,
    status: p.status as IncidentStatus,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    zone: p.zone,
    affectedCitizenEstimate: p.affectedCitizenEstimate,
    connectedReportsCount: p.reports ? p.reports.length : 1,
    aiConfidence: p.aiConfidence,
    aiExplanations: explanations,
    assignedTeamId: p.assignedTeamId || undefined,
    assignedTeamName: p.assignedTeamName || (p.assignedTeam ? p.assignedTeam.name : undefined),
    assignedWorkerId: (p as any).assignedWorkerId || undefined,
    assignedWorkerName: (p as any).assignedWorkerName || undefined,
    source: (p as any).source || "production",
    beforeEvidenceUrl: p.beforeEvidenceUrl || undefined,
    afterEvidenceUrl: p.afterEvidenceUrl || undefined,
    citizenFeedbackStatus: p.citizenFeedbackStatus || undefined,
    citizenFeedbackNotes: p.citizenFeedbackNotes || undefined,
    reopenedAt: p.reopenedAt ? p.reopenedAt.toISOString() : undefined,
    reopenedReason: p.reopenedReason || undefined,
    reopenedByCitizenId: p.reopenedByCitizenId || undefined,
    timeline,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  };
}

export function mapPrismaReportToDomain(p: PrismaReport): CitizenReport {
  let embedding: number[] | undefined = undefined;
  if (p.embeddingJson) {
    try {
      embedding = JSON.parse(p.embeddingJson);
    } catch {
      embedding = undefined;
    }
  }

  return {
    id: p.id,
    userId: p.userId,
    userName: p.userName || undefined,
    userPhone: p.userPhone || undefined,
    incidentId: p.incidentId || undefined,
    description: p.description,
    category: p.category as IssueCategory,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    mediaUrl: p.mediaUrl || undefined,
    mediaType: (p.mediaType as any) || "image",
    status: p.status as ReportStatus,
    source: (p as any).source || "production",
    createdAt: p.createdAt.toISOString(),
    embedding
  };
}

export function mapPrismaTeamToDomain(p: PrismaTeam & { members?: PrismaUser[]; leader?: PrismaUser | null }): FieldTeam {
  return {
    id: p.id,
    department: p.department,
    name: p.name,
    leaderId: (p as any).leaderId || undefined,
    leaderName: p.leaderName,
    phone: p.phone,
    specialization: p.specialization,
    status: p.status as any,
    activeIncidentId: p.activeIncidentId || undefined,
    currentLatitude: p.currentLatitude,
    currentLongitude: p.currentLongitude,
    rating: p.rating,
    tasksCompleted: p.tasksCompleted,
    members: p.members ? p.members.map(mapPrismaUserToDomain) : undefined,
    leader: p.leader ? mapPrismaUserToDomain(p.leader) : undefined
  };
}

export function mapPrismaTaskToDomain(p: PrismaTask): FieldTask {
  return {
    id: p.id,
    incidentId: p.incidentId,
    teamId: p.teamId,
    workerName: p.workerName,
    assignedWorkerId: (p as any).assignedWorkerId || undefined,
    status: p.status as TaskStatus,
    priority: p.priority as PriorityLevel,
    instructions: p.instructions,
    siteAddress: p.siteAddress,
    latitude: p.latitude,
    longitude: p.longitude,
    distanceKm: p.distanceKm,
    beforePhotoUrl: p.beforePhotoUrl || undefined,
    afterPhotoUrl: p.afterPhotoUrl || undefined,
    workerNotes: p.workerNotes || undefined,
    assignedAt: p.assignedAt.toISOString(),
    startedAt: p.startedAt ? p.startedAt.toISOString() : undefined,
    completedAt: p.completedAt ? p.completedAt.toISOString() : undefined
  };
}
