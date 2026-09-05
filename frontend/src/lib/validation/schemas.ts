import { z } from "zod";

/**
 * CivicPulse Domain Validation Schemas
 * Used to validate inputs at the API / Service boundaries.
 */

export const IssueCategorySchema = z.enum([
  "Road Hazard",
  "Water Leakage",
  "Drainage & Sewage",
  "Garbage & Sanitation",
  "Streetlight & Power",
  "Public Safety",
  "Infrastructure",
]);

export const PriorityLevelSchema = z.enum(["critical", "high", "medium", "low"]);

export const IncidentStatusSchema = z.enum([
  "new",
  "under_review",
  "assigned",
  "in_progress",
  "awaiting_verification",
  "resolved",
  "closed",
]);

export const TaskStatusSchema = z.enum([
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "verified",
]);

// Report Submission Input Schema
export const CreateReportSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: IssueCategorySchema.optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional().default("Urban Municipal Corridor"),
  mediaUrl: z.string().url().optional(),
  userName: z.string().optional(),
  userPhone: z.string().optional(),
  forceNewIncident: z.boolean().optional(),
  connectToIncidentId: z.string().optional(),
  source: z.enum(["production", "demo", "simulation"]).optional(),
});

// Incident Status / Priority Update Schema
export const UpdateIncidentSchema = z.object({
  status: IncidentStatusSchema.optional(),
  priority: PriorityLevelSchema.optional(),
  assignedTeamId: z.string().optional(),
  beforeEvidenceUrl: z.string().url().optional(),
  afterEvidenceUrl: z.string().url().optional(),
});

// Squad Dispatch Schema
export const AssignTeamSchema = z.object({
  teamId: z.string().min(1, "teamId is required"),
  workerId: z.string().optional(),
  instructions: z.string().optional(),
  priority: PriorityLevelSchema.optional(),
});

// Field Task Status Update Schema
export const UpdateTaskStatusSchema = z.object({
  status: TaskStatusSchema,
  workerNotes: z.string().optional(),
  afterPhotoUrl: z.string().url().optional(),
  beforePhotoUrl: z.string().url().optional(),
});

// Authentication Schemas
export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional(),
  role: z.enum(["citizen", "operator", "worker", "admin"]).optional().default("citizen"),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

