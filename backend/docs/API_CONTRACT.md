# CivicPulse Core Backend API Contract (v1)

This document specifies the complete REST API contract exposed by the CivicPulse Core Backend (`http://localhost:8000/api/v1`).
The Core Backend is the **single public API boundary** for all frontend applications (current React 18 modular UMD client or any future Next.js / Mobile client).

No frontend should contain business logic, direct MongoDB access, AI Engine calls, or duplicate calculation. All interactions flow through this documented contract.

---

## 1. General Principles

- **Base URL**: `http://localhost:8000/api/v1`
- **Content-Type**: `application/json` (except file uploads, which use `multipart/form-data`)
- **Authentication**: Bearer JWT token in the `Authorization` header: `Authorization: Bearer <access_token>`
- **CORS**: Enabled for all origins during development (`http://localhost:3000`, `http://127.0.0.1:3000`)
- **Standard Error Response**:
  ```json
  {
    "detail": "Human-readable error description"
  }
  ```

---

## 2. Domain Enums

### User Roles
- `CITIZEN`
- `AUTHORITY`
- `FIELD_WORKER`
- `ADMIN`

### Incident Status
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `DISMISSED`
- `MERGED`

### Priority Levels
- `P0` (Critical - immediate public safety danger)
- `P1` (High - emerging disruption, high density)
- `P2` (Moderate / Normal)

### Field Task Status (Strict State Machine)
- `ASSIGNED` -> `ACCEPTED` -> `ARRIVED` -> `IN_PROGRESS` -> `COMPLETED`
- On completion, triggers resolution verification: `AI_VERIFIED` or `MANUAL_REVIEW`.

---

## 3. Endpoints Specification

### 3.1 Authentication (`/auth`)

#### `POST /auth/register`
Registers a new citizen account. (Only CITIZEN registration is permitted via public endpoint).
- **Request Body**:
  ```json
  {
    "email": "citizen@example.com",
    "password": "Password123!",
    "full_name": "Aarav Sharma",
    "phone": "+91-9876543210"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "user_id": "USR-0001",
      "email": "citizen@example.com",
      "full_name": "Aarav Sharma",
      "role": "CITIZEN"
    }
  }
  ```

#### `POST /auth/login`
Authenticates any registered user.
- **Request Body**:
  ```json
  {
    "email": "authority@civicpulse.org",
    "password": "AuthorityPass123!"
  }
  ```
- **Response** (`200 OK`): Same structure as register response.

#### `GET /auth/me`
Retrieves current authenticated user profile.
- **Header**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): User object.

#### `POST /auth/refresh`
Refreshes access token for authenticated session.
- **Header**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): `{ "access_token": "...", "token_type": "bearer" }`

---

### 3.2 Reports Ingestion (`/reports`)

#### `POST /reports`
Submits a citizen report. Supports either `application/json` or `multipart/form-data` with attached photos/videos.
- **Form Fields (Multipart)**:
  - `category` (string, required): e.g. "Road", "Streetlight", "Garbage", "Water"
  - `description` (string, optional): Text complaint (multilingual Hindi/English/Hinglish supported)
  - `latitude` (float, optional): GPS / Map Pin coordinate
  - `longitude` (float, optional): GPS / Map Pin coordinate
  - `location_name` (string, optional): Landmark or neighborhood name
  - `files` (file[], optional): Uploaded image or video files (EXIF GPS is automatically parsed)
- **Response** (`201 Created`):
  ```json
  {
    "report_id": "REP-1001",
    "incident_id": "CP-1024",
    "is_duplicate": true,
    "duplicate_score": 0.89,
    "category": "Road",
    "priority": "P0",
    "status": "OPEN",
    "ai_analysis": {
      "category": "Road",
      "confidence": 0.91,
      "severity": "P0",
      "summary": "Severe pothole cluster with deep asphalt failure",
      "provider": "gemini"
    },
    "location": {
      "coordinates": [78.1828, 26.2183],
      "source": "EXIF",
      "address": "Jhansi Road Junction"
    },
    "created_at": "2026-09-04T07:15:00Z"
  }
  ```

#### `GET /reports/my`
Lists reports submitted by the authenticated citizen.
- **Header**: `Authorization: Bearer <token>`
- **Query Params**: `skip=0`, `limit=20`
- **Response** (`200 OK`): Array of report objects.

#### `GET /reports/{id}/preview`
Returns AI analysis preview without saving to database.

---

### 3.3 Incidents Management (`/incidents`)

