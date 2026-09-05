/**
 * CivicPulse Phase 7 — In-Memory Demo Simulation Engine
 * Completely isolated from production database tables (Zero DB Pollution).
 * Implements deterministic 30-second "Road Damage Near School" scenario with step-by-step control.
 */

import { realtimeEventBus } from "./eventBus";
import { RealtimeEvent } from "./eventTypes";

export interface DemoStep {
  stepIndex: number;
  timelineSeconds: number;
  stageName: string;
  title: string;
  description: string;
  eventType: string;
  data: {
    incidentId: string;
    reportId?: string;
    title: string;
    category: string;
    status: string;
    priority: string;
    latitude: number;
    longitude: number;
    assignedTeamName?: string;
    workerStatus?: string;
    aiScore?: number;
    aiExplanation?: Record<string, number>;
    evidenceUrl?: string;
  };
}

export const DEMO_SCENARIO_STEPS: DemoStep[] = [
  {
    stepIndex: 0,
    timelineSeconds: 0,
    stageName: "REPORT RECEIVED",
    title: "Citizen Report Submitted",
    description: "Citizen reports severe pavement cavity outside school gate. Coordinates: 21.1703°N, 72.8312°E.",
    eventType: "INCIDENT_CREATED",
    data: {
      incidentId: "DEMO-INC-901",
      reportId: "DEMO-R-401",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "new",
      priority: "high",
      latitude: 21.1703,
      longitude: 72.8312,
    },
  },
  {
    stepIndex: 1,
    timelineSeconds: 2,
    stageName: "AI ANALYSIS",
    title: "Multimodal Analysis Initiated",
    description: "Semantic and geospatial vector engines extract geographic coordinates and damage keywords.",
    eventType: "AI_CORRELATION_COMPLETED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "analyzing",
      priority: "high",
      latitude: 21.1703,
      longitude: 72.8312,
      aiScore: 72,
    },
  },
  {
    stepIndex: 2,
    timelineSeconds: 4,
    stageName: "SPATIAL MATCH",
    title: "Existing Cluster Detected Within 140m",
    description: "Geospatial engine identifies active road defect within 140 meters of St. Xavier High School.",
    eventType: "HOTSPOT_UPDATED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "correlated",
      priority: "high",
      latitude: 21.1703,
      longitude: 72.8312,
      aiScore: 84,
    },
  },
  {
    stepIndex: 3,
    timelineSeconds: 6,
    stageName: "CORRELATION COMPLETE",
    title: "Multimodal Fusion Score: 84%",
    description: "Semantic (0.86), Geospatial (0.94), and Category (1.00) match confirms correlation duplicate.",
    eventType: "AI_CORRELATION_COMPLETED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "correlated",
      priority: "high",
      latitude: 21.1703,
      longitude: 72.8312,
      aiScore: 84,
      aiExplanation: {
        "Geospatial Proximity": 35,
        "Semantic Text Fit": 24,
        "Visual Damage Feature": 15,
        "Category Match": 10,
      },
    },
  },
  {
    stepIndex: 4,
    timelineSeconds: 8,
    stageName: "OPERATOR REVIEW",
    title: "AI Suggests Priority: CRITICAL",
    description: "Predictive engine elevates priority due to active pedestrian flow in high school sensitive buffer.",
    eventType: "AI_PRIORITY_CHANGED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "operator_review",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      aiScore: 84,
    },
  },
  {
    stepIndex: 5,
    timelineSeconds: 10,
    stageName: "OPERATOR CONFIRMED",
    title: "Operator Confirms Priority & Correlation",
    description: "Municipal supervisor affirms AI assessment and authorizes immediate dispatch.",
    eventType: "INCIDENT_STATUS_CHANGED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "approved",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
    },
  },
  {
    stepIndex: 6,
    timelineSeconds: 12,
    stageName: "TEAM DISPATCH",
    title: "Team Gamma Dispatched",
    description: "Rapid Road Maintenance Squad Gamma assigned. Leader: Manoj Verma (1.2 km away).",
    eventType: "INCIDENT_ASSIGNED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "assigned",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      assignedTeamName: "Road Squad Gamma",
      workerStatus: "assigned",
    },
  },
  {
    stepIndex: 7,
    timelineSeconds: 15,
    stageName: "WORKER EN ROUTE",
    title: "Worker In Transit",
    description: "Field squad en route via Ring Road corridor. Estimated arrival: 5 minutes.",
    eventType: "WORKER_DISPATCHED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "assigned",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      assignedTeamName: "Road Squad Gamma",
      workerStatus: "en_route",
    },
  },
  {
    stepIndex: 8,
    timelineSeconds: 20,
    stageName: "WORKER ARRIVED",
    title: "Field Crew Arrived on Site",
    description: "GPS verification confirms crew arrival at St. Xavier Gate 2. Safety perimeter established.",
    eventType: "WORKER_ARRIVED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "in_progress",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      assignedTeamName: "Road Squad Gamma",
      workerStatus: "arrived",
    },
  },
  {
    stepIndex: 9,
    timelineSeconds: 25,
    stageName: "EVIDENCE UPLOADED",
    title: "Cold-Mix Remediation Completed",
    description: "High-grade asphalt patch compacted. After-photo evidence submitted for verification.",
    eventType: "FIELD_UPDATE_RECEIVED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "awaiting_verification",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      assignedTeamName: "Road Squad Gamma",
      workerStatus: "completed",
      evidenceUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop",
    },
  },
  {
    stepIndex: 10,
    timelineSeconds: 30,
    stageName: "INCIDENT RESOLVED",
    title: "Operator Supervisory Resolution Verified",
    description: "Photographic inspection approved. Incident officially closed, Team Gamma released to available pool.",
    eventType: "INCIDENT_RESOLVED",
    data: {
      incidentId: "DEMO-INC-901",
      title: "Deep Pothole Outside St. Xavier High School",
      category: "Road Hazard",
      status: "resolved",
      priority: "critical",
      latitude: 21.1703,
      longitude: 72.8312,
      assignedTeamName: "Road Squad Gamma",
      workerStatus: "verified",
      evidenceUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop",
    },
  },
];

