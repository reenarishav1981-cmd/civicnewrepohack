# Phase 8 Architecture Audit & Implementation Plan — Executive Decision & Impact Intelligence

## Executive Architectural Summary
Phase 8 introduces **Executive Decision & Impact Intelligence** to CivicPulse, transforming operational and predictive data into actionable, explainable decision recommendations for senior municipal leadership (Municipal Commissioners, Department Heads, and Disaster/Operations Directors).

The core objective answers a singular question:
> **"What should a senior municipal decision-maker do next?"**

The system does not replace human judgment or autonomously deploy teams; rather, it computes operational pressure, evaluates multi-department performance, projects 48-hour counterfactual trajectories ("What happens if we do nothing?"), and presents human-in-the-loop decision recommendations with complete mathematical explainability.

---

## 1. Complete Phase 1–7 Architecture Audit

### A. Existing Codebase Inspection
- **Phase 1 (Auth & RBAC)**: Strict role guards (`citizen`, `operator`, `worker`, `admin`) via `civicpulse_session` cookies, PBKDF2/bcrypt hashing, immutable user IDs, zero privilege escalation.
- **Phase 2 (Ops Dispatch)**: Atomic team assignments, worker task isolation (`myTasks=true`), duplicate dispatch rejection (HTTP 409).
- **Phase 3 (Field Progression & Verification)**: Strict worker transitions (`assigned` → `en_route` → `arrived` → `in_progress` → `completed`), mandatory before/after photo evidence (HTTP 422 if missing), atomic verification gate (`awaiting_verification` → `resolved`), team lock retention.
- **Phase 4 (Citizen Tracking & Reopening)**: Public tracking via token/ID without internal data leakage, citizen reopen requests, supervisor review audit events.
- **Phase 5 (Multimodal Correlation)**: 5 deterministic intelligence engines (Semantic, Geospatial, Visual, Temporal, Category) computing explainable weighted similarity (0 - 100).
- **Phase 6 (Predictive Intelligence & City Health)**: Haversine hotspot detection (400m), chronic failure classification (`CHRONIC`, `HIGH`, `MODERATE`, `LOW`), emerging issue detector with false-positive suppression, City Health Score formula, and `AIDecisionFeedback` telemetry logging.
- **Phase 7 (Real-Time Command Center & Demonstration Intelligence)**:
  - `src/lib/realtime/`: `eventBus.ts` (EventEmitter, 200 FIFO ring buffer), `eventTypes.ts`, `realtimeService.ts`, `demoSimulationEngine.ts`.
  - SSE Streaming (`GET /api/realtime/stream`) with automatic keep-alive heartbeats and cleanup on abort.
  - Delta polling fallback (`GET /api/realtime/events?since=<timestamp>`).
  - `/operations/live`: Real-time map, animated event stream, live AI monitors, lifecycle pipeline, and SIH presentation guide.

### B. Existing Data Model & Geographic Structure
1. **Prisma Models Available**:
   - `User`: `role` (`CITIZEN`, `OPERATOR`, `WORKER`, `ADMIN`)
   - `CitizenReport`: `category`, `latitude`, `longitude`, `address`, `status`, `createdAt`
   - `Incident`: `category`, `priority`, `priorityScore`, `status`, `latitude`, `longitude`, `address`, `zone`, `affectedCitizenEstimate`, `assignedTeamId`, `assignedTeamName`, `reopenedAt`, `createdAt`, `updatedAt`
   - `FieldTeam`: `department`, `name`, `leaderName`, `specialization`, `status` (`available`, `dispatched`, `busy`, `off_duty`), `tasksCompleted`
   - `FieldTask`: `status`, `assignedAt`, `startedAt`, `completedAt`, `assignedWorkerId`
   - `IncidentTimelineEvent` & `ActivityLog`: Comprehensive timestamped logs
   - `AIDecisionFeedback`: Operator accept/override logs
2. **Geographic Structure**:
   - Incidents possess `zone` strings (e.g. `"Central Zone"`, `"Varachha"`, `"Rander"`, `"Katargam"`, `"Athwa"`, `"Udhna"`, `"Limbayat"`), precise `latitude`/`longitude` GPS coordinates, and `address`.
   - **Zero Fake Ward Construction**: We will not pretend administrative ward IDs exist if not in the database; instead, we build an extensible `AreaPerformanceProfile` that dynamically groups by geographic `zone` and spatial density clusters.
