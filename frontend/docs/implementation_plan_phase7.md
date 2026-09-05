# Phase 7 Implementation Plan — Real-Time Command Center, Live Operations & Demonstration Intelligence

## Executive Architectural Summary
Phase 7 introduces a mission-critical, real-time command layer to CivicPulse, transforming the platform into a live municipal nerve center for Surat Municipal Corporation. Built strictly upon the verified Phase 1–6 foundations, Phase 7 enables instantaneous telemetry, animated event streaming, live geospatial map visualization, isolated demonstration simulations, and guided judge walkthroughs without regression or database contamination.

---

## 1. Current Repository Audit

### A. Verified Functionality (Phases 1–6)
- **Phase 1 (Auth & RBAC)**: Session cookies (`civicpulse_session`), PBKDF2/bcrypt hashing, immutable user IDs, strict role guards (`citizen`, `operator`, `worker`, `admin`), zero role escalation.
- **Phase 2 (Ops Dispatch)**: Atomic team assignments, worker task isolation (`myTasks=true`), duplicate dispatch rejection (HTTP 409).
- **Phase 3 (Field Progression & Verification)**: Strict worker transitions (`assigned` → `en_route` → `arrived` → `in_progress` → `completed`), mandatory before/after photo evidence (HTTP 422 if missing), atomic verification gate (`awaiting_verification` → `resolved`), team lock retention.
- **Phase 4 (Citizen Tracking & Reopening)**: Public tracking via token/ID without internal data leakage, citizen reopen requests, supervisor review audit events.
- **Phase 5 (Multimodal Correlation)**: 5 deterministic intelligence engines (Semantic, Geospatial, Visual, Temporal, Category) computing explainable weighted similarity (0 - 100).
- **Phase 6 (Predictive Intelligence & City Health)**: Haversine hotspot detection (400m), chronic failure classification (`CHRONIC`, `HIGH`, `MODERATE`, `LOW`), emerging issue detector with false-positive suppression, City Health Score formula, and `AIDecisionFeedback` telemetry logging.

### B. Existing Real-Time & Event State
- **Current Refresh Pattern**: Client polling interval (6-second polling loop in `/operations`) and on-demand refresh in `/operations/intelligence`.
- **Activity & Timeline Models**: `IncidentTimelineEvent` (persisted in SQLite/PostgreSQL) and `/api/activity` endpoint retrieving recent logs.
- **Simulate Endpoint**: `/api/simulate` exists for static report ingestion, but directly inserts records into the database without step-by-step interactive demonstration or isolation.
- **Gap to Bridge for Phase 7**:
  1. Standardized application-wide Event Bus emitting typed real-time events.
  2. Live Server-Sent Events (SSE) stream with graceful delta-polling fallback.
  3. A dedicated real-time operations command center at `/operations/live` (complementing `/operations/intelligence`).
  4. Completely isolated, zero-contamination Demo Simulation Engine (T+0 to T+30) with reset capability.
  5. Interactive step-by-step judge presentation guide (`DemoGuideOverlay`).

---

## 2. Real-Time Architecture Decision

### Comparison of Real-Time Approaches:
- **Option A (Pure WebSockets)**: Requires standalone WebSocket server, socket.io daemon, or external broker. Prone to Next.js serverless edge disconnects and connection management complexity on Windows/Linux environments.
- **Option B (Pure Polling)**: Simple but introduces latency (3-6s), redundant HTTP header overhead, and lacks true "streaming" fidelity.
- **Option C (Server-Sent Events — SSE)**: Native HTTP streaming via Next.js App Router `ReadableStream` (`text/event-stream`), zero external daemon dependencies, native browser `EventSource` reconnect, unidirectional low-overhead push.
- **Option D (Hybrid Architecture — RECOMMENDED)**:
  - **Primary Transport**: Native Server-Sent Events (`GET /api/realtime/stream`) pushing real-time events from an in-memory Node.js `EventEmitter` (`RealtimeEventBus`).
  - **Fallback / Reconnect Transport**: Intelligent delta polling (`GET /api/realtime/events?since=<timestamp>`) if SSE is blocked by client proxies or disconnects.
  - **Zero External Infrastructure**: Operates 100% within the existing Next.js Node.js runtime, zero extra servers, zero NPM bloat, 100% reliable across Windows, macOS, and Linux.

