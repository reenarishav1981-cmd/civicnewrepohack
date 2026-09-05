/**
 * CivicPulse Phase 7 — Real-Time Event Types
 * Strictly typed real-time telemetry and operational event contracts.
 */

export type EventSource = "production" | "simulation" | "system";

export type RealtimeEventType =
  | "INCIDENT_CREATED"
  | "INCIDENT_UPDATED"
  | "INCIDENT_ESCALATED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_STATUS_CHANGED"
  | "WORKER_DISPATCHED"
  | "WORKER_ARRIVED"
  | "FIELD_UPDATE_RECEIVED"
  | "AI_CORRELATION_COMPLETED"
  | "AI_PRIORITY_CHANGED"
  | "HOTSPOT_UPDATED"
  | "RISK_LEVEL_CHANGED"
  | "EMERGING_ISSUE_DETECTED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_REOPENED"
  | "CITY_HEALTH_UPDATED"
  | "CRITICAL_ALERT_EMITTED"
  | "DEMO_SIMULATION_EVENT";

export interface EventActor {
  id: string;
  name: string;
  role: "citizen" | "operator" | "worker" | "admin" | "system" | "ai_engine";
}

export interface RealtimeEvent<T = any> {
  eventId: string;
  eventType: RealtimeEventType;
  timestamp: string;
  source: EventSource;
  actor?: EventActor;
  entityId?: string;
  payload: T;
}

export interface CriticalAlertPayload {
  alertId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  reason: string;
  location: string;
  linkedIncidentId?: string;
  recommendedAction: string;
  timestamp: string;
}

export interface AIActivityState {
  engine: "Semantic" | "Geospatial" | "Visual" | "Temporal" | "Category";
  status: "idle" | "processing" | "matched";
  lastProcessedAt?: string;
  currentOperation?: string;
  confidenceScore?: number;
  details?: string;
}