3. **Department Mapping**:
   - `Incident.category` maps cleanly to municipal departments:
     - `Road Hazard` → **Public Works / Road Infrastructure**
     - `Water Leakage` → **Water Supply & Sewerage Department**
     - `Sanitation / Garbage` → **Public Health & Solid Waste Management**
     - `Streetlight / Electrical` → **Electrical & Energy Department**
     - `Public Safety / Tree Fall` → **Disaster Management & Emergency Response**

---

## 2. Phase 8 Decision Intelligence Layer Architecture

We will implement `src/lib/executive/`:
```
src/lib/executive/
├── executiveTypes.ts               # Domain types, profiles, recommendations, impact models
├── departmentPerformanceEngine.ts   # SLA compliance, resolution velocity, backlog by department
├── areaPerformanceEngine.ts         # Geographic density, recurrence, hotspot pressure by zone
├── resourcePressureEngine.ts        # Deterministic 0-100 operational pressure formula with factor attribution
├── decisionRecommendationEngine.ts # Rule-based actionable executive recommendations
├── impactProjectionEngine.ts       # 48h counterfactual trajectory ("What happens if we do nothing?")
├── executiveExplanationEngine.ts    # Mathematical factor contribution decomposition
├── executiveIntelligenceService.ts # Central aggregator -> ExecutiveIntelligenceSnapshot
└── index.ts                        # Central barrel export
```

---

## 3. Detailed Engine Specifications

### Engine 1: Department Performance Intelligence (`departmentPerformanceEngine.ts`)
Calculates operational metrics across real categories and field departments:
- `totalIncidents`: Total volume recorded in time window.
- `activeIncidents`: Open, in-progress, or awaiting verification cases.
- `resolvedIncidents`: Successfully completed cases.
- `resolutionRate`: Resolved / Total (clamped 0.0 - 1.0).
- `averageResolutionHours`: Mean time from `createdAt` to `completedAt`/`updatedAt` for resolved cases.
- `slaComplianceRate`: Percentage of resolved incidents where resolution duration was within municipal SLA:
  - Road Hazard: 48 hours
  - Water Leakage: 24 hours
  - Sanitation: 24 hours
  - Streetlight: 36 hours
  - Other: 48 hours
- `slaBreachRate`: 1.0 - slaComplianceRate.
- `reopenRate`: Reopened / Resolved.
- `incidentVelocity`: Rolling 24h intake rate.
- `activeBacklog`: Total unaddressed work orders.
- `criticalIncidentCount`: Incidents with priority `critical` or score >= 75.
- `status`:
  - `CRITICAL`: SLA breach > 40% OR Active Backlog > 15 OR Critical Count >= 3
  - `NEEDS_ATTENTION`: SLA breach > 25% OR Reopen Rate > 15%
  - `STABLE`: SLA breach <= 25% AND Resolution Rate >= 70%
  - `HEALTHY`: Resolution Rate >= 85% AND SLA breach < 15%

### Engine 2: Area Performance Intelligence (`areaPerformanceEngine.ts`)
Aggregates incidents and teams across municipal geographic zones:
- `incidentDensity`: Incidents per relative zone volume.
- `incidentVelocity`: 24h incident surge compared to 7-day moving baseline.
- `hotspotConcentration`: Number of active spatial hotspots intersecting the zone.
- `chronicRecurrenceCount`: Sites classified as `HIGH` or `CHRONIC` failure tiers.
- `activeBacklog`: Backlog count in zone.
- `slaPerformance`: On-time resolution rate in zone.
- `criticalIncidentPressure`: Count of critical incidents in zone.
- `status`: `STABLE` | `WATCH` | `HIGH_PRESSURE` | `CRITICAL`.
- Returns an `AreaPerformanceProfile` and supports opening an **Area Dossier**.

### Engine 3: Resource Pressure Engine (`resourcePressureEngine.ts`)
A deterministic 0 - 100 operational pressure score:
PressureScore = 100 * (0.25 * P_backlog + 0.20 * P_velocity + 0.20 * P_sla + 0.15 * P_utilization + 0.10 * P_critical + 0.10 * P_recurrence)
Where:
- P_backlog = min(1.0, ActiveBacklog / 20)
- P_velocity = min(1.0, Velocity24h / 10)
- P_sla = SLABreachRate
- P_utilization = DispatchedTeams / max(1, TotalTeams)
- P_critical = min(1.0, CriticalCount / 5)
- P_recurrence = min(1.0, ChronicSites / 4)

**Factor Explanation**: Returns decomposed points:
```ts
factors: [
  { factor: "ACTIVE_BACKLOG", contribution: Math.round(25 * P_backlog), description: "Active backlog vs capacity" },
  { factor: "SLA_BREACH", contribution: Math.round(20 * P_sla), description: "Rate of SLA compliance failures" },
  ...
]
```
Level: `LOW` (< 30), `MODERATE` (30 - 59), `HIGH` (60 - 79), `CRITICAL` (>= 80).

