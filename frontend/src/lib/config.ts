import { z } from "zod";

/**
 * CivicPulse Validated Environment Configuration
 * Enforces server/client boundaries without exposing secrets.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  MEDIA_STORAGE_PROVIDER: z.enum(["local", "s3", "cloudinary"]).default("local"),
  AI_PROVIDER: z.enum(["heuristic", "openai", "google_gemini"]).default("heuristic"),
  DATA_PROVIDER: z.enum(["prisma", "memory"]).default("prisma"),
  AUTH_SECRET: z.string().min(16).default("civicpulse-secure-auth-secret-key-at-least-32-chars-long-2026"),
  AI_ENGINE_BASE_URL: z.string().url().default("http://127.0.0.1:8000"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(8000),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  MEDIA_STORAGE_PROVIDER: process.env.MEDIA_STORAGE_PROVIDER,
  AI_PROVIDER: process.env.AI_PROVIDER,
  DATA_PROVIDER: process.env.DATA_PROVIDER || "prisma",
  AUTH_SECRET: process.env.AUTH_SECRET || "civicpulse-secure-auth-secret-key-at-least-32-chars-long-2026",
  AI_ENGINE_BASE_URL: process.env.AI_ENGINE_BASE_URL || "http://127.0.0.1:8000",
  AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS || 8000,
});
