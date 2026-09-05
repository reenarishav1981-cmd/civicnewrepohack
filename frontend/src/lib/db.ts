import { 
  CitizenReport, 
  Incident, 
  FieldTeam, 
  FieldTask, 
  SignalRelationship, 
  User 
} from "../types";
import { generateCivicEmbedding } from "./ai/embeddings";
import { evaluateIncidentPriority } from "./ai/priorityEngine";

export interface ActivityLog {
  id: string;
  time: string;
  type: 'SIGNAL_RECEIVED' | 'SIGNAL_CORRELATED' | 'PRIORITY_ESCALATED' | 'TEAM_ASSIGNED' | 'WORK_STARTED' | 'EVIDENCE_UPLOADED' | 'RESOLVED';
  title: string;
  description: string;
  actor: string;
  incidentId?: string;
}

// Deterministic bcrypt hash for dev/demo password: "CivicPulse2026!"
const DEMO_PASSWORD_HASH = "$2b$10$ZnlugHxKmwoKcxUg4AgdQe/n8LecMSYjxymVOU1NBybnjANcmUn42";

// Initial Realistic Seed Dataset
const SEED_USERS: (User & { passwordHash?: string })[] = [
  { id: "usr-1", name: "Aarav Sharma", role: "citizen", email: "citizen@civicpulse.gov.in", phone: "+91 98765 43210", passwordHash: DEMO_PASSWORD_HASH },
  { id: "usr-2", name: "Pooja Patel", role: "citizen", email: "pooja@civicpulse.gov.in", phone: "+91 98221 11223", passwordHash: DEMO_PASSWORD_HASH },
  { id: "usr-3", name: "Vikram Mehta", role: "operator", email: "ops.lead@civicpulse.gov.in", passwordHash: DEMO_PASSWORD_HASH },
  { id: "usr-4", name: "Rajesh Kumar", role: "worker", email: "worker@civicpulse.gov.in", phone: "+91 97112 33445", avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop", passwordHash: DEMO_PASSWORD_HASH },
  { id: "usr-admin", name: "Dr. Anita Desai", role: "admin", email: "admin@civicpulse.gov.in", phone: "+91 98000 00001", passwordHash: DEMO_PASSWORD_HASH },
];

const SEED_TEAMS: FieldTeam[] = [
  {
    id: "team-alpha",
    name: "Road Maintenance Alpha",
    department: "Public Works Department (PWD)",
    leaderName: "Rajesh Kumar",
    phone: "+91 97112 33445",
    specialization: "Pothole Patching, Asphalt Laying, Road Safety",
    status: "dispatched",
    activeIncidentId: "CP-1024",
    currentLatitude: 21.1710,
    currentLongitude: 72.8318,
    rating: 4.9,
    tasksCompleted: 142
  },
  {
    id: "team-beta",
    name: "Hydraulic & Drainage Squad 3",
    department: "Water Supply & Sewerage Board",
    leaderName: "Sunil Deshmukh",
    phone: "+91 98220 99887",
    specialization: "Pipeline Bursts, Gutter Cleansing, High Pressure Suction",
    status: "busy",
    activeIncidentId: "CP-1019",
    currentLatitude: 21.1760,
    currentLongitude: 72.8245,
    rating: 4.8,
    tasksCompleted: 98
  },
  {
    id: "team-gamma",
    name: "Electrical Grid Response Unit",
    department: "Electricity Distribution Co.",
    leaderName: "Manoj Verma",
    phone: "+91 98110 55443",
    specialization: "High Voltage Cables, Transformer Repair, Streetlights",
    status: "available",
    currentLatitude: 21.1825,
    currentLongitude: 72.8395,
    rating: 4.7,
    tasksCompleted: 210
  },
  {
    id: "team-delta",
    name: "Sanitation Rapid Force",
    department: "Municipal Solid Waste Dept",
    leaderName: "Kiran Rane",
    phone: "+91 97654 11223",
    specialization: "Debris Removal, Illegal Dumps, Heavy Machinery Clearance",
    status: "available",
    currentLatitude: 21.1645,
    currentLongitude: 72.8455,
    rating: 4.9,
    tasksCompleted: 185
  }
];

const SEED_INCIDENTS: Incident[] = [
  {
    id: "CP-1024",
    title: "Severe Road Hazard & Multiple Craters Near ABC School",
    category: "Road Hazard",
    priority: "critical",
    priorityScore: 92,
    priorityReason: "CRITICAL PRIORITY (92/100) — Mass Citizen Escalation (18 connected signals) + School Zone Hazard",
    status: "in_progress",
    latitude: 21.1702,
    longitude: 72.8311,
    address: "Opp. St. Xavier's Model High School, Main University Road, Sector 3",
    zone: "Sector 3, North Corridor",
    affectedCitizenEstimate: 2400,
    connectedReportsCount: 18,
    aiConfidence: 0.94,
    aiExplanations: [
      {
        title: "High Semantic Text Correlation",
        detail: "18 independent citizen descriptions share 91% semantic similarity on road cratering and accident risks.",
        confidence: 0.94,
        badge: "Semantic 91%"
      },
      {
        title: "Tight Geospatial Cluster",
        detail: "All signals originate within a 350-meter radius around the school crossing zone.",
        confidence: 0.96,
        badge: "Within 350m"
      },
      {
        title: "School Vulnerability Zone",
        detail: "Located within 120m of St. Xavier's High School gate. High pedestrian and school bus density.",
        confidence: 0.98,
        badge: "School Zone"
      },
      {
        title: "Accident Hazard Frequency",
        detail: "5 reports explicitly cited two-wheeler skids and near-miss collisions during morning peak hours.",
        confidence: 0.92,
        badge: "Safety Risk"
      }
    ],
    assignedTeamId: "team-alpha",
    assignedTeamName: "Road Maintenance Alpha",
    beforeEvidenceUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop",
    afterEvidenceUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop",
    timeline: [
      { id: "tl-1", time: "08:15 AM", title: "First Citizen Signal Received", description: "Reported: 'Huge pothole outside school gate causing traffic jam'", type: "signal_received", actor: "Citizen A. Sharma" },
      { id: "tl-2", time: "08:35 AM", title: "AI Detected 5 Correlated Signals", description: "Semantic similarity 88% detected across 5 new incoming reports in Sector 3", type: "ai_correlated", actor: "CivicPulse AI Engine" },
      { id: "tl-3", time: "09:00 AM", title: "Incident CP-1024 Created", description: "Cluster upgraded to unified incident with 11 connected signals", type: "ai_correlated", actor: "CivicPulse AI Engine" },
      { id: "tl-4", time: "09:40 AM", title: "Priority Escalated to CRITICAL", description: "Report count exceeded 15 with 2 reports citing two-wheeler accidents", type: "priority_escalated", actor: "Priority Engine" },
      { id: "tl-5", time: "10:15 AM", title: "Field Team Assigned", description: "PWD Road Maintenance Alpha dispatched to site", type: "team_assigned", actor: "Operator V. Mehta" },
      { id: "tl-6", time: "11:00 AM", title: "Team Arrived on Site", description: "Site inspection started. Heavy machinery and cold mix asphalt en route.", type: "worker_arrived", actor: "Rajesh Kumar (Field Lead)" },
      { id: "tl-7", time: "11:30 AM", title: "Patching Work in Progress", description: "Excavation and compaction of 3 major craters underway.", type: "work_started", actor: "Road Maintenance Alpha" }
    ],
    createdAt: "2026-09-01T08:15:00.000Z",
    updatedAt: "2026-09-01T11:30:00.000Z"
  },
  {
    id: "CP-1019",
    title: "Major Drinking Water Pipeline Rupture & Flooding",
    category: "Water Leakage",
    priority: "high",
    priorityScore: 78,
    priorityReason: "HIGH PRIORITY (78/100) — Potable water wastage and road waterlogging in residential lane",
    status: "assigned",
    latitude: 21.1755,
    longitude: 72.8250,
    address: "Lane 4, Near Civil Hospital Doctors Quarters, Sector 2",
    zone: "Sector 2, West Enclave",
    affectedCitizenEstimate: 1200,
    connectedReportsCount: 7,
    aiConfidence: 0.89,
    aiExplanations: [
      {
        title: "High Semantic Text Similarity",
        detail: "7 reports describe continuous water gushing from underground line near hospital corner.",
        confidence: 0.89,
        badge: "Semantic 89%"
      },
      {
        title: "Proximity to Civil Hospital",
        detail: "Underground main feeds emergency block water reserve.",
        confidence: 0.95,
        badge: "Hospital Main"
      }
    ],
    assignedTeamId: "team-beta",
    assignedTeamName: "Hydraulic & Drainage Squad 3",
    beforeEvidenceUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop",
    timeline: [
      { id: "tl-20", time: "06:45 AM", title: "First Signal Received", description: "Water gushing out from pavement near Doctor's quarters", type: "signal_received" },
      { id: "tl-21", time: "07:15 AM", title: "AI Connected 7 Reports", description: "Correlated 7 signals into CP-1019 with 89% confidence", type: "ai_correlated" },
      { id: "tl-22", time: "08:00 AM", title: "Team Dispatched", description: "Hydraulic Squad 3 assigned to shut isolation valves", type: "team_assigned" }
    ],
    createdAt: "2026-09-01T06:45:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z"
  },
  {
    id: "CP-0991",
    title: "Overflowing Drainage Line & Gutter Cleared",
    category: "Drainage & Sewage",
    priority: "medium",
    priorityScore: 48,
    priorityReason: "RESOLVED (48/100) — Gutter cleared and desilted successfully",
    status: "resolved",
    latitude: 21.1640,
    longitude: 72.8450,
    address: "Behind APMC Market, Hazira Link Road",
    zone: "Hazira Corridor",
    affectedCitizenEstimate: 850,
    connectedReportsCount: 6,
    aiConfidence: 0.92,
    aiExplanations: [
      {
        title: "Drainage Blockage Correlated",
        detail: "6 citizen signals verified at exact storm drain choke point.",
        confidence: 0.92
      }
    ],
    assignedTeamId: "team-beta",
    assignedTeamName: "Hydraulic & Drainage Squad 3",
    beforeEvidenceUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop",
    afterEvidenceUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop",
    timeline: [
      { id: "tl-30", time: "Yesterday 02:00 PM", title: "Reports Connected", description: "6 complaints of sewage overflow resolved into CP-0991", type: "ai_correlated" },
      { id: "tl-31", time: "Yesterday 04:30 PM", title: "Suction Cleansing Completed", description: "Drain blockage cleared and disinfected with lime powder", type: "work_started" },
      { id: "tl-32", time: "Yesterday 06:00 PM", title: "Verified & Resolved", description: "Before/After evidence verified by Operations Controller", type: "resolved" }
    ],
    createdAt: "2026-08-31T14:00:00.000Z",
    updatedAt: "2026-08-31T18:00:00.000Z"
  },
  {
    id: "CP-1033",
    title: "Streetlight Circuit Darkness on Ring Road Flyover",
    category: "Streetlight & Power",
    priority: "medium",
    priorityScore: 52,
    priorityReason: "MEDIUM PRIORITY (52/100) — 8 consecutive streetlight poles dark on curved flyover",
    status: "new",
    latitude: 21.1820,
    longitude: 72.8390,
    address: "Ring Road Flyover, Northbound Ramp towards Intermodal Hub",
    zone: "Central Ring Corridor",
    affectedCitizenEstimate: 3500,
    connectedReportsCount: 4,
    aiConfidence: 0.86,
    aiExplanations: [
      {
        title: "Electrical Grid Loop Failure",
        detail: "4 driver reports along flyover curve indicate phase trip.",
        confidence: 0.86
      }
    ],
    beforeEvidenceUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop",
    timeline: [
      { id: "tl-40", time: "09:30 AM", title: "Cluster Formed", description: "4 night drivers reported dark flyover stretch", type: "signal_received" }
    ],
    createdAt: "2026-09-01T09:30:00.000Z",
    updatedAt: "2026-09-01T09:30:00.000Z"
  }
];

const SEED_REPORTS: CitizenReport[] = [
  {
    id: "R-8801",
    userId: "usr-1",
    userName: "Aarav Sharma",
    userPhone: "+91 98765 43210",
    incidentId: "CP-1024",
    description: "Huge crater pothole right outside St. Xavier's School gate. School buses getting jammed.",
    category: "Road Hazard",
    latitude: 21.1702,
    longitude: 72.8311,
    address: "Opp. St. Xavier's Model High School, Sector 3",
    mediaUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
    status: "assigned",
    createdAt: "2026-09-01T08:15:00.000Z"
  },
  {
    id: "R-8802",
    userId: "usr-2",
    userName: "Pooja Patel",
    userPhone: "+91 98221 11223",
    incidentId: "CP-1024",
    description: "Road damaged and broken near school. Water is collecting inside deep potholes.",
    category: "Road Hazard",
    latitude: 21.1705,
    longitude: 72.8314,
    address: "Near St. Xavier's Bus Stop, Sector 3",
    status: "assigned",
    createdAt: "2026-09-01T08:22:00.000Z"
  },
  {
    id: "R-8803",
    userId: "usr-1",
    userName: "Mehul Chokshi",
    userPhone: "+91 98990 12345",
    incidentId: "CP-1024",
    description: "Bike slipped this morning due to big pothole near school crossing. Very dangerous for children!",
    category: "Road Hazard",
    latitude: 21.1699,
    longitude: 72.8308,
    address: "School Crossing Junction, Sector 3",
    status: "assigned",
    createdAt: "2026-09-01T08:45:00.000Z"
  },
  {
    id: "R-8804",
    userId: "usr-2",
    userName: "Sneha Kapadia",
    userPhone: "+91 97223 99881",
    incidentId: "CP-1024",
    description: "Dangerous deep hole on road tarmac outside school. Traffic is crawling.",
    category: "Road Hazard",
    latitude: 21.1704,
    longitude: 72.8310,
    address: "Main University Road, Sector 3",
    status: "assigned",
    createdAt: "2026-09-01T09:10:00.000Z"
  },
  {
    id: "R-8805",
    userId: "usr-1",
    userName: "Hardik Desai",
    userPhone: "+91 98450 77665",
    incidentId: "CP-1019",
    description: "Drinking water pipe burst near Civil Hospital quarters. Gallons of clean water wasting.",
    category: "Water Leakage",
    latitude: 21.1755,
    longitude: 72.8250,
    address: "Lane 4, Civil Hospital Quarters, Sector 2",
    status: "assigned",
    createdAt: "2026-09-01T06:45:00.000Z"
  }
];

const SEED_TASKS: FieldTask[] = [
  {
    id: "TSK-501",
    incidentId: "CP-1024",
    teamId: "team-alpha",
    workerName: "Rajesh Kumar",
    assignedWorkerId: "usr-4",
    status: "in_progress",
    priority: "critical",
    instructions: "Excavate loose asphalt around 3 major potholes near St. Xavier's gate. Apply rapid cold-mix bitumen and compact with road roller. Restore smooth traffic flow.",
    siteAddress: "Opp. St. Xavier's Model High School, Main University Road, Sector 3",
    latitude: 21.1702,
    longitude: 72.8311,
    distanceKm: 0.8,
    beforePhotoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop",
    assignedAt: "2026-09-01T10:15:00.000Z",
    startedAt: "2026-09-01T11:30:00.000Z",
    workerNotes: "Compacting second crater with 5-ton roller. Patching expected to finish within 45 minutes."
  }
];

const SEED_ACTIVITY: ActivityLog[] = [
  { id: "act-1", time: "11:30 AM", type: "WORK_STARTED", title: "Work in Progress", description: "Road Maintenance Alpha commenced asphalt compaction for CP-1024", actor: "Rajesh Kumar", incidentId: "CP-1024" },
  { id: "act-2", time: "10:15 AM", type: "TEAM_ASSIGNED", title: "Team Dispatched", description: "Road Maintenance Alpha assigned to CP-1024 (18 connected signals)", actor: "Ops Control", incidentId: "CP-1024" },
  { id: "act-3", time: "09:40 AM", type: "PRIORITY_ESCALATED", title: "Priority Escalated", description: "CP-1024 escalated to CRITICAL due to school zone and 18 signals", actor: "AI Priority Engine", incidentId: "CP-1024" },
  { id: "act-4", time: "09:00 AM", type: "SIGNAL_CORRELATED", title: "Incident Formed", description: "11 scattered signals correlated into unified incident CP-1024", actor: "AI Correlation Engine", incidentId: "CP-1024" },
  { id: "act-5", time: "08:00 AM", type: "TEAM_ASSIGNED", title: "Hydraulic Squad Dispatched", description: "Team dispatched for pipeline burst CP-1019 near Civil Hospital", actor: "Ops Control", incidentId: "CP-1019" },
  { id: "act-6", time: "Yesterday", type: "RESOLVED", title: "Incident CP-0991 Resolved", description: "Drainage cleared and verified with before/after photos", actor: "Ops Control", incidentId: "CP-0991" }
];

// In-Memory Persistent Store with Singleton State
class CivicPulseDatabase {
  private users: User[] = [...SEED_USERS];
  private teams: FieldTeam[] = [...SEED_TEAMS];
  private incidents: Incident[] = [...SEED_INCIDENTS];
  private reports: CitizenReport[] = [...SEED_REPORTS];
  private tasks: FieldTask[] = [...SEED_TASKS];
  private activityLogs: ActivityLog[] = [...SEED_ACTIVITY];

  // Users
  getUsers(): User[] { return this.users; }
  getUserById(id: string): User | undefined { return this.users.find(u => u.id === id); }
  getUserByEmail(email: string): (User & { passwordHash?: string | null }) | undefined {
    return this.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  }
  createUser(user: User & { passwordHash?: string | null }): User {
    this.users.push(user);
    return user;
  }

  // Reports
  getReports(): CitizenReport[] { return [...this.reports].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  getReportsByIncidentId(incidentId: string): CitizenReport[] { return this.reports.filter(r => r.incidentId === incidentId); }
  getReportById(id: string): CitizenReport | undefined { return this.reports.find(r => r.id === id); }
  
  addReport(report: CitizenReport): CitizenReport {
    this.reports.unshift(report);
    this.addActivityLog({
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'SIGNAL_RECEIVED',
      title: 'New Civic Signal',
      description: `Report ${report.id} received: "${report.description.slice(0, 45)}..."`,
      actor: report.userName || 'Citizen',
      incidentId: report.incidentId
    });
    return report;
  }

  // Incidents
  getIncidents(): Incident[] { return [...this.incidents].sort((a,b) => b.priorityScore - a.priorityScore); }
  getIncidentById(id: string): Incident | undefined { return this.incidents.find(i => i.id === id); }
  
  createIncident(incident: Incident): Incident {
    this.incidents.unshift(incident);
    this.addActivityLog({
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'SIGNAL_CORRELATED',
      title: 'Incident Formed',
      description: `AI created new incident ${incident.id} (${incident.title})`,
      actor: 'AI Correlation Engine',
      incidentId: incident.id
    });
    return incident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const idx = this.incidents.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.incidents[idx] = { ...this.incidents[idx], ...updates, updatedAt: new Date().toISOString() };
    return this.incidents[idx];
  }

  connectReportToIncident(reportId: string, incidentId: string): void {
    const report = this.reports.find(r => r.id === reportId);
    const incident = this.incidents.find(i => i.id === incidentId);
    if (report && incident) {
      report.incidentId = incidentId;
      report.status = 'correlated';
      
      const newCount = incident.connectedReportsCount + 1;
      const priorityEval = evaluateIncidentPriority(
        incident.title,
        incident.category,
        newCount,
        incident.latitude,
        incident.longitude
      );

      this.updateIncident(incidentId, {
        connectedReportsCount: newCount,
        priority: priorityEval.priority,
        priorityScore: priorityEval.score,
        priorityReason: priorityEval.reasonSummary
      });

      this.addActivityLog({
        id: `act-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'SIGNAL_CORRELATED',
        title: 'Signal Correlated',
        description: `Signal ${reportId} merged into ${incidentId} (Total: ${newCount} signals)`,
        actor: 'AI Correlation Engine',
        incidentId
      });
    }
  }

  // Teams
  getTeams(): FieldTeam[] { return this.teams; }
  getTeamById(id: string): FieldTeam | undefined { return this.teams.find(t => t.id === id); }
  
  updateTeam(id: string, updates: Partial<FieldTeam>): FieldTeam | undefined {
    const idx = this.teams.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.teams[idx] = { ...this.teams[idx], ...updates };
    return this.teams[idx];
  }

  // Tasks
  getTasks(): FieldTask[] { return this.tasks; }
  getTaskById(id: string): FieldTask | undefined { return this.tasks.find(t => t.id === id); }
  getTasksByTeamId(teamId: string): FieldTask[] { return this.tasks.filter(t => t.teamId === teamId); }
  
  createTask(task: FieldTask): FieldTask {
    this.tasks.unshift(task);
    this.addActivityLog({
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'TEAM_ASSIGNED',
      title: 'Task Dispatched',
      description: `Dispatched ${task.workerName} for incident ${task.incidentId}`,
      actor: 'Operations Control',
      incidentId: task.incidentId
    });
    return task;
  }

  updateTask(id: string, updates: Partial<FieldTask>): FieldTask | undefined {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.tasks[idx] = { ...this.tasks[idx], ...updates };
    return this.tasks[idx];
  }

  // Activity
  getActivityLogs(): ActivityLog[] { return this.activityLogs; }
  addActivityLog(log: ActivityLog): void {
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > 50) this.activityLogs.pop();
  }
}

// Global Singleton instance
const globalForDb = global as unknown as { civicDb: CivicPulseDatabase };
export const db = globalForDb.civicDb || new CivicPulseDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.civicDb = db;