#### `GET /incidents`
Lists clustered incidents with search, status, category, and priority filters.
- **Query Params**:
  - `status`: Filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`)
  - `category`: Filter by category (`Road`, `Streetlight`, etc.)
  - `priority`: Filter by priority (`P0`, `P1`, `P2`)
  - `q`: Search keyword across title and location
  - `skip`: Offset (default 0)
  - `limit`: Page size (default 50)
- **Response** (`200 OK`):
  ```json
  [
    {
      "incident_id": "CP-1024",
      "title": "Severe Pothole Cluster near Jhansi Rd",
      "category": "Road",
      "priority": "P0",
      "status": "OPEN",
      "report_count": 4,
      "location": {
        "coordinates": [78.1828, 26.2183],
        "address": "Jhansi Rd Junction"
      },
      "assigned_team": "TEAM-ROAD-01",
      "created_at": "2026-08-10T10:00:00Z",
      "updated_at": "2026-09-04T07:15:00Z"
    }
  ]
  ```

#### `GET /incidents/{id}`
Returns full details for a single incident, including risk factors and timeline.

#### `GET /incidents/{id}/reports`
Returns all underlying citizen reports merged into this incident cluster.

#### `POST /incidents/{id}/assign`
Assigns a field team to the incident and automatically generates a field task.
- **Role Required**: `AUTHORITY` or `ADMIN`
- **Request Body**:
  ```json
  {
    "team_id": "TEAM-ROAD-01"
  }
  ```
- **Response** (`200 OK`): Updated incident with created `task_id`.

#### `POST /incidents/{id}/review`
Overrides or validates incident status/priority with mandatory audit log recording.
- **Role Required**: `AUTHORITY` or `ADMIN`
- **Request Body**:
  ```json
  {
    "override_status": "RESOLVED",
    "override_priority": "P1",
    "note": "Inspected and confirmed resolved by ward officer"
  }
  ```
- **Response** (`200 OK`): Updated incident and audit entry.

#### `POST /incidents/merge`
Explicitly merges two incidents (source merged into target).
- **Role Required**: `AUTHORITY` or `ADMIN`
- **Request Body**:
  ```json
  {
    "source_id": "CP-1025",
    "target_id": "CP-1024",
    "reason": "Duplicate reports for the same intersection"
  }
  ```

---

### 3.4 Authority Dashboard (`/authority`)

#### `GET /authority/dashboard`
Returns high-level operational statistics:
- Active count, Critical (P0) count, Emerging (P1) count, Resolved count.
- Recent high-priority incidents queue.

#### `GET /authority/teams`
Lists all municipal field response teams with specialization and current active task load.

---

### 3.5 Field Operations (`/field`)

#### `GET /field/tasks`
Lists tasks assigned to the authenticated field worker or team.
- **Role Required**: `FIELD_WORKER` or `AUTHORITY`
- **Query Params**: `status` (optional)

#### `GET /field/tasks/{taskId}`
Returns full task details, including location, incident description, and evidence history.

#### `PATCH /field/tasks/{taskId}/status`
Transitions task through the lifecycle state machine.
- **Request Body**:
  ```json
  {
    "status": "ARRIVED",
    "note": "Crew arrived on site with patch truck"
  }
  ```

#### `POST /field/tasks/{taskId}/evidence`
Uploads post-repair photos or completion evidence (`multipart/form-data`).

---

### 3.6 Analytics & AI Quality (`/analytics` & `/evaluation`)

#### `GET /analytics/ai-quality`
Returns ground-truth measured quality metrics computed strictly from benchmark evaluation runs.
- **Response** (`200 OK`):
  ```json
  {
    "evaluation_status": "completed",
    "dataset_version": "v1.0",
    "sample_count": 36,
    "classification": {
      "accuracy": 0.528,
      "macro_f1": 0.540,
      "per_class": { ... },
      "languages": { "en": 0.583, "hi": 0.417, "hinglish": 0.583 }
    },
    "duplicate_detection": {
      "pairs_count": 24,
      "calibrated_threshold": 0.85
    },
    "calibration": {
      "default_threshold": 0.70,
      "calibrated_threshold": 0.85,
      "calibration_status": "calibrated",
      "false_merge_penalty": 3.0
    },
    "human_review": {
      "total_reviewed": 12,
      "overrides_count": 1,
      "override_rate_pct": 8.3
    },
    "notes": [
      "Evaluation benchmark dataset size: 36 samples",
      "Metrics computed strictly against ground-truth labelled JSONL files."
    ]
  }
  ```

#### `GET /analytics/summary`
Returns incident volume over time, category distributions, and signal compression ratios.

---

### 3.7 Health Check (`/health`)

#### `GET /health`
Returns system status including MongoDB connection state and AI Engine connectivity:
```json
{
  "status": "healthy",
  "ai_engine": "connected",
  "database": "connected",
  "timestamp": "2026-09-04T07:15:00Z"
}
```