### Engine 4: Decision Recommendation Engine (`decisionRecommendationEngine.ts`)
Generates structured, non-autonomous recommendations:
- Action Types:
  1. `DEPLOY_ADDITIONAL_TEAM`: When backlog and team utilization > 80%.
  2. `PRIORITIZE_CRITICAL_CLUSTER`: When critical incident pressure in a hotspot exceeds threshold.
  3. `ESCALATE_DEPARTMENT_REVIEW`: When SLA breach rate > 35% or reopen rate > 15%.
  4. `MONITOR_EMERGING_PATTERN`: When surge detector identifies > 50% spike.
  5. `REBALANCE_OPERATIONAL_LOAD`: When one zone is overwhelmed while adjacent teams are idle.
- Contract:
  ```ts
  export interface DecisionRecommendation {
    id: string;
    actionType: RecommendationActionType;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    targetArea: string;
    department: string;
    title: string;
    reason: string;
    evidence: {
      activeBacklog: number;
      velocityIncreasePercent: number;
      slaBreachRate: number;
      criticalCount: number;
      chronicSitesCount?: number;
    };
    expectedImpact: string;
    confidence: number; // 0.0 - 1.0 based on data volume
    humanApprovalRequired: true; // Strictly immutable true
    status: "PENDING" | "ACCEPTED" | "DISMISSED" | "DEFERRED";
    createdAt: string;
  }
  ```
- **Absolute Guard**: `humanApprovalRequired` is strictly hardcoded to `true`.

### Engine 5: Impact Projection Engine (`impactProjectionEngine.ts`)
Deterministic scenario projections comparing:
1. `CURRENT_TRAJECTORY` ("What happens if we do nothing?"):
   Backlog_48h = CurrentBacklog + 2 * (ArrivalRate_24h - ThroughputRate_24h)
   SLARisk_48h = CurrentBreaches + floor(1.5 * NewOverdue)
2. `INTERVENTION_SCENARIO` ("With approved capacity rebalance/squad deployment"):
   Backlog_48h = max(0, CurrentBacklog + 2 * (ArrivalRate_24h - 1.8 * ThroughputRate_24h))
- **Confidence & Honest AI Guard**:
  - Confidence is calculated as min(0.95, 0.40 + 0.10 * min(6, HistoricalDays)).
  - If total historical incident count < 3, returns `status: "INSUFFICIENT_DATA"` and confidence `0.0`.
  - Explanatory disclaimer: *"Operational scenario projection derived deterministically from recent incident velocity and historical resolution throughput. Not a predictive guarantee."*

### Engine 6: Executive Explanation Engine (`executiveExplanationEngine.ts`)
Decomposes every recommendation into human-readable, auditable factors:
- Why is this recommended?
- Breakdown of +N points contributing to pressure.
- Root cause factors derived from actual database records.

---

## 4. Database Requirements & Model Changes

Add `ExecutiveDecision` to `prisma/schema.prisma` without altering existing tables:
```prisma
model ExecutiveDecision {
  id                String    @id @default(cuid())
  recommendationId  String
  actionType        String
  targetArea        String?
  department        String?
  decision          String    // ACCEPTED | DISMISSED | DEFERRED
  reason            String?
  actorId           String
  actorName         String?
  metadataJson      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([recommendationId])
  @@index([decision])
  @@index([actorId])
  @@index([createdAt])
}
```
Run `npx prisma db push` to synchronize SQLite schema with zero downtime and zero data loss.

---

## 5. API Architecture

Protected endpoints enforcing `requireRole(request, ["operator", "admin"])`:
- `GET /api/executive/overview`: Aggregated snapshot (City Health, Pressure Score, Priorities, Trajectory, Department Summaries).
- `GET /api/executive/departments`: Full breakdown of all department profiles.
- `GET /api/executive/areas`: Geographic area profiles and cluster data.
- `GET /api/executive/recommendations`: Pending, accepted, and dismissed recommendation queues.
- `POST /api/executive/decisions`: Submits executive approval, dismissal, or deferral with mandatory audit logging.
- `GET /api/executive/projections`: Detailed 48h trajectory and intervention models.

---

## 6. UI Architecture — `/executive` (Municipal Executive Cockpit)

A dedicated, calm, authoritative, government-grade cockpit styled with deep slate surfaces and high-density typography:

