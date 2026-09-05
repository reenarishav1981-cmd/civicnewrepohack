# CivicPulse

> **CivicPulse converts scattered citizen observations into verified, actionable civic incidents—and closes the loop from evidence to resolution.**

---

## 1. Problem
Traditional civic complaint and grievance redressal systems create duplicate tickets, fragmented information, and administrative bottlenecks. When ten citizens report the same road crater, municipal departments receive ten disconnected complaints, dispatch uncoordinated inspection crews, and leave citizens without transparent resolution progress.

## 2. Solution
CivicPulse introduces a multi-signal municipal intelligence platform that continuously consolidates incoming citizen reports into **canonical civic incidents**. 

The end-to-end platform provides:
* **AI-assisted Triage**: Automated categorization, severity scoring (1–5), and urgency classification.
* **Incident Deduplication & Correlation**: Multi-signal spatial clustering and semantic text similarity to prevent duplicate municipal tickets.
* **Dynamic Priority Engine**: Formulaic prioritization factoring in severity, vulnerable locations (schools, hospitals), and report density.
* **Operations Command Center**: High-resolution spatial dispatch interface with a 3D living digital twin of the city.
* **Field Worker Hub**: Mobile-first field queue with state-machine task progression and mandatory photographic proof of completion.
* **Evidence-Based Verification**: Dedicated municipal quality sign-off before case closure.
* **Public Transparency Tracker**: Live public 6-stage lifecycle tracking for citizens.

---

## 3. Core Concept: REPORT ≠ INCIDENT

A foundational axiom of CivicPulse is the strict separation between a **Citizen Report** and a **Canonical Incident**:

$$\text{Multiple Citizen Reports} \xrightarrow{\text{Spatial + Semantic Fusion}} \mathbf{One\ Canonical\ Incident}$$

* **Citizen Report (`R-XXXX`)**: An individual citizen observation containing raw text, user contact details, GPS coordinates, and photographic evidence.
* **Canonical Incident (`CP-XXXX`)**: The authoritative municipal case file representing the underlying physical failure, aggregating all linked citizen signals, audit history, priority score, and assigned field squad.

---

## 4. Architecture

```
CITIZEN INPUT (Text + GPS + Image)
            ↓
   NEXT.JS 14 WEB APPLICATION (:3000)
   ├── Zod Schema Validation & RBAC
   ├── Prisma ORM & SQLite State Engine (dev.db)
   └── Route Handlers (/api/reports, /api/incidents, /api/track)
            ↓ (HTTP POST)
   FASTAPI AI ENGINE (:8001)
   ├── Complaint Understanding & Normalization
   ├── Multi-Signal Deduplication & Spatial Matching
   └── Dynamic Priority Attribution
            ↓ (Atomic Persistence)
   MUNICIPAL OPERATIONS COMMAND CENTER (/operations)
   ├── 3-Zone Spatial Workspace & Priority Queue Rail
   └── 3D City Spatial Twin (Three.js / React Three Fiber)
            ↓ (Squad Dispatch)
   FIELD WORKER HUB (/field)
   └── Task Execution & Completion Evidence Upload
            ↓ (Approval / Closure)
   OPERATIONAL VERIFICATION (/api/incidents/[id]/verify)
            ↓ (Live Synchronization)
   PUBLIC CITIZEN TRACKER (/track/[id])
```

