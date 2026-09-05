/**
 * CivicPulse Phase 7 — Real-Time Service
 * High-level orchestration for emitting, tracking, and generating operational events.
 */

import { realtimeEventBus } from "./eventBus";
import { 
  RealtimeEvent, 
  RealtimeEventType, 
  EventSource, 
  EventActor, 
  CriticalAlertPayload,
  AIActivityState 
} from "./eventTypes";
import { Incident, FieldTask } from "@/types";

function generateEventId(prefix: string = "EVT"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Publishes an incident lifecycle or status mutation event
 */
export function emitIncidentEvent(
  eventType: RealtimeEventType,
  incident: Partial<Incident> & { id: string },
  actor?: EventActor,
  source: EventSource = "production"
): RealtimeEvent {
  const event: RealtimeEvent = {
    eventId: generateEventId("INC"),
    eventType,
    timestamp: new Date().toISOString(),
    source,
    actor: actor || { id: "system", name: "CivicPulse Core", role: "system" },
    entityId: incident.id,
    payload: {
      incidentId: incident.id,
      title: incident.title,
      category: incident.category,
      status: incident.status,
      priority: incident.priority,
      priorityScore: incident.priorityScore,
      latitude: incident.latitude,
      longitude: incident.longitude,
      assignedTeamId: incident.assignedTeamId,
      assignedTeamName: incident.assignedTeamName,
      affectedCitizenEstimate: incident.affectedCitizenEstimate,
    },
  };

  realtimeEventBus.publish(event);
  return event;
}

/**
 * Publishes a field task progression event
 */
export function emitTaskEvent(
  eventType: RealtimeEventType,
  task: Partial<FieldTask> & { id: string; incidentId: string },
  actor?: EventActor,
  source: EventSource = "production"
): RealtimeEvent {
  const event: RealtimeEvent = {
    eventId: generateEventId("TSK"),
    eventType,
    timestamp: new Date().toISOString(),
    source,
    actor: actor || { id: "worker", name: task.workerName || "Field Crew", role: "worker" },
    entityId: task.id,
    payload: {
      taskId: task.id,
      incidentId: task.incidentId,
      status: task.status,
      workerName: task.workerName,
      siteAddress: task.siteAddress,
      beforePhotoUrl: task.beforePhotoUrl,
      afterPhotoUrl: task.afterPhotoUrl,
    },
  };

  realtimeEventBus.publish(event);
  return event;
}

/**
 * Publishes an explainable AI activity heartbeat or match result
 */
export function emitAIActivityEvent(
  engine: "Semantic" | "Geospatial" | "Visual" | "Temporal" | "Category",
  status: "idle" | "processing" | "matched",
  confidenceScore?: number,
  details?: string,
  source: EventSource = "production"
): RealtimeEvent<AIActivityState> {
  const event: RealtimeEvent<AIActivityState> = {
    eventId: generateEventId("AI"),
    eventType: "AI_CORRELATION_COMPLETED",
    timestamp: new Date().toISOString(),
    source,
    actor: { id: `ai-${engine.toLowerCase()}`, name: `${engine} Engine`, role: "ai_engine" },
    payload: {
      engine,
      status,
      lastProcessedAt: new Date().toISOString(),
      confidenceScore,
      details,
    },
  };

  realtimeEventBus.publish(event);
  return event;
}

/**
 * Publishes a high-priority operational alert
 */
export function emitCriticalAlert(
  alert: Omit<CriticalAlertPayload, "alertId" | "timestamp">,
  source: EventSource = "production"
): RealtimeEvent<CriticalAlertPayload> {
  const alertId = generateEventId("ALT");
  const payload: CriticalAlertPayload = {
    ...alert,
    alertId,
    timestamp: new Date().toISOString(),
  };

  const event: RealtimeEvent<CriticalAlertPayload> = {
    eventId: generateEventId("ALRT"),
    eventType: "CRITICAL_ALERT_EMITTED",
    timestamp: payload.timestamp,
    source,
    actor: { id: "system-monitor", name: "City Risk Sentinel", role: "system" },
    entityId: alert.linkedIncidentId,
    payload,
  };

  realtimeEventBus.publish(event);
  return event;
}

/**
 * Derives active critical alerts from real live operational state
 */
export function deriveOperationalAlerts(
  incidents: Incident[],
  hotspots: Array<{ id: string; dominantCategory: string; hotspotRiskScore: number }> = [],
  emerging: Array<{ category: string; increasePercent: number; severity: string }> = []
): CriticalAlertPayload[] {
  const alerts: CriticalAlertPayload[] = [];
  const now = Date.now();

  // 1. Critical Priority Incidents
  incidents.forEach((inc) => {
    if (inc.status !== "resolved" && inc.status !== "closed") {
      if (inc.priority === "critical" || (inc.priorityScore && inc.priorityScore >= 80)) {
        alerts.push({
          alertId: `ALT-CRIT-${inc.id}`,
          severity: "CRITICAL",
          title: `Critical Incident: ${inc.category}`,
          reason: `${inc.title} has reached critical priority score (${inc.priorityScore}/100). Immediate dispatch mandated.`,
          location: inc.address || inc.zone || "Central Sector",
          linkedIncidentId: inc.id,
          recommendedAction: "Dispatch nearest available emergency field squad.",
          timestamp: inc.createdAt,
        });
      }

      // Reopened incident alert
      if (inc.reopenedAt || inc.reopenedReason) {
        alerts.push({
          alertId: `ALT-REOPEN-${inc.id}`,
          severity: "HIGH",
          title: `Resolution Failure: ${inc.id}`,
          reason: `Citizen reported persistence after repair: "${inc.reopenedReason || "Issue still exists"}"`,
          location: inc.address || inc.zone || "Central Sector",
          linkedIncidentId: inc.id,
          recommendedAction: "Schedule supervisory on-ground inspection and technical overhaul.",
          timestamp: inc.reopenedAt || inc.updatedAt,
        });
      }
    }
  });

  // 2. Critical Hotspots
  hotspots.forEach((h) => {
    if (h.hotspotRiskScore >= 75) {
      alerts.push({
        alertId: `ALT-HOTSPOT-${h.id}`,
        severity: "CRITICAL",
        title: `Spatial Risk Hotspot: ${h.dominantCategory}`,
        reason: `Geographic cluster ${h.id} exhibits severe incident density and ${h.hotspotRiskScore}/100 composite risk.`,
        location: h.id,
        recommendedAction: "Establish proactive municipal patrol zone and drain/road inspection.",
        timestamp: new Date(now).toISOString(),
      });
    }
  });

  // 3. Emerging Surges
  emerging.forEach((em) => {
    if (em.severity === "critical" || em.severity === "escalating") {
      alerts.push({
        alertId: `ALT-SURGE-${em.category}`,
        severity: em.severity === "critical" ? "CRITICAL" : "HIGH",
        title: `Emerging Surge: ${em.category}`,
        reason: `${em.category} reports spiked by +${em.increasePercent}% above rolling baseline.`,
        location: "Citywide Cluster",
        recommendedAction: "Alert respective department head to scale standby maintenance capacity.",
        timestamp: new Date(now).toISOString(),
      });
    }
  });

  return alerts.slice(0, 8);
}
