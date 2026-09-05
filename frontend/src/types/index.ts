export type UserRole = 'citizen' | 'operator' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  teamId?: string;
  isAvailable?: boolean;
}

export type IssueCategory = 
  | 'Road Hazard' 
  | 'Water Leakage' 
  | 'Drainage & Sewage' 
  | 'Garbage & Sanitation' 
  | 'Streetlight & Power' 
  | 'Public Safety' 
  | 'Infrastructure';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus = 
  | 'new' 
  | 'under_review' 
  | 'assigned' 
  | 'in_progress' 
  | 'awaiting_verification' 
  | 'pending_verification'
  | 'reopen_requested'
  | 'resolved' 
  | 'closed';

export type ReportStatus = 'received' | 'correlated' | 'assigned' | 'in_progress' | 'awaiting_verification' | 'resolved';

export interface CitizenReport {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  incidentId?: string; // Connected incident ID if correlated
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  address: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  status: ReportStatus;
  source?: 'production' | 'demo' | 'simulation';
  createdAt: string;
  updatedAt?: string;
  embedding?: number[]; // Vector embedding
}

export interface AIExplanationFactor {
  title: string;
  detail: string;
  confidence: number;
  badge?: string;
}

export interface SignalRelationship {
  id: string;
  reportId: string;
  incidentId: string;
  semanticScore: number;
  geoDistanceMeters: number;
  timeDiffHours: number;
  overallConfidence: number;
  reasonSummary: string;
  createdAt: string;
}

export interface Incident {
  id: string; // e.g. "CP-1024"
  title: string;
  category: IssueCategory;
  priority: PriorityLevel;
  priorityScore: number; // 0 - 100
  priorityReason: string;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string;
  zone: string; // e.g. "Sector 4, North Ring"
  affectedCitizenEstimate: number;
  connectedReportsCount: number;
  aiConfidence: number; // e.g. 0.94 (94%)
  aiExplanations: AIExplanationFactor[];
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  source?: 'production' | 'demo' | 'simulation';
  beforeEvidenceUrl?: string;
  afterEvidenceUrl?: string;
  citizenFeedbackStatus?: string;
  citizenFeedbackNotes?: string;
  reopenedAt?: string;
  reopenedReason?: string;
  reopenedByCitizenId?: string;
  timeline: IncidentTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentTimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'signal_received' | 'ai_correlated' | 'priority_escalated' | 'team_assigned' | 'worker_arrived' | 'work_started' | 'evidence_uploaded' | 'resolved';
  actor?: string;
}

export interface FieldTeam {
  id: string;
  department: string;
  name: string;
  leaderId?: string;
  leaderName: string;
  phone: string;
  specialization: string;
  status: 'available' | 'dispatched' | 'busy' | 'off_duty';
  activeIncidentId?: string;
  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  tasksCompleted: number;
  members?: User[];
  leader?: User;
}

export type TaskStatus = 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'verified';

export interface FieldTask {
  id: string;
  incidentId: string;
  teamId: string;
  workerName: string;
  assignedWorkerId?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  instructions: string;
  siteAddress: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  workerNotes?: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CorrelationResult {
  isCorrelated: boolean;
  targetIncidentId?: string;
  confidence?: number;
  candidateIncidents: {
    incident: Incident;
    confidence: number;
    semanticScore: number;
    geoDistanceMeters: number;
    reasons: string[];
  }[];
  extractedCategory?: IssueCategory;
  suggestedPriority: PriorityLevel;
  suggestedPriorityScore: number;
  severityReason: string;
}