### Technology Stack
* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
* **Spatial & 3D**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`.
* **Backend & API**: Next.js API Route Handlers, Zod Validation, JWT Session Auth.
* **Database**: Prisma ORM, SQLite (`prisma/dev.db`) with transactional concurrency controls.
* **AI Engine**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, Google GenAI SDK (`google-genai`).

---

## 5. AI Architecture & Transparency

CivicPulse implements an asynchronous, resilient two-tier triage architecture:

1. **Primary Integration Path**: Google Gemini (`gemini-3.6-flash`) via the official `google-genai` SDK in FastAPI, accepting text descriptions and binary image parts.
2. **Automated Deterministic Fallback**: If cloud AI services are unreachable or credentials experience rate limits / access denial, the engine automatically switches to a deterministic, rule-based heuristic classifier (`DeterministicFallbackProvider`).

> [!NOTE]
> **Honest Operational Disclosure**: In environments where the external Google GenAI project returns `403 PERMISSION_DENIED` or when running offline, CivicPulse operates on its deterministic fallback engine. In fallback mode, classification and prioritization are performed via deterministic text analysis and rule-based spatial gating. Pixel-level computer vision inference is only active when a live, unblocked multimodal provider key is connected.

---

## 6. Confirmed Application Routes

| Route | Purpose | Audience |
| :--- | :--- | :--- |
| **`/`** | Landing Page with 3D City Diorama & AI Core Showcase | Public |
| **`/citizen`** | Citizen Report Portal, Quick Scenarios & Live Preview | Citizens |
| **`/operations`** | Operations Command Center, Priority Rail & 3D Spatial Twin | Municipal Dispatchers |
| **`/operations/incidents/[id]`**| Full Incident Investigation Dossier & Case File Ledger | Senior Operators |
| **`/field`** | Field Worker Hub, Task Queue & Evidence Execution | Field Crews |
| **`/track/[id]`** | Real-Time Public 6-Stage Incident Lifecycle Tracker | Citizens & Observers |
| **`/executive`** | Executive Decision Cockpit & Department Performance | Municipal Leadership |
| **`/login`** | Role-Based Authentication Gateway & Quick Switcher | System Users |

---

## 7. Core API Endpoints

* `POST /api/reports`: Ingests citizen report, calls AI Engine, checks duplicates, and atomically creates or links incidents.
* `POST /api/reports/preview`: Real-time pre-submission correlation preview as the citizen types.
* `GET /api/incidents`: Lists canonical incidents with priority scores, status, and connected report counts.
* `GET /api/incidents/[id]`: Full case file dossier with linked reports, audit timeline, and AI reasoning factors.
* `POST /api/incidents/[id]/assign`: Dispatches a field team and assigns an authenticated field worker.
* `PATCH /api/tasks/[id]/status`: Advances field task state (`assigned` → `in_progress` → `completed`) with mandatory completion photo.
* `POST /api/incidents/[id]/verify`: Operator verification gate approving or rejecting completed field work.
* `GET /api/track/[id]`: Public transparency tracker returning lifecycle progression and before/after evidence.

---

## 8. Running Locally

### Prerequisites
* Node.js 18+ (Tested on Node.js 20 & 22)
* Python 3.11+
* npm

### Step 1: Install Dependencies
```bash
# Install frontend & core backend dependencies
npm install

# Setup Prisma SQLite client
npx prisma generate
```

### Step 2: Start the Python FastAPI AI Engine
```bash
# Navigate to the AI Engine directory
cd "civic pulse zip final/civic pulse"

# Run FastAPI with Uvicorn on Port 8001
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Step 3: Start the Next.js Application
In a separate terminal:
```bash
# From the repository root
npm run dev
```

The Next.js full-stack application will be live at `http://localhost:3000`.  
The FastAPI AI Engine documentation will be live at `http://127.0.0.1:8000/docs`.

---

## 9. Automated Testing & Verification

The repository includes test and audit suites in the `scripts/` directory:
* `scripts/test-duplicate-priority-controlled.js`: Verifies 150m spatial gating, category gating, and priority scoring.
* `scripts/test-phase1-canonical-workflow.js`: Verifies report intake, AI triage, and database persistence.
* `scripts/test-phase2-assignment-workflow.js`: Verifies squad dispatch and capacity locking.
* `scripts/test-phase3-field-workflow.js`: Verifies field worker execution and completion evidence enforcement.
* `scripts/test-phase4-citizen-tracking.js`: Verifies public tracking lifecycle transitions.
* `scripts/verify-ai-live.js`: Verifies FastAPI `/analyze/full` connectivity.

Run any test suite against the running local server:
```bash
node scripts/test-duplicate-priority-controlled.js
```

---

## 10. Project Provenance & Hackathon Baseline

The CivicPulse architectural foundation (core data models, full-stack Next.js scaffolding, and initial UI prototypes) was established as an existing baseline prior to the hackathon.

Hackathon-day engineering milestones—including FastAPI integration, dual-tier fallback resilience, live multi-signal deduplication gates, synchronized CP search, and end-to-end operational verification—are fully documented in [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md).
