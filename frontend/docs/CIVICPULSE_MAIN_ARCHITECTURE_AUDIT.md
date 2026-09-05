# CIVICPULSE MAIN PROJECT — COMPLETE ARCHITECTURAL & INTEGRATION AUDIT

================================================================================
EXECUTIVE STATUS & SUMMARY
================================================================================
- **Audit Date**: September 2026
- **Project Name**: CIVICPULSE MAIN (Project A)
- **Role**: Principal Systems Architect & Senior Codebase Auditor
- **Objective**: Full architectural inspection of Project A (Main) to prepare for the future integration of Project B (Separate AI Engine at http://127.0.0.1:8000) without modifying code, deleting files, or moving folders.
- **Fundamental Architectural Axiom**: 
  > **AI IS AN INTELLIGENCE LAYER. AI IS NOT THE SYSTEM OF RECORD.**
  > The CivicPulse Core Backend (Next.js + Prisma + SQLite/Postgres) retains 100% ownership of Authentication, Authorization (RBAC), Citizen Reports, Canonical Incidents, Field Tasks, Worker Assignments, Evidence Storage, Timelines, State Transitions, and Human Verification. The AI Engine provides non-blocking recommendations, semantic scoring, priority intelligence, and verification hints.

---

## SECTION 1: PROJECT STRUCTURE & REPOSITORY MAP

The CivicPulse Main project is an enterprise-grade TypeScript / Next.js 14 App Router application with Prisma ORM.

```
civicpulse/
├── prisma/
│   ├── schema.prisma           # Complete SQLite/PostgreSQL relational data model (12 models)
│   ├── seed.ts                 # Idempotent seed data (4 roles, 9 specialized field technicians, 4 teams, 2 base incidents)
│   └── dev.db                  # Local SQLite database instance (active)
├── src/
│   ├── app/                    # Next.js App Router (Pages & API endpoints)
│   │   ├── (public)/           # Landing page (src/app/page.tsx)
│   │   ├── login/              # Universal Authentication Portal with 1-Click Persona Switcher
│   │   ├── citizen/            # Citizen Signal submission portal with instant pre-correlation
│   │   ├── track/[id]/         # Public Citizen Incident Tracker with feedback loop
│   │   ├── operations/         # Municipal Operations Command Triage Center
│   │   │   ├── incidents/[id]/ # Deep 360° Incident Dossier & Case File
│   │   │   └── live/           # Live Operations Command Wall & Real-time War Room
│   │   ├── field/              # Mobile Field Worker Hub & Execution HUD
│   │   ├── executive/          # Executive Cockpit & Decision Intelligence Dashboard
│   │   └── api/                # 13 REST API route groups
│   ├── components/             # Domain-scoped UI component systems
│   │   ├── citizen/            # IssueCategorySelector, LocationCapturePanel, EvidenceCapturePanel
│   │   ├── operations/         # PriorityQueueRail, IncidentPreviewPanel, LiveActivityTicker
│   │   ├── dossier/            # OperationalResponsePanel, SituationSummary, IncidentTimeline
│   │   ├── field/              # NextActionPanel, TaskExecutionHUD, FieldLocationPanel
│   │   ├── live/               # LiveCityMap, LiveEventStream, LiveAIActivityPanel
│   │   ├── executive/          # DecisionPriorityBanner, TrajectoryComparisonCard
│   │   ├── spatial/            # CitySignalCanvas (interactive 2D canvas & heatmaps)
│   │   └── layout/             # GlobalNav with active session detection
│   ├── lib/
│   │   ├── ai/                 # CURRENT heuristic/fallback AI engines (correlationEngine, priorityEngine, embeddings, geo)
│   │   ├── auth/               # HMAC-SHA256 session token generator, bcrypt password verify, requireRole RBAC guards
│   │   ├── domain/             # Domain models, state machines, transition validators
│   │   ├── errors/             # AppError hierarchy (BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Unprocessable)
│   │   ├── executive/          # Executive decision simulation service & trajectory projector
│   │   ├── intelligence/       # Multimodal signal fusion (geo + semantic + visual + temporal + category)
│   │   ├── realtime/           # SSE broadcast hub, event bus, polling delta provider
│   │   ├── repositories/       # ICivicRepository interface & PrismaCivicRepository implementation
│   │   ├── services/           # ReportService (intake orchestration)
│   │   └── validation/         # Zod schemas (CreateReportSchema, AssignTeamSchema, etc.)
│   └── types/                  # Core TypeScript domain definitions (User, CitizenReport, Incident, FieldTask, FieldTeam)
├── scripts/                    # Verified regression & certification test suites
│   ├── test-phase1-canonical-workflow.js
│   └── test-phase2-regression-certification.js
├── .env                        # Local configuration (DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL)
└── package.json                # Dependencies (Next 14, React 18, Prisma 5, bcryptjs, zod, tailwindcss)
```

---

## SECTION 2: FRONTEND ARCHITECTURE

1. **Framework & Engine**: Next.js 14.2.3 (React 18.3.1) utilizing the modern App Router architecture (`src/app`).
2. **Routing & Code Organization**:
   - `/`: Public City Landing Page with live telemetry stats and citizen intake CTA.
   - `/login`: Universal auth page with 1-Click Persona Switcher for Citizen, Operator, Admin, and 8+ specialized Department Field Workers.
   - `/citizen`: Citizen Signal submission form with live GPS detection, Base64 camera upload, and instant correlation preview.
   - `/track/[id]`: Public incident tracking page accepting both Report IDs (`R-XXXX`) and Incident IDs (`CP-XXXX`), displaying the 5-stage civic lifecycle, before/after evidence photos, and citizen feedback gate.
   - `/operations`: Operator Triage Command Center displaying the priority queue rail, spatial map, and 1-click dispatch preview drawer.
   - `/operations/incidents/[id]`: Deep 360° Incident Dossier with situation briefing, connected signal constellation, before/after evidence inspector, and supervisor verification / closure actions.
   - `/operations/live`: High-density municipal war room command wall with SSE real-time stream, AI engine telemetry, and live city health indicators.
   - `/field`: Dedicated mobile web portal for municipal technicians. Scopes tasks exclusively to the logged-in worker, provides GPS navigation links, 5-stage task status actions, and camera proof upload.
   - `/executive`: Strategic decision cockpit projecting 48-hour municipal risk trajectories, cost-delay impact simulations, and human-in-the-loop executive interventions.
3. **State Management**:
   - Uses localized React state (`useState`, `useCallback`, `useRef`) combined with HTTP-only cookie-backed session verification via `/api/auth/me`.
   - Data synchronization relies on fast delta polling (6s in operations, 12s in public tracking) and Server-Sent Events (SSE in `/operations/live`).
4. **API Client Layer**:
   - Native `fetch` with JSON payloads and automatic HTTP status code handling.
   - Credentials are authenticated automatically through HTTP-only cookies (`credentials: 'include'` semantics).

---

## SECTION 3: BACKEND ARCHITECTURE

1. **Framework**: Next.js Serverless Route Handlers (`src/app/api/**/route.ts`).
2. **Controller & Service Layer**:
   - `ReportService` (`src/lib/services/ReportService.ts`): Orchestrates citizen report validation, AI correlation, canonical incident matching, and atomic persistence.
   - `ExecutiveIntelligenceService` (`src/lib/executive/ExecutiveIntelligenceService.ts`): Simulates municipal impact, computes city health metrics, and manages executive intervention proposals.
3. **Repository Pattern**:
   - `ICivicRepository` (`src/lib/repositories/ICivicRepository.ts`): Strict interface decoupling business rules from the database engine.
   - `PrismaCivicRepository` (`src/lib/repositories/PrismaCivicRepository.ts`): Production implementation utilizing Prisma ORM with strict atomic transaction (`prisma.$transaction`) semantics for:
     - `processReportSubmissionAtomic`: Concurrently creates report, matches incident, updates cluster counts, and appends timeline events.
     - `assignTeamToIncident`: Locks team, locks worker (`isAvailable: false`), creates FieldTask, transitions Incident to `assigned`, and notifies real-time bus.
     - `advanceTaskStatus`: Enforces the 5-stage field state machine and validates required photographic proof on completion.
     - `verifyIncident`: Operator closure gate. Transitions Incident to `resolved`, releases team and worker (`isAvailable: true`), and marks tasks as `verified`.
     - `submitCitizenFeedback` & `reviewReopenRequest`: Governs citizen satisfaction and reopening lifecycle.
4. **Validation & Security**:
   - Zod validation schemas (`src/lib/validation/schemas.ts`).
   - Centralized AppError handling (`src/lib/errors/AppError.ts`) mapping domain exceptions to HTTP 400, 401, 403, 404, 409, 422, and 500.

---

## SECTION 4: DATABASE ARCHITECTURE & MODELS

The database is powered by **Prisma 5.14.0** with SQLite (`prisma/dev.db`) for seamless local execution and full PostgreSQL schema compatibility.

```
   +------------------+         1:N         +---------------------+
   |       User       | ------------------> |    CitizenReport    |
   | (CITIZEN, etc.)  |                     | (R-XXXX, GPS, text) |
   +------------------+                     +---------------------+
       | 1                                             | N
       | (Team Leader / Member)                        | (Fused via AI/Spatial)
       v N                                             v 1
   +------------------+         1:N         +---------------------+
   |    FieldTeam     | <------------------ |      Incident       |
   | (alpha, beta...) |  (assignedTeamId)   | (CP-XXXX, Canonical)|
   +------------------+                     +---------------------+
       | 1                                             | 1
       |                                               |
       v N                                             v N
   +------------------+                     +---------------------+
   |    FieldTask     | <------------------ | IncidentTimeline    |
   | (TSK-XXXX, Proof)|                     | (Audit History)     |
   +------------------+                     +---------------------+
```

### Model Inventory (12 Prisma Models):
1. **`User`**: Stores accounts, bcrypt password hashes, municipal roles (`CITIZEN`, `OPERATOR`, `WORKER`, `ADMIN`), team affiliations, and real-time availability (`isAvailable`).
2. **`CitizenReport`**: Represents an individual raw citizen complaint (`id`: `R-XXXX`). Contains raw description, GPS coordinates, address, mediaUrl, status (`received`, `correlated`, `assigned`, etc.), and foreign key `incidentId`.
3. **`Incident`**: Represents the canonical real-world problem (`id`: `CP-XXXX`). Aggregates multiple citizen reports, tracks affected citizen estimates, priority level & score, assigned team & worker, before/after evidence photos, citizen feedback status, and reopening metadata.
4. **`FieldTeam`**: Municipal squad (`team-alpha` PWD, `team-beta` Water, `team-gamma` Electrical, `team-delta` Sanitation) with department, status (`available`, `dispatched`, `busy`), leader ID, and live GPS coordinates.
5. **`FieldTask`**: Work order order issued to a specific worker (`id`: `TSK-XXXX`). Enforces the field lifecycle (`assigned` → `en_route` → `arrived` → `in_progress` → `completed`), instructions, distance, and `afterPhotoUrl` (Base64 proof).
6. **`IncidentTimelineEvent`**: Immutable audit log of every operational and AI event for an incident.
7. **`ActivityLog`**: Global operational activity stream for municipal command dashboards.
8. **`ExecutiveDecision`**: Audit records of municipal executive interventions.
9. **`AreaMetricProfile`**: Spatial performance snapshots for city sectors.
10. **`Evidence`**: Media asset records tied to reports and incidents.
11. **`CorrelationMatch`**: AI candidate matches linking raw reports to candidate incidents.
12. **`Notification`**: Real-time push alerts for citizens and municipal personnel.

---

## SECTION 5: AUTHENTICATION AND RBAC

1. **Authentication Technology**:
   - Custom cryptographically signed **HMAC-SHA256** session tokens stored in an **HTTP-only cookie** (`civicpulse_session`).
   - Timing-safe signature verification (`crypto.timingSafeEqual`) prevents timing attacks.
   - Passwords hashed using industry-standard **bcryptjs** (salt rounds: 10).
2. **Role-Based Access Control (RBAC)**:
   - Evaluated server-side on every protected API call via `requireRole(request, allowedRoles)` (`src/lib/auth/index.ts`).
   - Defined roles:
     - **`CITIZEN`**: Can submit reports, view own reports, view public tracking, and submit feedback on own incidents. Blocked from dispatch and verification.
     - **`OPERATOR`**: Can triage incidents, dispatch teams/workers, verify completed field work, approve/reject reopen requests, and view command dashboards.
     - **`WORKER`**: Can access `/field` portal, view personal tasks (strictly isolated to `assignedWorkerId`), advance task status, and upload repair proof. Blocked from operator triage and verification.
     - **`ADMIN`**: Complete unrestricted access to governance, executive dashboards, system metrics, and audit logs.
3. **AI Integration Security Principle**:
   - **The frontend NEVER talks to the AI Engine directly.**
   - All AI calls originate from the authenticated Core Backend server-to-server.
   - The Core Backend acts as a secure reverse-proxy and validation barrier, shielding AI provider keys from public exposure.

---

## SECTION 6: CURRENT REPORT FLOW (END-TO-END TRACE)

The actual complaint flow through the codebase:

```
1. USER ACTION: Citizen fills complaint form at /citizen and clicks 'Transmit Official Signal'
   ↓
2. FRONTEND COMPONENT: src/app/citizen/page.tsx (handleSubmitReport)
   ↓
3. HTTP POST: /api/reports with JSON payload { description, category, latitude, longitude, address, mediaUrl }
   ↓
4. ROUTE HANDLER: src/app/api/reports/route.ts
   - Validates payload with CreateReportSchema (Zod)
   - Resolves authenticated user identity via getAuthenticatedUser(request)
   ↓
5. SERVICE ORCHESTRATION: src/lib/services/ReportService.ts (submitReport)
   - Loads existing active incidents from repository
   - Executes correlateSignal() heuristic to determine if report matches an active incident
   - If match found (confidence >= 0.72 or proximity <= 150m): targets existing incident ID
   - If no match: generates new canonical Incident CP-XXXX with initial priority and timeline
   - Generates new CitizenReport R-XXXX bound to target incident
   ↓
6. ATOMIC REPOSITORY PERSISTENCE: src/lib/repositories/PrismaCivicRepository.ts (processReportSubmissionAtomic)
   - Executes inside prisma.$transaction:
     * Inserts CitizenReport
     * Inserts new Incident OR updates existing Incident (increases report count & priority)
     * Inserts IncidentTimelineEvent & ActivityLog
   ↓
7. REALTIME BUS: Emits INCIDENT_CREATED or INCIDENT_UPDATED on in-memory SSE event bus
   ↓
8. API RESPONSE: HTTP 200 with { report, incident, isNewIncident, matchReasons }
   ↓
9. UI UPDATE: src/app/citizen/page.tsx renders SubmissionReceipt showing Report Tracking ID (R-XXXX) and direct link to /track/[id]
```

---

## SECTION 7: REPORT VS INCIDENT (CANONICAL CLUSTERING ARCHITECTURE)

**Yes, CivicPulse ALREADY separates CitizenReport and Incident into two distinct database models and architectural concepts.**

### Architectural Distinction:
- **`CitizenReport` (Signal)**:
  - Represents a single subjective citizen complaint (e.g. `R-1335`).
  - Represents the *reporter's perspective* (their description, phone, timestamp, photo).
- **`Incident` (Canonical Truth)**:
  - Represents the *physical urban problem* on city ground (e.g. `CP-4511`).
  - Represents the *operational work unit* managed by the municipal authority.
  - Can have **1 to N CitizenReports** linked to it.

### Why this is critical for Smart India Hackathon & Real Municipalities:
1. **Avoids duplicate dispatches**: If 50 citizens report the same pothole near a school, the municipality does NOT dispatch 50 road repair trucks. The system merges the 50 reports into **ONE Canonical Incident** (`CP-1024`).
2. **Prioritization by Signal Density**: Each additional report dynamically increases the Incident's priority score (`priorityScore`) and affected population estimate via logarithmic scaling.
3. **Unified Public Tracking**: All 50 citizens track their individual Report IDs (`R-1001`, `R-1002`), but they all see the unified operational status of Canonical Incident `CP-1024`.

---

## SECTION 8: CURRENT DISPATCH AND FIELD WORKFLOW

1. **Operator Triage & Assignment**:
   - Location: `/operations` or `/operations/incidents/[id]` (`OperationalResponsePanel.tsx`).
   - Operator selects an available squad (`FieldTeam`) and a designated specialist (`User` with role `WORKER`).
   - Triggers `POST /api/incidents/[id]/assign`.
   - **Atomic Transaction**:
     - Locks Team: `status: 'dispatched'`, `activeIncidentId: incidentId`.
     - Locks Worker: `isAvailable: false`.
     - Creates `FieldTask` (`TSK-XXXX`) assigned to `targetWorker.id`.
     - Transitions Incident status to `assigned`.
     - Synchronizes all linked `CitizenReports` to `assigned`.
2. **Field Worker Execution (5-Stage State Machine)**:
   - Location: `/field` (`NextActionPanel.tsx`).
   - Worker logs in; task list is strictly scoped via `GET /api/tasks?myTasks=true` (`where: { assignedWorkerId: user.id }`).
   - Transitions strictly governed by `canTransitionTaskStatus`:
     `assigned` → `en_route` → `arrived` → `in_progress` → `completed`.
   - On `completed`, the backend **strictly enforces photographic proof**:
     If `afterPhotoUrl` is missing or notes < 5 chars, backend rejects with **HTTP 422 Unprocessable Entity**.
   - Moving to `completed` automatically moves parent Incident and all linked CitizenReports to **`awaiting_verification`**.

---

## SECTION 9: EVIDENCE AND RESOLUTION WORKFLOW

1. **Evidence Upload Pipeline**:
   - Both camera capture (`capture="environment"`) and file gallery upload are supported in `NextActionPanel.tsx`.
   - Selected file is validated on client (< 5MB, MIME starts with `image/`).
   - Converted to a standard **Base64 Data URL** via HTML5 `FileReader.readAsDataURL()`.
   - Transmitted via `PATCH /api/tasks/[id]` in `afterPhotoUrl`.
   - Persisted directly in SQLite `FieldTask.afterPhotoUrl` and propagated to `Incident.afterEvidenceUrl`.
2. **Supervisor Verification & Quality Sign-Off**:
   - Location: `/operations/incidents/[id]` (`OperationalResponsePanel.tsx`).
   - Operator inspects side-by-side Before Photo and Worker's After Photo.
   - Operator clicks **Approve Resolution** → calls `POST /api/incidents/[id]/verify` with `{ decision: 'approve' }`.
   - **Atomic Closure Transaction**:
     - Transitions Incident to `resolved`.
     - Releases FieldTeam (`status: 'available'`, `tasksCompleted + 1`).
     - Releases Worker (`isAvailable: true`).
     - Marks FieldTask as `verified`.
     - Synchronizes all connected CitizenReports to `resolved`.
3. **Citizen Resolution Feedback & Reopening Lifecycle**:
   - Citizen opens `/track/[id]` and sees resolution badge with verified after-work photo.
   - Citizen has two options:
     - **Option A (Satisfied)**: Clicks `RESOLVED SUCCESSFULLY` → confirms resolution, permanent closure recorded.
     - **Option B (Unsatisfied)**: Clicks `ISSUE STILL EXISTS` and provides notes → calls `POST /api/incidents/[id]/feedback`.
     - Transitions Incident to **`reopen_requested`**.
     - Incident reappears in Operator Queue under `Citizen Reopen Request Pending Review`.
     - Operator reviews citizen notes:
       - **Approve Reopen**: Transitions Incident back to `in_progress`, unbinds previous squad, permits secondary dispatch.
       - **Reject Reopen**: Returns Incident to `resolved` with supervisor justification.

---

## SECTION 10: FRONTEND REAL VS FAKE DATA AUDIT

| Screen | File | Real API Connected | Mock / Demo Elements | Classification | Action for AI Phase |
|:---|:---|:---|:---|:---|:---|
| **Landing Page** | `src/app/page.tsx` | Partial (`/api/incidents`) | Static feature badges & hero counter | Intentional UI showcase | Keep static UI; connect live counter |
| **Login Page** | `src/app/login/page.tsx` | **100% Real API** (`/api/auth/login`) | None. Verified database accounts | Fully functional | Keep 1-click persona switcher |
| **Citizen Portal** | `src/app/citizen/page.tsx` | **100% Real API** (`/api/reports`) | 4 "Quick Demo Scenarios" for easy judge testing | Intentional Demo Helper | Keep quick autofill buttons for judges |
| **Public Tracker** | `src/app/track/[id]/page.tsx`| **100% Real API** (`/api/track/[id]`) | None. Directly queries database | Fully functional | Retain canonical tracker |
| **Operations Triage**| `src/app/operations/page.tsx` | **100% Real API** (`/api/incidents`, `/api/teams`) | Simulation pulse overlay button | Optional Demo Tool | Connect to live AI priority updates |
| **Incident Dossier**| `src/app/operations/incidents/[id]/page.tsx` | **100% Real API** (`/api/incidents/[id]`) | Heuristic AI explanation factors | Interim Heuristics | **Replace with real AI Engine outputs** |
| **Field Worker Hub**| `src/app/field/page.tsx` | **100% Real API** (`/api/tasks?myTasks=true`) | 3 Evidence Preset URLs for quick testing | Testing Presets | Keep presets + live camera upload |
| **Live Command Wall**| `src/app/operations/live/page.tsx` | **100% Real API** (`/api/realtime/stream`) | Simulated agent telemetry status toggles | Demo Simulation Overlay | Connect to real background workers |
| **Executive Cockpit**| `src/app/executive/page.tsx` | **100% Real API** (`/api/executive/overview`) | Heuristic trajectory simulation engine | Heuristic Projections | Upgrade projections using AI Engine |

---

## SECTION 11: BACKEND API INVENTORY

| Method | Endpoint | Auth Required | Role Required | DB Models Touched | Frontend Consumer |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | No | Public | `User` | `LoginPage.tsx` |
| `POST` | `/api/auth/logout` | Yes | Any | None (Clears cookie) | GlobalNav |
| `GET`  | `/api/auth/me` | Yes | Any | `User` | GlobalNav, `FieldPage.tsx` |
| `POST` | `/api/reports` | Optional | Any / Citizen | `CitizenReport`, `Incident`, `ActivityLog` | `CitizenPortalPage.tsx` |
| `GET`  | `/api/reports` | Yes | Operator, Admin | `CitizenReport` | Operations triage |
| `GET`  | `/api/citizen/reports` | Yes | Citizen | `CitizenReport` | Citizen report tracker |
| `GET`  | `/api/incidents` | Yes | Any authenticated | `Incident` | Operations, Live command |
| `GET`  | `/api/incidents/[id]` | Yes | Any authenticated | `Incident`, `CitizenReport`, `FieldTask` | Dossier page, Field hub |
| `POST` | `/api/incidents/[id]/assign` | Yes | Operator, Admin | `Incident`, `FieldTeam`, `User`, `FieldTask` | `IncidentPreviewPanel`, `OperationalResponsePanel` |
| `POST` | `/api/incidents/[id]/verify` | Yes | Operator, Admin | `Incident`, `FieldTeam`, `User`, `FieldTask` | `OperationalResponsePanel` |
| `POST` | `/api/incidents/[id]/feedback` | Yes | Citizen (Owner) | `Incident`, `CitizenReport`, `TimelineEvent`| `IncidentPublicTrackingPage` |
| `POST` | `/api/incidents/[id]/reopen-review` | Yes | Operator, Admin | `Incident`, `TimelineEvent`, `ActivityLog`| `OperationalResponsePanel` |
| `GET`  | `/api/tasks` | Yes | Worker, Operator | `FieldTask` | `FieldWorkerHubPage` |
| `PATCH`| `/api/tasks/[id]` | Yes | Worker | `FieldTask`, `Incident`, `CitizenReport` | `NextActionPanel` |
| `GET`  | `/api/teams` | Yes | Operator, Admin | `FieldTeam`, `User` | Operations, Dossier, Field |
| `GET`  | `/api/track/[id]` | No | Public | `Incident`, `CitizenReport` | `IncidentPublicTrackingPage` |
| `POST` | `/api/upload` | No | Public / Citizen | None (Base64 transformer) | Evidence panels |
| `GET`  | `/api/executive/overview` | Yes | Operator, Admin | `Incident`, `FieldTask`, `AreaMetric` | `ExecutiveCockpitPage` |
| `POST` | `/api/executive/decisions`| Yes | Operator, Admin | `ExecutiveDecision`, `ActivityLog` | `ExecutiveCockpitPage` |
| `GET`  | `/api/realtime/stream` | Yes | Operator, Admin | Event Bus (SSE Stream) | `LiveOperationsCommandCenter` |

---

## SECTION 12: HARDCODED & HEURISTIC DATA INVENTORY

| File | Hardcoded Element | Current Purpose | Action When Integrating AI Engine |
|:---|:---|:---|:---|
| `src/lib/ai/correlationEngine.ts` | `inferCategoryFromText` (keyword checks) | Fallback keyword-based category inference | **Route through AI Engine `/analyze`** |
| `src/lib/ai/correlationEngine.ts` | Fixed confidence formula | Heuristic similarity calculation | **Enrich with AI Engine `/duplicate` score** |
| `src/lib/ai/priorityEngine.ts` | Keyword lists (`CRITICAL_KEYWORDS`) | Baseline heuristic priority scoring | **Enrich with AI Engine `/priority` score** |
| `src/lib/intelligence/visualEvidence.ts` | Heuristic tag extractor from image URL | Simulated perceptual visual comparison | **Route through AI Engine `/verify`** |
| `src/app/citizen/page.tsx` | `QUICK_SCENARIOS` array | Demo autofill shortcuts for SIH judges | **Keep as test buttons for judges** |
| `src/components/field/NextActionPanel.tsx`| `EVIDENCE_PRESETS` array | Fallback stock repair photos for demo | **Keep alongside live camera capture** |
| `prisma/seed.ts` | `SEED_INCIDENTS` (`CP-1024`, `CP-1019`) | Initial database seed | **Keep as baseline historical data** |

---

## SECTION 13: FUTURE AI INTEGRATION POINTS

| AI Capability | Existing Backend File | When Called | Input Data | Output Usage | Human Override | Failure Behavior |
|:---|:---|:---|:---|:---|:---|:---|
| **1. Complaint Classification & Language** | `ReportService.ts` (line ~54) | Upon citizen report submission | `description`, `latitude`, `longitude`, `mediaUrl` | Sets Incident & Report category, urgency, safety hazard flag | Operator can edit category in dossier | Falls back to internal regex/keyword heuristic |
| **2. Severity & Urgency Evaluation** | `ReportService.ts` | During intake processing | `description`, `category`, location context | Populates initial `priorityScore` and `priorityReason` | Operator can adjust priority in preview panel | Falls back to baseline severity rules |
| **3. Duplicate Detection & Correlation** | `ReportService.ts` (line ~56) | Before assigning Incident ID | `description`, `category`, `lat`, `lng`, existing active incidents | Decides whether to merge into existing `CP-XXXX` or create new | Operator can manually merge/split in dossier | Falls back to internal Haversine distance heuristic |
| **4. Priority Intelligence & Factors** | `PrismaCivicRepository.ts` (line ~988) | When multi-signal correlation occurs | `severity`, `urgency`, `duplicate_count`, sensitive location | Updates canonical `priorityScore` (0-100) and explanation badges | Operator sets final dispatch urgency | Retains existing incident priority score |
| **5. Explainable AI Factors** | `ReportService.ts` & `PrismaCivicRepository.ts` | Stored on Incident creation/correlation | AI explanation array and contributing factors | Persisted in `Incident.aiExplanationJson` for dossier inspection | Displayed transparently to operators | Defaults to standard system audit factors |
| **6. Resolution Evidence Verification** | `PrismaCivicRepository.ts` (`verifyIncident`) | When worker submits after photo / Operator reviews | `before_image_url`, `after_image_url`, `category` | Renders "AI Verification Recommendation" in dossier | **Operator has 100% final sign-off authority** | Displays "AI Verification Unavailable; Manual Review Required" |

---

## SECTION 14: PROPOSED FUTURE ARCHITECTURE

```
                                  CITIZEN FRONTEND / OPERATOR FRONTEND / WORKER FRONTEND
                                                           │
                                                           │ HTTPS (Cookies / JSON)
                                                           ▼
                                            CIVICPULSE CORE BACKEND (Next.js)
                                            ├── Authentication & RBAC Guard
                                            ├── Zod Input Validation
                                            ├── State Machine Enforcer
                                            └── Atomic Workflow Controller
                                                   │                 │
                           Server-to-Server Internal HTTP           │ Prisma Client (ORM)
                           (Non-blocking with Timeout)              │ Transactions
                                                   │                 │
                                                   ▼                 ▼
                                    +-----------------------+  +-------------------------+
                                    |   AI SERVICE ADAPTER  |  |  CORE DATABASE (SQLite) |
                                    | (src/lib/ai/client.ts)|  | (System of Record)      |
                                    +-----------------------+  | - User (RBAC)           |
                                                   │           | - CitizenReport         |
                                                   │           | - Incident (Canonical)  |
                                                   ▼           | - FieldTask             |
                                    +-----------------------+  | - FieldTeam             |
                                    | CIVICPULSE AI ENGINE  |  | - IncidentTimeline      |
                                    | (Separate Project B)  |  | - ActivityLog           |
                                    | http://127.0.0.1:8000 |  +-------------------------+
                                    +-----------------------+
                                    - /analyze
                                    - /duplicate
                                    - /priority
                                    - /verify
                                    - /analyze/full
```

---

## SECTION 15: PROPOSED AI INTEGRATION FLOW (NON-BLOCKING)

```
Citizen Submits Complaint
           │
           ▼
Core Backend Validates Payload (Zod)
           │
           ▼
Core Backend calls AI Engine (/analyze/full or /analyze) with 3.5s Timeout
           │
     ┌─────┴──────────────────────────────┐
     │                                    │
[AI Available]                   [AI Timeout / Fallback]
     │                                    │
Receive AI Suggestions           Fallback to Local Heuristics
     │                                    │
     └─────┬──────────────────────────────┘
           │
           ▼
Core Backend executes ReportService & Prisma Transaction:
  - Creates CitizenReport
  - Correlates or Forms Canonical Incident
  - Embeds AI metadata (provider, confidence, fallback flag, factors)
  - Records Timeline Event
           │
           ▼
Operator Reviews Dossier:
  - Inspects AI Confidence & Explanations
  - Confirms or Overrides Priority
  - Dispatches Municipal Squad & Designated Worker
           │
           ▼
Field Worker Executes 5-Stage Task & Uploads Base64 Camera Evidence
           │
           ▼
Core Backend calls AI Engine (/verify) with Before & After Images
           │
           ▼
Operator Verification Gate:
  - Reviews Worker After-Photo + AI Verification Hint
  - Human Operator Clicks Approve / Reject
           │
           ▼
Incident Closed → Citizen Tracks & Submits Feedback
```

---

## SECTION 16: FILES THAT MAY EVENTUALLY NEED CHANGES (WHEN AI ARRIVES)

### A. Backend Files:
1. **`src/lib/services/ReportService.ts`**: Add hook to invoke AI Service Adapter for complaint analysis and duplicate detection.
2. **`src/lib/repositories/PrismaCivicRepository.ts`**: Enrich `aiExplanationJson` with AI Engine metadata (`provider`, `model`, `fallback`).
3. **`src/lib/config.ts`**: Add `AI_ENGINE_BASE_URL` (default: `http://127.0.0.1:8000`) and `AI_REQUEST_TIMEOUT_MS` (default: `4000`).
4. **[NEW FILE] `src/lib/ai/aiEngineClient.ts`**: Strongly typed HTTP adapter communicating with Project B at `127.0.0.1:8001`.

### B. Frontend Files:
1. **`src/components/dossier/IntelligenceExplanation.tsx`**: Display provider tag (e.g. `Gemini 1.5 Pro` vs `Deterministic Fallback`) and latency (`execution_time_ms`).
2. **`src/components/dossier/OperationalResponsePanel.tsx`**: Render AI resolution verification card during supervisor sign-off.

### C. Database Models / Migrations:
- **Zero breaking changes needed!** The existing `Incident.aiExplanationJson` and `CitizenReport.embeddingJson` fields can immediately store the rich JSON metadata from Project B without schema alterations.

### D. Configuration Files:
- **`.env`**: Add `AI_ENGINE_URL="http://127.0.0.1:8000"`.

---

## SECTION 17: FILES THAT MUST NOT BE TOUCHED

These files represent the core operational foundation and must remain strictly untouched during AI integration:
1. `src/lib/auth/index.ts` (Authentication, session tokens, passwords, RBAC guards).
2. `src/app/api/auth/**` (Login/Logout/Me route handlers).
3. `src/components/field/NextActionPanel.tsx` (Native camera capture, Base64 converter, 5-stage task actions).
4. `src/app/api/incidents/[id]/assign/route.ts` (Atomic squad dispatch logic).
5. `src/app/api/incidents/[id]/verify/route.ts` (Supervisor verification sign-off).
6. `src/app/api/incidents/[id]/feedback/route.ts` (Citizen feedback and reopening gate).
7. `src/app/api/tasks/[id]/route.ts` (Field task advancement and evidence requirements).
8. `scripts/test-phase1-canonical-workflow.js` & `scripts/test-phase2-regression-certification.js` (Standard regression benchmarks).

---

## SECTION 18: RISKS & MITIGATION MATRIX

| Risk Factor | Impact | Mitigation Strategy in Main Project |
|:---|:---|:---|
| **AI Engine Offline / Unreachable** | High if blocking | **Non-blocking try/catch**: If HTTP call to `127.0.0.1:8001` fails or times out (>3.5s), backend immediately falls back to internal heuristics without failing report submission. |
| **Gemini Quota Exhaustion** | Medium | AI Engine metadata includes `fallback: true`. Core Backend flags this transparently in the dossier so operators know heuristic rules were applied. |
| **Image URL vs Base64 Payload** | Medium | The AI Engine expects `image_url`. For Base64 images captured via camera, the adapter should either provide local static file streaming or pass the data URL cleanly. |
| **False Positive Duplicate Match** | Critical | AI duplicate score is advisory. Threshold set to `>= 0.78` for automatic grouping, with manual unmerge option for operators. |
| **AI Verification False Approval** | Critical | **Human-in-the-loop**: The AI Engine's `/verify` endpoint only generates an *opinion*; it can NEVER close an incident autonomously. |

---

## SECTION 19: INTEGRATION ROADMAP

- **PHASE A (Completed)**: Audit Main CivicPulse architecture and data flow.
- **PHASE B**: Audit AI Engine endpoints and request/response payloads side-by-side.
- **PHASE C**: Define `AIEngineClient` adapter contract with strict 3500ms timeout and fallback mechanisms.
- **PHASE D**: Create integration branch or isolated module.
- **PHASE E**: Connect Core Backend (`ReportService.ts` & `verifyIncident`) to AI Engine.
- **PHASE F**: Update dossier and intake UI to render AI explanations and provider badges.
- **PHASE G**: Remove/replace interim mock factors with live AI Engine telemetry.
- **PHASE H**: Run end-to-end regression tests to verify zero regressions in non-AI workflows.
- **PHASE I**: Final Smart India Hackathon grand finale rehearsal.

================================================================================
AUDIT COMPLETE. FILE CREATED: CIVICPULSE_MAIN_ARCHITECTURE_AUDIT.md
================================================================================