---

## 3. Event Architecture

### A. Location: `src/lib/realtime/`
- `eventTypes.ts`: Typed event enumerations, interfaces, and payloads.
- `eventBus.ts`: Singleton `RealtimeEventBus` wrapping Node.js `EventEmitter` with circular in-memory buffer (retains last 200 events for newly connected clients and delta polling).
- `realtimeService.ts`: Methods to emit, subscribe, broadcast, and retrieve events.

### B. Typed Event Definitions:
```ts
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

export interface RealtimeEvent<T = any> {
  eventId: string;
  eventType: RealtimeEventType;
  timestamp: string;
  source: "production" | "simulation" | "system";
  actor?: {
    id: string;
    name: string;
    role: string;
  };
  entityId?: string;
  payload: T;
}
```

---

## 4. API Requirements

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/realtime/stream` | `GET` | Operator, Admin | SSE endpoint returning `text/event-stream` with heartbeat keep-alive. |
| `/api/realtime/events` | `GET` | Operator, Admin | Delta polling endpoint returning events `since` a timestamp. |
| `/api/realtime/alerts` | `GET` | Operator, Admin | Retrieves active critical alerts derived from live operational pressure. |
| `/api/realtime/simulate`| `POST` | Operator, Admin | Triggers or steps through deterministic demo scenarios without polluting DB. |

All routes declare `export const dynamic = "force-dynamic";` and enforce `requireRole(request, ["operator", "admin"])`.

---

## 5. Database Requirements & Zero Contamination Strategy

### Ground-Truth vs. Demo Simulation Isolation:
1. **Production Events**: When mutations occur in existing repository methods (e.g. `assignTeamToIncident`, `updateTaskStatus`, `verifyIncident`), the repository triggers `realtimeEventBus.publish(...)` asynchronously.
2. **Demo Simulation Storage**:
   - Simulation events use `source: "simulation"`.
   - Simulation incident and worker states reside in a dedicated in-memory `DemoSimulationEngine` or are tagged with `isDemo: true`.
   - **ZERO Database Contamination**: The demo mode does NOT insert persistent garbage rows into production `Incident`, `CitizenReport`, or `AIDecisionFeedback` tables unless cleanly isolated with a test transaction.
   - Calling `RESET` immediately flushes in-memory simulation state back to clean baseline.

---

## 6. UI Architecture — `/operations/live`

Create a dedicated page at `src/app/operations/live/page.tsx` styled as an **Enterprise Mission Control Command Center**:

```
+----------------------------------------------------------------------------------------------------+
|  TOP COMMAND HEADER: CIVICPULSE LIVE OPERATIONS | Surat, Gujarat | [● LIVE] [SSE: CONNECTED]        |
+----------------------------------------------------------------------------------------------------+
|  SECTION 1: QUICK ACTION & LIVE CITY HEALTH BAR                                                    |
|  [City Health: 82 STABLE]  [4 Unreviewed AI]  [2 Critical Incidents]  [1 SLA Alert] [DEMO MODE BTN]|
+-------------------------------------------------------------------+--------------------------------+
|  SECTION 2 (HERO): LIVE CITY MAP (LiveCityMap.tsx)                |  SECTION 3: LIVE EVENT STREAM  |
|  - Real incident markers (Red, Orange, Blue, Green, Purple)       |  (LiveEventStream.tsx)         |
|  - Pulsing status waves & GPS coordinates                         |  - Real-time animated feed     |
|  - Active worker location vectors & assignments                   |  - Timestamped events          |
|  - Hotspot overlays & sensitive zones (Schools/Hospitals)         |  - Filter by category/actor    |
|  - Click Marker -> Opens Interactive Mini Dossier Drawer          |                                |
+-------------------------------------------------------------------+--------------------------------+
|  SECTION 4: LIVE AI ENGINE ACTIVITY      | SECTION 5: LIFECYCLE TRACKER   | SECTION 6: ALERTS      |
|  (LiveAIActivityPanel.tsx)               | (IncidentLifecycleTracker.tsx) | (CriticalAlertPanel.tsx)|
|  - Semantic / Geospatial / Visual        | Report -> AI -> Ops ->         | Active critical badges |
|  - Confidence & last processed time      | Dispatch -> Progress -> Verify | Recommended action     |
+----------------------------------------------------------------------------------------------------+
```

### Components to Create:
1. `src/components/live/LiveCityMap.tsx`: Interactive SVG/Canvas map with real-time incident pins, worker beacons, hotspot rings, and hover tooltips.
2. `src/components/live/IncidentMiniDossier.tsx`: Drawer appearing on marker click with quick case facts, AI score, assigned crew, and direct action links.
3. `src/components/live/LiveEventStream.tsx`: Chronological stream auto-scrolling with new events and slide-in animations.
4. `src/components/live/LiveAIActivityPanel.tsx`: 5 intelligence engines displaying live status, confidence scores, and real data (or `"WAITING FOR DATA"`).
5. `src/components/live/IncidentLifecycleTracker.tsx`: Pipeline view showing active incident stage with animated transitions.
6. `src/components/live/CriticalAlertPanel.tsx`: High-priority operational warnings with actionable response triggers.
7. `src/components/live/AIDecisionLiveExplanation.tsx`: Explainable factor breakdown dialog.
8. `src/components/live/LiveCityHealth.tsx`: Real-time health badge with period-over-period trend calculation.
9. `src/components/live/OperatorActionCenter.tsx`: Metric badges for unreviewed AI decisions, SLA risks, and emerging issues.
10. `src/components/live/DemoSimulationControls.tsx`: UI controls (`Start`, `Pause`, `Reset`, `Step Forward`, `Exit`).
11. `src/components/live/DemoGuideOverlay.tsx`: Interactive spotlight walkthrough for SIH evaluators.

---

## 7. Demo Simulation Architecture

### Deterministic 30-Second Scenario: "Road Damage Near School"
- **T+0s**: Citizen submits pothole report (`Outside St. Xavier High School`).
- **T+2s**: AI engines begin multimodal analysis (`Semantic`, `Geospatial`).
- **T+4s**: Existing cluster detected within 140m.
- **T+6s**: Multimodal correlation score calculated (84%).
- **T+8s**: Operator receives priority recommendation (`CRITICAL` due to school zone).
- **T+10s**: Operator confirms recommendation.
- **T+12s**: Rapid Response Team Gamma dispatched.
- **T+15s**: Field worker status transitions to `EN ROUTE`.
- **T+20s**: Worker arrives on site (`ARRIVED`).
- **T+25s**: Field remediation evidence uploaded (`COMPLETED`).
- **T+30s**: Operator verifies resolution, incident marked `RESOLVED`.

### Demo Controls:
- `START`: Begins timeline progression.
- `PAUSE`: Freezes current timeline step.
- `STEP FORWARD`: Advances exactly one stage.
- `RESET`: Clears simulation state back to T+0 cleanly.
- `EXIT`: Returns to normal production live operations.

---

## 8. Guided Demo Architecture (`DemoGuideOverlay.tsx`)

A floating presentation assistant for evaluators and hackathon judges:
- Step 1: **Citizen Report Intake** (Highlights citizen submission and metadata capture)
- Step 2: **Multimodal AI Analysis** (Highlights 5 engines computing similarity scores)
- Step 3: **Spatial-Semantic Correlation** (Highlights duplicate detection)
- Step 4: **Operator Supervisory Decision** (Highlights human-in-the-loop review)
- Step 5: **Intelligent Team Dispatch** (Highlights worker allocation and proximity)
- Step 6: **Field Execution & Evidence** (Highlights photo verification gate)
- Step 7: **Predictive City Intelligence** (Highlights hotspots and health score impact)

Includes Next/Previous step navigation, progress indicator (`Step 3 of 7`), and close button.

---

## 9. RBAC & Security Impact
- `/operations/live` is strictly guarded by `requireRole(request, ["operator", "admin"])`.
- Citizens and unauthenticated users attempting to access `/operations/live` or `/api/realtime/*` are redirected to `/login` or returned HTTP 401/403.
- Field workers receive limited operational views.
- Public tracking (`/track/[id]`) remains completely isolated from internal real-time event streams.

---

## 10. Performance Considerations
- Event bus uses in-memory ring buffer (maximum 200 events) to prevent memory leakage.
- SSE connection cleans up listeners on client disconnect (`request.signal.addEventListener("abort")`).
- UI renders use React `memo` and throttled event ingestion to avoid layout thrashing during rapid event bursts.
- Map SVG uses efficient vector projection with CSS hardware-accelerated transforms.

---

## 11. Files to Create & Modify

### Files to Create:
1. `src/lib/realtime/eventTypes.ts`
2. `src/lib/realtime/eventBus.ts`
3. `src/lib/realtime/realtimeService.ts`
4. `src/lib/realtime/demoSimulationEngine.ts`
5. `src/lib/realtime/index.ts`
6. `src/app/api/realtime/stream/route.ts`
7. `src/app/api/realtime/events/route.ts`
8. `src/app/api/realtime/simulate/route.ts`
9. `src/app/api/realtime/alerts/route.ts`
10. `src/app/operations/live/page.tsx`
11. `src/components/live/LiveCityMap.tsx`
12. `src/components/live/IncidentMiniDossier.tsx`
13. `src/components/live/LiveEventStream.tsx`
14. `src/components/live/LiveAIActivityPanel.tsx`
15. `src/components/live/IncidentLifecycleTracker.tsx`
16. `src/components/live/CriticalAlertPanel.tsx`
17. `src/components/live/AIDecisionLiveExplanation.tsx`
18. `src/components/live/LiveCityHealth.tsx`
19. `src/components/live/OperatorActionCenter.tsx`
20. `src/components/live/DemoSimulationControls.tsx`
21. `src/components/live/DemoGuideOverlay.tsx`
22. `scripts/test-phase7-realtime-command-center.js`

### Files to Modify:
1. `src/components/Navbar.tsx` (or operations navigation links): Add convenient switch link to "Live Ops".
2. `src/lib/repositories/PrismaCivicRepository.ts`: Publish real-time events on incident/task updates.

---

## 12. Verification & Testing Plan

### Automated Test Suite: `scripts/test-phase7-realtime-command-center.js`
Will implement all 20 required tests:
1. Event schema validation.
2. Incident event generation.
3. AI processing event emission.
4. Worker status transition event.
5. Critical alert generation.
6. Real-time subscription lifecycle.
7. Unauthorized access rejection (401/403).
8. Operator access permitted (200).
9. Admin access permitted (200).
10. Demo simulation starts correctly.
11. Demo simulation progresses deterministically.
12. Demo simulation pause functionality.
13. Demo simulation reset cleanly returns to initial state.
14. Demo data isolation (zero DB pollution).
15. Event cleanup and memory safety.
16. Live dashboard data integrity.
17. No duplicate event processing.
18. Error handling on malformed payloads.
19. Insufficient data graceful handling.
20. Command center API contract integrity.

### Multi-Suite Regression Execution:
- `node scripts/test-stage1-auth-flow.js`
- `node scripts/test-phase2-assignment-workflow.js`
- `node scripts/test-phase3-field-workflow.js`
- `node scripts/test-phase4-citizen-tracking.js`
- `node scripts/test-multimodal-intelligence.js`
- `node scripts/test-predictive-intelligence.js`
- `node scripts/test-phase6-predictive-intelligence.js`
- `node scripts/test-phase7-realtime-command-center.js`
- `npx tsc --noEmit`
- `npm run build`

---

## 13. Risk Analysis & Mitigation
- **Risk**: Long-lived SSE connections causing Node.js event listener leaks.
  - *Mitigation*: Register client abort signals (`req.signal.addEventListener("abort")`) to remove listener from `realtimeEventBus` immediately upon disconnect.
- **Risk**: Demo simulation corrupting database state.
  - *Mitigation*: Run demo scenario purely in memory with tagged events (`source: "simulation"`), leaving Prisma database untouched.
- **Risk**: Mobile layout breakage due to dense desktop command center layout.
  - *Mitigation*: Fluid responsive stacking on tablet/mobile with collapsible drawers and priority tab navigation.

---

## 14. Honest AI Compliance
- No fake neural network claims.
- The 5 AI activity engine states display real processing stages when active and `"WAITING FOR DATA"` when idle.
- Factor contribution points in `AIDecisionLiveExplanation` are computed directly from mathematical spatial-semantic scoring engines.
- Demo simulation is explicitly watermarked with **`DEMO SIMULATION MODE`**.