export class DemoSimulationEngine {
  private currentStepIndex: number = 0;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  public start(onStep?: (step: DemoStep) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.runLoop(onStep);
  }

  private runLoop(onStep?: (step: DemoStep) => void): void {
    if (!this.isRunning) return;

    if (this.currentStepIndex >= DEMO_SCENARIO_STEPS.length) {
      this.isRunning = false;
      return;
    }

    const step = DEMO_SCENARIO_STEPS[this.currentStepIndex];
    this.broadcastStep(step);
    if (onStep) onStep(step);

    this.currentStepIndex++;

    if (this.currentStepIndex < DEMO_SCENARIO_STEPS.length) {
      // Advance every ~2.8 seconds in automatic play mode to fit a concise live demonstration
      this.timer = setTimeout(() => {
        this.runLoop(onStep);
      }, 2800);
    } else {
      this.isRunning = false;
    }
  }

  public pause(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public stepForward(onStep?: (step: DemoStep) => void): DemoStep | null {
    this.pause();
    if (this.currentStepIndex >= DEMO_SCENARIO_STEPS.length) {
      return null;
    }

    const step = DEMO_SCENARIO_STEPS[this.currentStepIndex];
    this.broadcastStep(step);
    if (onStep) onStep(step);

    this.currentStepIndex++;
    return step;
  }

  public reset(): DemoStep {
    this.pause();
    this.currentStepIndex = 0;
    const initialStep = DEMO_SCENARIO_STEPS[0];
    this.broadcastStep(initialStep);
    return initialStep;
  }

  public getCurrentStep(): DemoStep {
    const idx = Math.min(this.currentStepIndex, DEMO_SCENARIO_STEPS.length - 1);
    return DEMO_SCENARIO_STEPS[Math.max(0, idx)];
  }

  public getStatus(): { isRunning: boolean; stepIndex: number; totalSteps: number } {
    return {
      isRunning: this.isRunning,
      stepIndex: this.currentStepIndex,
      totalSteps: DEMO_SCENARIO_STEPS.length,
    };
  }

  private broadcastStep(step: DemoStep): void {
    const event: RealtimeEvent = {
      eventId: `DEMO-EVT-${step.stepIndex}-${Date.now()}`,
      eventType: "DEMO_SIMULATION_EVENT",
      timestamp: new Date().toISOString(),
      source: "simulation",
      actor: { id: "demo-simulator", name: "Demo Simulation Orchestrator", role: "system" },
      entityId: step.data.incidentId,
      payload: {
        stepIndex: step.stepIndex,
        totalSteps: DEMO_SCENARIO_STEPS.length,
        timelineSeconds: step.timelineSeconds,
        stageName: step.stageName,
        title: step.title,
        description: step.description,
        isSimulation: true,
        incident: step.data,
      },
    };

    realtimeEventBus.publish(event);
  }
}

// Preserve simulation engine across dev hot-reloads
const globalForDemo = global as unknown as {
  demoSimulationEngineInstance?: DemoSimulationEngine;
};

export const demoSimulationEngine =
  globalForDemo.demoSimulationEngineInstance ?? new DemoSimulationEngine();

if (process.env.NODE_ENV !== "production") {
  globalForDemo.demoSimulationEngineInstance = demoSimulationEngine;
}