```
+----------------------------------------------------------------------------------------------------+
|  TOP EXECUTIVE HEADER: CITY EXECUTIVE INTELLIGENCE | Surat Municipal Corporation                   |
|  [City Health: 72 MODERATE]   [Operational Pressure: 68 HIGH]   [Active Decisions: 4]              |
+----------------------------------------------------------------------------------------------------+
|  SECTION 1: TODAY'S DECISION PRIORITIES                                                            |
|  [HIGH PRESSURE: Road Operations - Deploy Additional Team Gamma to Varachha] [VIEW DECISION]       |
+-------------------------------------------------------------------+--------------------------------+
|  SECTION 2: WHAT HAPPENS IF WE DO NOTHING? (Trajectory)           |  SECTION 5: DECISION QUEUE     |
|  - 48h Backlog: 18 -> 27 | SLA Breach: 7 -> 14                     |  - List of Pending Actions     |
|  - Scenario Projection Disclaimer                                 |  - View Details / Approve /    |
|                                                                   |    Defer / Dismiss             |
+-------------------------------------------------------------------+--------------------------------+
|  SECTION 3: DEPARTMENT PERFORMANCE                                |  SECTION 4: AREA PERFORMANCE   |
|  - Road, Water, Sanitation, Electrical, Safety                    |  - Interactive Zone Grid       |
|  - Backlog, Resolution Rate, SLA Breach, Velocity, Status         |  - Zone Risk & Recurrence      |
|  - Click -> Opens Department Intelligence                         |  - Click -> Opens Area Dossier |
+----------------------------------------------------------------------------------------------------+
|  MODAL: DECISION DETAIL DRAWER                                                                     |
|  (What is happening? Why does it matter? What data supports this? What happens without action?)    |
|  [CONFIRM APPROVAL] [DEFER 24H] [DISMISS WITH REASON]                                              |
+----------------------------------------------------------------------------------------------------+
```

### Components to Create:
1. `src/components/executive/ExecutiveHeader.tsx`
2. `src/components/executive/DecisionPriorityBanner.tsx`
3. `src/components/executive/TrajectoryComparisonCard.tsx`
4. `src/components/executive/DepartmentPerformanceTable.tsx`
5. `src/components/executive/AreaPerformanceGrid.tsx`
6. `src/components/executive/AreaDossierDrawer.tsx`
7. `src/components/executive/DecisionQueueList.tsx`
8. `src/components/executive/DecisionDetailModal.tsx`

---

## 7. Testing & Verification Plan

### Test Suite: `scripts/test-phase8-executive-intelligence.js`
Implement all 25 required tests:
1. Empty data handling.
2. Insufficient data handling.
3. Department performance calculation.
4. Area performance calculation.
5. Pressure score normalization (0-100).
6. Pressure score boundaries.
7. Recommendation generation.
8. Recommendation explanation & factor points.
9. Human approval requirement (`humanApprovalRequired === true`).
10. Recommendation dismissal.
11. Recommendation deferral.
12. Executive decision audit trail in database.
13. Projection calculation (48h trajectory).
14. Projection confidence calculation.
15. Projection insufficient-data guard.
16. No automatic team deployment verification.
17. RBAC unauthenticated rejection (401).
18. Citizen access rejection (403).
19. Operator access permitted (200).
20. Admin access permitted (200).
21. Demo simulation isolation (zero DB pollution).
22. Existing Phase 7 real-time event integration.
23. Existing Phase 6 intelligence integration.
24. Full TypeScript type safety (`tsc`).
25. UI route integrity (`/executive` renders 200 OK).

### Multi-Suite Regression Execution:
- Phase 1: `test-stage1-auth-flow.js`
- Phase 2: `test-phase2-assignment-workflow.js`
- Phase 3: `test-phase3-field-workflow.js`
- Phase 4: `test-phase4-citizen-tracking.js`
- Phase 5: `test-multimodal-intelligence.js`
- Phase 6: `test-phase6-predictive-intelligence.js`
- Phase 7: `test-phase7-realtime-command-center.js`
- Phase 8: `test-phase8-executive-intelligence.js`
- `npx tsc --noEmit`
- `npm run build`

---

## 8. Honest AI & Zero Regression Compliance

- **No False Predictions**: Projections are clearly labeled as operational scenario models derived from recent arrival velocities and resolution throughput, never as prophetic AI forecasts.
- **Zero Database Pollution**: Demo simulations remain isolated in memory.
- **Strict Human Agency**: AI generates recommendations with supporting evidence; human leaders make approvals.
- **Zero Regression**: No existing models dropped, no existing APIs changed.
