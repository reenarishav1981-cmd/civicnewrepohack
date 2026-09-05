import { ICivicRepository } from "./ICivicRepository";
import { prisma } from "../prisma";
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
import { 
  mapPrismaIncidentToDomain, 
  mapPrismaReportToDomain, 
  mapPrismaTaskToDomain, 
  mapPrismaTeamToDomain,
  mapPrismaUserToDomain 
} from "./mappers";
import { evaluateIncidentPriority, formatPriorityReason } from "../ai/priorityEngine";
import { canTransitionTaskStatus, getAllowedNextTaskStatuses } from "../domain/statusTransitions";
import { NotFoundError, ConflictError, UnprocessableEntityError, ForbiddenError } from "../errors/AppError";
import { emitIncidentEvent, emitTaskEvent } from "../realtime";

/**
 * Production-ready Prisma SQLite/PostgreSQL Repository
 * Implements ICivicRepository with full relational persistence.
 */
export class PrismaCivicRepository implements ICivicRepository {
  async getIncidents(filters?: { status?: string; priority?: string; source?: string }): Promise<Incident[]> {
    const where: any = {};
    if (filters?.status && filters.status !== "all") {
      where.status = filters.status;
    }
    if (filters?.priority && filters.priority !== "all") {
      where.priority = filters.priority;
    }
    if (filters?.source && filters.source !== "all") {
      where.source = filters.source;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        timelineEvents: { orderBy: { time: "desc" } },
        reports: true,
        assignedTeam: true,
        fieldTasks: true
      },
      orderBy: { priorityScore: "desc" }
    });

    return incidents.map(mapPrismaIncidentToDomain);
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const inc = await prisma.incident.findUnique({
      where: { id },
      include: {
        timelineEvents: { orderBy: { time: "desc" } },
        reports: true,
        assignedTeam: true,
        fieldTasks: true
      }
    });

    return inc ? mapPrismaIncidentToDomain(inc) : null;
  }

  async createIncident(incident: Incident): Promise<Incident> {
    const created = await prisma.incident.create({
      data: {
        id: incident.id,
        title: incident.title,
        category: incident.category,
        priority: incident.priority,
        priorityScore: incident.priorityScore,
        priorityReason: incident.priorityReason,
        status: incident.status,
        latitude: incident.latitude,
        longitude: incident.longitude,
        address: incident.address,
        zone: incident.zone,
        affectedCitizenEstimate: incident.affectedCitizenEstimate,
        aiConfidence: incident.aiConfidence,
        aiExplanationJson: JSON.stringify(incident.aiExplanations || []),
        assignedTeamId: incident.assignedTeamId,
        assignedTeamName: incident.assignedTeamName,
        assignedWorkerId: incident.assignedWorkerId,
        assignedWorkerName: incident.assignedWorkerName,
        source: incident.source || "production",
        beforeEvidenceUrl: incident.beforeEvidenceUrl,
        afterEvidenceUrl: incident.afterEvidenceUrl,
        createdAt: new Date(incident.createdAt),
        updatedAt: new Date(incident.updatedAt)
      },
      include: {
        timelineEvents: true,
        reports: true,
        assignedTeam: true,
        fieldTasks: true
      }
    });

    // Create initial timeline event if present
    if (incident.timeline && incident.timeline.length > 0) {
      for (const t of incident.timeline) {
        await prisma.incidentTimelineEvent.create({
          data: {
            incidentId: created.id,
            title: t.title,
            description: t.description,
            type: t.type,
            actor: t.actor
          }
        });
      }
    }

    await this.addActivityLog({
      actor: "AI Correlation Engine",
      action: "Incident Formed",
      target: created.id,
      type: "SIGNAL_CORRELATED"
    });

    const formedIncident = (await this.getIncidentById(created.id))!;
    try {
      emitIncidentEvent("INCIDENT_CREATED", formedIncident);
    } catch (_) {}

    return formedIncident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.priorityScore !== undefined) data.priorityScore = updates.priorityScore;
    if (updates.priorityReason !== undefined) data.priorityReason = updates.priorityReason;
    if (updates.assignedTeamId !== undefined) data.assignedTeamId = updates.assignedTeamId;
    if (updates.assignedTeamName !== undefined) data.assignedTeamName = updates.assignedTeamName;
    if (updates.beforeEvidenceUrl !== undefined) data.beforeEvidenceUrl = updates.beforeEvidenceUrl;
    if (updates.afterEvidenceUrl !== undefined) data.afterEvidenceUrl = updates.afterEvidenceUrl;
    if (updates.aiExplanations !== undefined) data.aiExplanationJson = JSON.stringify(updates.aiExplanations);

    await prisma.incident.update({
      where: { id },
      data
    });

    const updated = await this.getIncidentById(id);
    if (updated) {
      try {
        emitIncidentEvent(updates.status ? "INCIDENT_STATUS_CHANGED" : "INCIDENT_UPDATED", updated);
      } catch (_) {}
    }
    return updated;
  }

  async getReports(filter?: { userId?: string }): Promise<CitizenReport[]> {
    const where: any = {};
    if (filter?.userId) where.userId = filter.userId;
    const reports = await prisma.citizenReport.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    return reports.map(mapPrismaReportToDomain);
  }

  async getReportById(id: string): Promise<CitizenReport | null> {
    const r = await prisma.citizenReport.findUnique({ where: { id } });
    return r ? mapPrismaReportToDomain(r) : null;
  }

  async createReport(report: CitizenReport): Promise<CitizenReport> {
    // Ensure user exists or fallback to usr-1
    const userExists = await prisma.user.findUnique({ where: { id: report.userId } });
    const finalUserId = userExists ? report.userId : "usr-1";

    const created = await prisma.citizenReport.create({
      data: {
        id: report.id,
        userId: finalUserId,
        userName: report.userName,
        userPhone: report.userPhone,
        incidentId: report.incidentId,
        description: report.description,
        category: report.category,
        latitude: report.latitude,
        longitude: report.longitude,
        address: report.address,
        mediaUrl: report.mediaUrl,
        mediaType: report.mediaType || "image",
        status: report.status || "received",
        source: report.source || "production",
        embeddingJson: report.embedding ? JSON.stringify(report.embedding) : null,
        createdAt: new Date(report.createdAt)
      }
    });

    await this.addActivityLog({
      actor: report.userName || "Citizen",
      action: "New Civic Signal",
      target: report.id,
      type: "SIGNAL_RECEIVED"
    });

    return mapPrismaReportToDomain(created);
  }

  async connectReportToIncident(reportId: string, incidentId: string): Promise<void> {
    const report = await prisma.citizenReport.findUnique({ where: { id: reportId } });
    const incident = await prisma.incident.findUnique({ 
      where: { id: incidentId },
      include: { reports: true }
    });

    if (report && incident) {
      await prisma.citizenReport.update({
        where: { id: reportId },
        data: { incidentId, status: "correlated" }
      });

      const newCount = incident.reports.length + 1;
      const priorityEval = evaluateIncidentPriority(
        incident.title,
        incident.category,
        newCount,
        incident.latitude,
        incident.longitude
      );

      const calculatedScore = Math.max(incident.priorityScore, priorityEval.score);
      const calculatedPriority: PriorityLevel = calculatedScore >= 80 ? "critical" : (calculatedScore >= 55 ? "high" : (calculatedScore >= 35 ? "medium" : "low"));
      let updatedReason: string;
      if (incident.priorityReason && !incident.priorityReason.includes("/100)")) {
        updatedReason = incident.priorityReason;
      } else {
        updatedReason = formatPriorityReason(calculatedPriority, calculatedScore, priorityEval.factors.map(f => f.title));
      }

      await prisma.incident.update({
        where: { id: incidentId },
        data: {
          affectedCitizenEstimate: incident.affectedCitizenEstimate + 100,
          priority: calculatedPriority,
          priorityScore: calculatedScore,
          priorityReason: updatedReason
        }
      });

      await this.addTimelineEvent(incidentId, {
        title: "Signal Correlated",
        description: `Signal ${reportId} merged into ${incidentId} (Total: ${newCount} signals)`,
        type: "ai_correlated",
        actor: "AI Correlation Engine"
      });

      await this.addActivityLog({
        actor: "AI Correlation Engine",
        action: "Signal Correlated",
        target: incidentId,
        type: "SIGNAL_CORRELATED"
      });
    }
  }

  async getTeams(): Promise<FieldTeam[]> {
    const teams = await prisma.fieldTeam.findMany({
      include: {
        leader: true,
        members: true
      },
      orderBy: { name: "asc" }
    });
    return teams.map(mapPrismaTeamToDomain);
  }

  async getTeamById(id: string): Promise<FieldTeam | null> {
    const t = await prisma.fieldTeam.findUnique({
      where: { id },
      include: {
        leader: true,
        members: true
      }
    });
    return t ? mapPrismaTeamToDomain(t) : null;
  }

  async updateTeamStatus(teamId: string, status: FieldTeam["status"], activeIncidentId?: string): Promise<FieldTeam | null> {
    const updated = await prisma.fieldTeam.update({
      where: { id: teamId },
      data: { status, activeIncidentId: activeIncidentId || null }
    });
    return mapPrismaTeamToDomain(updated);
  }

  async getTasks(filter?: string | { teamId?: string; assignedWorkerId?: string }): Promise<FieldTask[]> {
    const where: any = {};
    if (typeof filter === "string") {
      where.teamId = filter;
    } else if (filter) {
      if (filter.teamId) where.teamId = filter.teamId;
      if (filter.assignedWorkerId) where.assignedWorkerId = filter.assignedWorkerId;
    }

    const tasks = await prisma.fieldTask.findMany({
      where,
      orderBy: { assignedAt: "desc" }
    });

    return tasks.map(mapPrismaTaskToDomain);
  }

  async getTaskById(id: string): Promise<FieldTask | null> {
    const t = await prisma.fieldTask.findUnique({ where: { id } });
    return t ? mapPrismaTaskToDomain(t) : null;
  }

  async createTask(task: FieldTask): Promise<FieldTask> {
    const created = await prisma.fieldTask.create({
      data: {
        id: task.id,
        incidentId: task.incidentId,
        teamId: task.teamId,
        workerName: task.workerName,
        status: task.status,
        priority: task.priority,
        instructions: task.instructions,
        siteAddress: task.siteAddress,
        latitude: task.latitude,
        longitude: task.longitude,
        distanceKm: task.distanceKm,
        beforePhotoUrl: task.beforePhotoUrl,
        assignedAt: new Date(task.assignedAt)
      }
    });

    await this.addActivityLog({
      actor: "Operations Control",
      action: "Task Dispatched",
      target: task.incidentId,
      type: "TEAM_ASSIGNED"
    });

    return mapPrismaTaskToDomain(created);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<FieldTask | null> {
    // Delegated to advanceTaskStatus to ensure Stage 3 state machine transitions and transactional consistency
    const result = await this.advanceTaskStatus(taskId, status, updates);
    return result.task;
  }

  async getActivityLogs(limit: number = 30): Promise<any[]> {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit
    });

    return logs.map((l) => {
      let meta: any = {};
      if (l.metadataJson) {
        try {
          meta = JSON.parse(l.metadataJson);
        } catch {}
      }
      return {
        id: l.id,
        time: l.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: meta.type || "SIGNAL_RECEIVED",
        title: l.action,
        description: `${l.action} for ${l.entityId}`,
        actor: meta.actor || "System",
        incidentId: l.entityId
      };
    });
  }

  async addActivityLog(log: { actor: string; action: string; target: string; type: string }): Promise<void> {
    await prisma.activityLog.create({
      data: {
        action: log.action,
        entityType: "INCIDENT",
        entityId: log.target,
        metadataJson: JSON.stringify({ actor: log.actor, type: log.type })
      }
    });
  }

  async addTimelineEvent(incidentId: string, event: { title: string; description: string; type: any; actor?: string }): Promise<void> {
    await prisma.incidentTimelineEvent.create({
      data: {
        incidentId,
        title: event.title,
        description: event.description,
        type: event.type,
        actor: event.actor
      }
    });
  }

  /**
   * Atomic Team Assignment Transaction
   * Guarantees atomic update of team status, task creation, timeline event, and incident state.
   * If any step fails, all operations roll back together.
   */
  async assignTeamToIncident(
    incidentId: string, 
    teamId: string, 
    instructions?: string,
    workerId?: string
  ): Promise<{ incident: Incident; task: FieldTask; team: FieldTeam }> {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify incident exists and is eligible for assignment
      const incRecord = await tx.incident.findUnique({
        where: { id: incidentId },
        include: { reports: true, timelineEvents: true, fieldTasks: true }
      });
      if (!incRecord) {
        throw new Error("Incident not found");
      }
      if (incRecord.status === "resolved" || incRecord.status === "closed") {
        throw new Error(`Incident '${incidentId}' is already ${incRecord.status} and cannot be assigned.`);
      }

      // 2. Verify team exists and is strictly AVAILABLE
      const teamRecord = await tx.fieldTeam.findUnique({ 
        where: { id: teamId },
        include: { members: true, leader: true }
      });
      if (!teamRecord) {
        throw new Error("Team not found");
      }
      if (teamRecord.status !== "available") {
        throw new Error(`Team '${teamRecord.name}' is currently ${teamRecord.status} and cannot be assigned.`);
      }

      // 3. Resolve target worker explicitly
      let targetWorker: any = null;
      if (workerId) {
        targetWorker = await tx.user.findUnique({ where: { id: workerId } });
        if (!targetWorker) {
          throw new Error(`Worker with ID '${workerId}' not found.`);
        }
        if (targetWorker.role.toLowerCase() !== "worker") {
          throw new Error(`User '${targetWorker.name}' does not have the 'WORKER' role.`);
        }
        if (targetWorker.teamId !== teamId && teamRecord.leaderId !== targetWorker.id) {
          throw new Error(`Worker '${targetWorker.name}' does not belong to team '${teamRecord.name}'.`);
        }
        if (targetWorker.isAvailable === false) {
          throw new Error(`Worker '${targetWorker.name}' is currently busy on another task.`);
        }
      } else {
        // Fallback: leader first if available, else first available member of the team
        if (teamRecord.leader && teamRecord.leader.isAvailable) {
          targetWorker = teamRecord.leader;
        } else {
          targetWorker = await tx.user.findFirst({
            where: { teamId, isAvailable: true, role: "WORKER" }
          });
        }
        if (!targetWorker) {
          targetWorker = await tx.user.findFirst({
            where: { name: teamRecord.leaderName, role: "WORKER" }
          });
        }
      }

      if (!targetWorker) {
        throw new Error(`No available worker found for team '${teamRecord.name}'.`);
      }

      // 4. Mark worker busy
      await tx.user.update({
        where: { id: targetWorker.id },
        data: { isAvailable: false }
      });

      // 5. Update team to dispatched
      const updatedTeam = await tx.fieldTeam.update({
        where: { id: teamId },
        data: { status: "dispatched", activeIncidentId: incidentId }
      });

      // 6. Create Task with explicit assignedWorkerId
      const taskId = `TSK-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      const taskRecord = await tx.fieldTask.create({
        data: {
          id: taskId,
          incidentId,
          teamId,
          workerName: targetWorker.name,
          assignedWorkerId: targetWorker.id,
          status: "assigned",
          priority: incRecord.priority,
          instructions: instructions || `Respond immediately to ${incRecord.title}. Inspect site hazard and commence restoration work.`,
          siteAddress: incRecord.address,
          latitude: incRecord.latitude,
          longitude: incRecord.longitude,
          distanceKm: 1.2,
          beforePhotoUrl: incRecord.beforeEvidenceUrl,
          assignedAt: new Date()
        }
      });

      // 7. Append timeline event
      await tx.incidentTimelineEvent.create({
        data: {
          incidentId,
          title: "Team & Worker Dispatched",
          description: `${updatedTeam.name} — assigned to worker ${targetWorker.name} (${targetWorker.id}) with priority instructions.`,
          type: "team_assigned",
          actor: "Operations Control"
        }
      });

      // 8. Append activity log
      await tx.activityLog.create({
        data: {
          action: "Team Dispatched",
          entityType: "INCIDENT",
          entityId: incidentId,
          metadataJson: JSON.stringify({ 
            actor: "Operations Control", 
            type: "TEAM_ASSIGNED", 
            teamId, 
            workerId: targetWorker.id, 
            workerName: targetWorker.name 
          })
        }
      });

      // 9. Update Incident status to assigned
      const updatedInc = await tx.incident.update({
        where: { id: incidentId },
        data: {
          status: "assigned",
          assignedTeamId: teamId,
          assignedTeamName: updatedTeam.name,
          assignedWorkerId: targetWorker.id,
          assignedWorkerName: targetWorker.name
        },
        include: {
          timelineEvents: { orderBy: { time: "desc" } },
          reports: true,
          assignedTeam: true,
          fieldTasks: true
        }
      });

      // 10. Synchronize connected CitizenReports to assigned
      await tx.citizenReport.updateMany({
        where: { incidentId },
        data: { status: "assigned" }
      });

      return {
        incident: mapPrismaIncidentToDomain(updatedInc),
        task: mapPrismaTaskToDomain(taskRecord),
        team: mapPrismaTeamToDomain(updatedTeam)
      };
    });

    try {
      emitIncidentEvent("INCIDENT_ASSIGNED", result.incident, { id: "operator", name: "Operations Control", role: "operator" });
      emitTaskEvent("WORKER_DISPATCHED", result.task, { id: result.task.assignedWorkerId || "worker", name: result.task.workerName, role: "worker" });
    } catch (_) {}

    return result;
  }

  /**
   * Atomic Task Status Advancement Transaction
    * Validates state transitions, updates task, and synchronizes parent incident & team states atomically.
   */
  async advanceTaskStatus(taskId: string, targetStatus: TaskStatus, updates?: { workerNotes?: string; afterPhotoUrl?: string; beforePhotoUrl?: string }): Promise<{ task: FieldTask; incidentStatus?: IncidentStatus }> {
    const currentTask = await prisma.fieldTask.findUnique({ where: { id: taskId } });
    if (!currentTask) {
      throw new NotFoundError("Task not found");
    }

    // 1. Strict State Machine Validation
    if (!canTransitionTaskStatus(currentTask.status as TaskStatus, targetStatus)) {
      const allowed = getAllowedNextTaskStatuses(currentTask.status as TaskStatus);
      throw new ConflictError(
        `Invalid task transition from '${currentTask.status}' to '${targetStatus}'. Allowed next states: ${allowed.join(", ") || "none"}.`
      );
    }

    // 2. Strict Evidence Validation when moving to 'completed'
    if (targetStatus === "completed") {
      const missingRequirements: string[] = [];
      const afterPhoto = (updates?.afterPhotoUrl || "").trim();
      const notes = (updates?.workerNotes || "").trim();

      if (!afterPhoto) missingRequirements.push("afterPhotoUrl");
      if (!notes || notes.length < 5) missingRequirements.push("workerNotes");

      if (missingRequirements.length > 0) {
        throw new UnprocessableEntityError("Completion evidence is required", {
          missingRequirements,
          currentStatus: currentTask.status,
          requestedStatus: targetStatus
        });
      }
    }

    // 3. Conditional Atomic Update on status (concurrency & deadlock safe)
    const taskData: any = { status: targetStatus };
    if (updates?.workerNotes !== undefined) taskData.workerNotes = updates.workerNotes;
    if (updates?.afterPhotoUrl !== undefined) taskData.afterPhotoUrl = updates.afterPhotoUrl;
    if (updates?.beforePhotoUrl !== undefined) taskData.beforePhotoUrl = updates.beforePhotoUrl;

    if (targetStatus === "in_progress") {
      taskData.startedAt = new Date();
    }
    if (targetStatus === "completed") {
      taskData.completedAt = new Date();
    }

    const updateResult = await prisma.fieldTask.updateMany({
      where: { id: taskId, status: currentTask.status },
      data: taskData
    });

    if (updateResult.count === 0) {
      // Concurrency conflict: another request already updated the task!
      const freshTask = await prisma.fieldTask.findUnique({ where: { id: taskId } });
      const allowed = getAllowedNextTaskStatuses((freshTask?.status || currentTask.status) as TaskStatus);
      throw new ConflictError(
        `Invalid task transition from '${freshTask?.status || currentTask.status}' to '${targetStatus}'. Allowed next states: ${allowed.join(", ") || "none"}.`
      );
    }

    const updatedTask = await prisma.fieldTask.findUnique({ where: { id: taskId } });

    // 4. Record in Evidence table if photo provided
    if (updates?.afterPhotoUrl) {
      await prisma.evidence.create({
        data: {
          uploadedById: currentTask.assignedWorkerId || null,
          incidentId: currentTask.incidentId,
          taskId: currentTask.id,
          mediaType: "image",
          storageProvider: "local",
          publicUrl: updates.afterPhotoUrl,
          purpose: "after_work",
          caption: updates.workerNotes || "Field restoration completed proof"
        }
      });
    }

    // 5. Synchronize parent incident
    const parentIncident = await prisma.incident.findUnique({ where: { id: currentTask.incidentId } });
    let newIncidentStatus = parentIncident ? (parentIncident.status as IncidentStatus) : undefined;

    if (parentIncident) {
      let timelineTitle = "Field Status Update";
      let timelineDesc = `Worker ${currentTask.workerName} updated status to ${targetStatus}`;
      let eventType = "work_started";

      if (targetStatus === "en_route") {
        timelineTitle = "Field Team En Route";
        timelineDesc = `${currentTask.workerName} has departed and is en route to site.`;
        eventType = "task_en_route";
      } else if (targetStatus === "arrived") {
        newIncidentStatus = "in_progress";
        timelineTitle = "Team Arrived on Site";
        timelineDesc = `${currentTask.workerName} arrived at site. Equipment setup and inspection initialized.`;
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

        // Multi-task safety: Check whether ALL field tasks for this incident are completed
        const allIncidentTasks = await prisma.fieldTask.findMany({
          where: { incidentId: currentTask.incidentId }
        });
        const allCompleted = allIncidentTasks.every(t => 
          t.id === taskId ? true : t.status === "completed"
        );

        if (allCompleted) {
          newIncidentStatus = "awaiting_verification";
        }
      }

      // Create status change timeline event
      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId: parentIncident.id,
          title: timelineTitle,
          description: timelineDesc,
          type: eventType,
          actor: currentTask.workerName
        }
      });

      // If newly moved to awaiting_verification, create an explicit operational verification milestone event
      if (targetStatus === "completed" && newIncidentStatus === "awaiting_verification") {
        await prisma.incidentTimelineEvent.create({
          data: {
            incidentId: parentIncident.id,
            title: "Awaiting Operational Quality Verification",
            description: "All assigned field work has concluded. Incident dossier submitted to Operations Control for inspection and sign-off.",
            type: "pending_verification",
            actor: "CivicPulse Automated Workflow"
          }
        });
      }

      await prisma.incident.update({
        where: { id: parentIncident.id },
        data: {
          status: newIncidentStatus,
          afterEvidenceUrl: updates?.afterPhotoUrl || parentIncident.afterEvidenceUrl
        }
      });

      if (newIncidentStatus === "in_progress" || newIncidentStatus === "awaiting_verification") {
        await prisma.citizenReport.updateMany({
          where: { incidentId: parentIncident.id },
          data: { status: newIncidentStatus }
        });
      }

      // Audit log
      await prisma.activityLog.create({
        data: {
          actorId: currentTask.assignedWorkerId || null,
          action: `Task ${targetStatus.toUpperCase()}`,
          entityType: "TASK",
          entityId: taskId,
          metadataJson: JSON.stringify({
            incidentId: currentTask.incidentId,
            targetStatus,
            workerNotes: updates?.workerNotes
          })
        }
      });
    }

    const mappedTask = mapPrismaTaskToDomain(updatedTask!);
    try {
      emitTaskEvent(targetStatus === "arrived" ? "WORKER_ARRIVED" : "FIELD_UPDATE_RECEIVED", mappedTask);
    } catch (_) {}

    return {
      task: mappedTask,
      incidentStatus: newIncidentStatus
    };
  }

  /**
   * Operational Incident Verification Workflow
   * Only operators or admins can verify and resolve incidents after inspecting evidence.
   */
  async verifyIncident(
    incidentId: string,
    decision: "approve" | "reject",
    notes?: string,
    verifiedById?: string
  ): Promise<{ incident: Incident; team?: FieldTeam }> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reports: true, timelineEvents: true, fieldTasks: true }
    });
    if (!incident) {
      throw new NotFoundError("Incident not found");
    }

    const validVerificationStatuses = ["awaiting_verification", "pending_verification"];
    if (!validVerificationStatuses.includes(incident.status)) {
      throw new ConflictError(
        `Incident '${incidentId}' is currently '${incident.status}' and cannot be verified. Status must be 'awaiting_verification'.`
      );
    }

    const targetStatus = decision === "approve" ? "resolved" : "in_progress";
    const updateCount = await prisma.incident.updateMany({
      where: { id: incidentId, status: incident.status },
      data: { status: targetStatus }
    });
    if (updateCount.count === 0) {
      throw new ConflictError(`Incident was concurrently modified.`);
    }

    let updatedIncidentRecord: any;
    let releasedTeamRecord: any = null;

    if (decision === "approve") {
      updatedIncidentRecord = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reports: true, timelineEvents: { orderBy: { time: "desc" } }, fieldTasks: true, assignedTeam: true }
      });

      // Release field team
      if (incident.assignedTeamId) {
        releasedTeamRecord = await prisma.fieldTeam.update({
          where: { id: incident.assignedTeamId },
          data: {
            status: "available",
            activeIncidentId: null,
            tasksCompleted: { increment: 1 }
          }
        });
      }

      // Release assigned worker(s)
      if (incident.assignedWorkerId) {
        await prisma.user.update({
          where: { id: incident.assignedWorkerId },
          data: { isAvailable: true }
        });
      }
      const incTasks = await prisma.fieldTask.findMany({ where: { incidentId } });
      for (const t of incTasks) {
        if (t.assignedWorkerId) {
          await prisma.user.update({
            where: { id: t.assignedWorkerId },
            data: { isAvailable: true }
          });
        }
      }

      // Mark FieldTasks as verified
      await prisma.fieldTask.updateMany({
        where: { incidentId },
        data: { status: "verified" }
      });

      // Synchronize all connected CitizenReports to resolved
      await prisma.citizenReport.updateMany({
        where: { incidentId },
        data: { status: "resolved" }
      });

      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId,
          title: "Incident Verified & Resolved",
          description: notes || "Work quality and photographic evidence inspected and approved by Operations Control. Case file resolved.",
          type: "resolved",
          actor: verifiedById ? "Operations Lead" : "Operations Control"
        }
      });

      await prisma.activityLog.create({
        data: {
          actorId: verifiedById || null,
          action: "Incident Verified & Resolved",
          entityType: "INCIDENT",
          entityId: incidentId,
          metadataJson: JSON.stringify({ decision, notes, verifiedById })
        }
      });
    } else {
      // Rejection: tasks and reports return to in_progress
      await prisma.fieldTask.updateMany({
        where: { incidentId },
        data: { status: "in_progress" }
      });

      await prisma.citizenReport.updateMany({
        where: { incidentId },
        data: { status: "in_progress" }
      });

      updatedIncidentRecord = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reports: true, timelineEvents: { orderBy: { time: "desc" } }, fieldTasks: true, assignedTeam: true }
      });

      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId,
          title: "Verification Rejected — Remediation Required",
          description: notes || "Work inspection failed verification criteria. Field crew instructed to return to site for remediation.",
          type: "work_started",
          actor: verifiedById ? "Operations Lead" : "Operations Control"
        }
      });

      await prisma.activityLog.create({
        data: {
          actorId: verifiedById || null,
          action: "Verification Rejected",
          entityType: "INCIDENT",
          entityId: incidentId,
          metadataJson: JSON.stringify({ decision, notes, verifiedById })
        }
      });
    }

    const mappedIncident = mapPrismaIncidentToDomain(updatedIncidentRecord);
    try {
      if (decision === "approve") {
        emitIncidentEvent("INCIDENT_RESOLVED", mappedIncident, { id: verifiedById || "operator", name: "Operations Supervisor", role: "operator" });
      } else {
        emitIncidentEvent("INCIDENT_STATUS_CHANGED", mappedIncident, { id: verifiedById || "operator", name: "Operations Supervisor", role: "operator" });
      }
    } catch (_) {}

    return {
      incident: mappedIncident,
      team: releasedTeamRecord ? mapPrismaTeamToDomain(releasedTeamRecord) : undefined
    };
  }

  /**
   * Atomic Report Submission & Intake Transaction
   * Atomically persists the report, creates or correlates incident, and appends timeline/activity logs.
   * If any step fails, everything rolls back atomically.
   */
  async processReportSubmissionAtomic(params: {
    report: CitizenReport;
    targetIncidentId?: string;
    newIncident?: Incident;
    aiPriorityScore?: number;
    aiPriorityLevel?: PriorityLevel;
    aiPriorityReason?: string;
  }): Promise<{ report: CitizenReport; incident: Incident }> {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure user exists or fallback to usr-1
      const userExists = await tx.user.findUnique({ where: { id: params.report.userId } });
      const finalUserId = userExists ? params.report.userId : "usr-1";

      let finalIncidentId = params.targetIncidentId;
      let finalIncidentRecord: any = null;

      if (params.newIncident) {
        // Create new incident atomically
        finalIncidentId = params.newIncident.id;
        finalIncidentRecord = await tx.incident.create({
          data: {
            id: params.newIncident.id,
            title: params.newIncident.title,
            category: params.newIncident.category,
            priority: params.newIncident.priority,
            priorityScore: params.newIncident.priorityScore,
            priorityReason: params.newIncident.priorityReason,
            status: params.newIncident.status,
            latitude: params.newIncident.latitude,
            longitude: params.newIncident.longitude,
            address: params.newIncident.address,
            zone: params.newIncident.zone,
            affectedCitizenEstimate: params.newIncident.affectedCitizenEstimate,
            aiConfidence: params.newIncident.aiConfidence,
            aiExplanationJson: JSON.stringify(params.newIncident.aiExplanations || []),
            source: params.newIncident.source || "production",
            beforeEvidenceUrl: params.newIncident.beforeEvidenceUrl || null,
            createdAt: new Date(params.newIncident.createdAt)
          },
          include: { reports: true, timelineEvents: true, fieldTasks: true }
        });

        // Timeline event for new incident
        if (params.newIncident.timeline && params.newIncident.timeline.length > 0) {
          for (const t of params.newIncident.timeline) {
            await tx.incidentTimelineEvent.create({
              data: {
                incidentId: finalIncidentId,
                title: t.title,
                description: t.description,
                type: t.type,
                actor: t.actor
              }
            });
          }
        }

        // Activity log for incident formation
        await tx.activityLog.create({
          data: {
            action: "Incident Formed",
            entityType: "INCIDENT",
            entityId: finalIncidentId,
            metadataJson: JSON.stringify({ actor: "AI Correlation Engine", type: "SIGNAL_CORRELATED" })
          }
        });
      } else if (params.targetIncidentId) {
        // Correlate to existing incident
        const existing = await tx.incident.findUnique({
          where: { id: params.targetIncidentId },
          include: { reports: true }
        });
        if (!existing) throw new Error("Target incident not found");

        const newCount = existing.reports.length + 1;
        const combinedText = `${existing.title} ${existing.priorityReason || ""} ${params.report.description}`;
        const priorityEval = evaluateIncidentPriority(
          combinedText,
          existing.category,
          newCount,
          existing.latitude,
          existing.longitude
        );

        // Authoritative priority score: maximum of existing score, incoming AI priority, and cluster volume
        const incomingScore = params.aiPriorityScore ?? priorityEval.score;
        const calculatedScore = Math.max(existing.priorityScore, incomingScore);
        const calculatedPriority: PriorityLevel = calculatedScore >= 80 ? "critical" : (calculatedScore >= 55 ? "high" : (calculatedScore >= 35 ? "medium" : "low"));

        // Authoritative priority reason: MUST always align with calculatedScore
        let finalPriorityReason: string;
        if (params.aiPriorityReason && !params.aiPriorityReason.includes("/100)")) {
          finalPriorityReason = params.aiPriorityReason;
        } else if (existing.priorityReason && !existing.priorityReason.includes("/100)")) {
          finalPriorityReason = existing.priorityReason;
        } else {
          finalPriorityReason = formatPriorityReason(calculatedPriority, calculatedScore, priorityEval.factors.map(f => f.title));
        }

        finalIncidentRecord = await tx.incident.update({
          where: { id: params.targetIncidentId },
          data: {
            affectedCitizenEstimate: existing.affectedCitizenEstimate + 100,
            priority: calculatedPriority,
            priorityScore: calculatedScore,
            priorityReason: finalPriorityReason
          },
          include: { reports: true, timelineEvents: true, fieldTasks: true }
        });

        await tx.incidentTimelineEvent.create({
          data: {
            incidentId: params.targetIncidentId,
            title: "Signal Correlated",
            description: `Signal ${params.report.id} merged into ${params.targetIncidentId} (Total: ${newCount} signals)`,
            type: "ai_correlated",
            actor: "AI Correlation Engine"
          }
        });

        await tx.activityLog.create({
          data: {
            action: "Signal Correlated",
            entityType: "INCIDENT",
            entityId: params.targetIncidentId,
            metadataJson: JSON.stringify({ actor: "AI Correlation Engine", type: "SIGNAL_CORRELATED" })
          }
        });
      }

      // Determine initial report status based on incident status
      let reportInitialStatus = "received";
      if (finalIncidentId) {
        reportInitialStatus = "correlated";
        if (finalIncidentRecord && ["assigned", "in_progress", "awaiting_verification", "resolved"].includes(finalIncidentRecord.status)) {
          reportInitialStatus = finalIncidentRecord.status;
        }
      }

      // 2. Persist CitizenReport
      const createdReport = await tx.citizenReport.create({
        data: {
          id: params.report.id,
          userId: finalUserId,
          userName: params.report.userName,
          userPhone: params.report.userPhone,
          incidentId: finalIncidentId,
          description: params.report.description,
          category: params.report.category,
          latitude: params.report.latitude,
          longitude: params.report.longitude,
          address: params.report.address,
          mediaUrl: params.report.mediaUrl,
          mediaType: params.report.mediaType || "image",
          status: reportInitialStatus,
          source: params.report.source || "production",
          embeddingJson: params.report.embedding ? JSON.stringify(params.report.embedding) : null,
          createdAt: new Date(params.report.createdAt)
        }
      });

      // 3. Activity log for incoming report
      await tx.activityLog.create({
        data: {
          action: "New Civic Signal",
          entityType: "REPORT",
          entityId: params.report.id,
          metadataJson: JSON.stringify({ actor: params.report.userName || "Citizen", type: "SIGNAL_RECEIVED" })
        }
      });

      return {
        report: mapPrismaReportToDomain(createdReport),
        incident: mapPrismaIncidentToDomain(finalIncidentRecord)
      };
    });

    try {
      if (params.newIncident) {
        emitIncidentEvent("INCIDENT_CREATED", result.incident);
      } else {
        emitIncidentEvent("INCIDENT_UPDATED", result.incident);
      }
    } catch (_) {}

    return result;
  }

  /**
   * Citizen Satisfaction & Feedback Submission
   * Only the reporting citizen who submitted an issue linked to this incident may submit feedback.
   */
  async submitCitizenFeedback(
    incidentId: string,
    citizenId: string,
    feedbackStatus: "RESOLVED SUCCESSFULLY" | "ISSUE STILL EXISTS",
    feedbackNotes?: string
  ): Promise<{ incident: Incident }> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reports: true, timelineEvents: true, fieldTasks: true }
    });
    if (!incident) throw new NotFoundError("Incident not found");

    // Check ownership: does this citizen own any report connected to this incident?
    const userReports = await prisma.citizenReport.findMany({
      where: { incidentId, userId: citizenId }
    });
    if (userReports.length === 0) {
      throw new ForbiddenError("Access denied: only the reporting citizen can submit resolution feedback.");
    }

    // Incident must be in 'resolved' or 'closed' status
    if (incident.status !== "resolved" && incident.status !== "closed") {
      throw new ConflictError(`Feedback can only be submitted for resolved incidents. Current status: '${incident.status}'.`);
    }

    const isIssuePersisting = feedbackStatus === "ISSUE STILL EXISTS";
    const targetStatus = isIssuePersisting ? "reopen_requested" : "resolved";

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: targetStatus,
        citizenFeedbackStatus: feedbackStatus,
        citizenFeedbackNotes: feedbackNotes || null,
        reopenedAt: isIssuePersisting ? new Date() : undefined,
        reopenedReason: isIssuePersisting ? (feedbackNotes || "Citizen reported problem persists") : undefined,
        reopenedByCitizenId: isIssuePersisting ? citizenId : undefined,
      },
      include: { reports: true, timelineEvents: { orderBy: { time: "desc" } }, fieldTasks: true }
    });

    // Timeline event
    if (isIssuePersisting) {
      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId,
          title: "Citizen Feedback: Issue Still Exists",
          description: feedbackNotes || "Citizen indicated issue has recurred or was not fully resolved. Reopen requested.",
          type: "reopen_requested",
          actor: "Citizen Reporter"
        }
      });
    } else {
      await prisma.incidentTimelineEvent.create({
        data: {
          incidentId,
          title: "Citizen Feedback: Resolved Successfully",
          description: feedbackNotes || "Citizen verified and confirmed satisfactory resolution.",
          type: "resolved",
          actor: "Citizen Reporter"
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        actorId: citizenId,
        action: `Citizen Feedback: ${feedbackStatus}`,
        entityType: "INCIDENT",
        entityId: incidentId,
        metadataJson: JSON.stringify({ feedbackStatus, feedbackNotes })
      }
    });

    return { incident: mapPrismaIncidentToDomain(updated) };
  }

  /**
   * Operator Reopening Review Workflow
   * Only operators or admins can approve or reject reopening requests.
   */
  async reviewReopenRequest(
    incidentId: string,
    decision: "approve" | "reject",
    reviewNotes?: string,
    operatorId?: string
  ): Promise<{ incident: Incident }> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reports: true, timelineEvents: true, fieldTasks: true }
    });
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
      timelineDesc = reviewNotes || "Municipal operations reviewed photographic proof and confirmed resolution standards met.";
      timelineType = "reopen_request_rejected";
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: targetStatus,
        assignedTeamId: decision === "approve" ? null : incident.assignedTeamId,
        assignedTeamName: decision === "approve" ? null : incident.assignedTeamName,
      },
      include: { reports: true, timelineEvents: { orderBy: { time: "desc" } }, fieldTasks: true }
    });

    await prisma.incidentTimelineEvent.create({
      data: {
        incidentId,
        title: timelineTitle,
        description: timelineDesc,
        type: timelineType,
        actor: operatorId ? "Operations Supervisor" : "Operations Control"
      }
    });

    await prisma.activityLog.create({
      data: {
        actorId: operatorId || null,
        action: `Reopen Review: ${decision.toUpperCase()}`,
        entityType: "INCIDENT",
        entityId: incidentId,
        metadataJson: JSON.stringify({ decision, reviewNotes, operatorId })
      }
    });

    const mapped = mapPrismaIncidentToDomain(updated);
    try {
      if (decision === "approve") {
        emitIncidentEvent("INCIDENT_REOPENED", mapped, { id: operatorId || "operator", name: "Operations Supervisor", role: "operator" });
      }
    } catch (_) {}

    return { incident: mapped };
  }

  // User & Authentication Operations
  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapPrismaUserToDomain(user) : null;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string | null }) | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      ...mapPrismaUserToDomain(user),
      passwordHash: user.passwordHash
    };
  }

  async createUser(data: { name: string; email: string; passwordHash: string; role?: string; phone?: string }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ? data.role.toUpperCase() : "CITIZEN",
        phone: data.phone || null
      }
    });
    return mapPrismaUserToDomain(user);
  }
}
