import { NextResponse } from "next/server";
import { aiEngineClient } from "@/lib/ai/AIEngineClient";
import { env } from "@/lib/config";

export async function POST(request: Request) {
  const startTime = Date.now();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const description = body.description || "Road pe bahut bada pothole hai school ke paas. Bachchon ke accident ka danger hai.";
  const latitude = body.latitude !== undefined ? body.latitude : 26.2183;
  const longitude = body.longitude !== undefined ? body.longitude : 78.1828;

  const fastapiBase = env.AI_ENGINE_BASE_URL || "http://127.0.0.1:8000";
  let fastapiAvailable = false;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 1500);
    const h = await fetch(`${fastapiBase}/health`, { signal: ctrl.signal });
    clearTimeout(to);
    fastapiAvailable = h.ok;
  } catch {
    fastapiAvailable = false;
  }

  const aiResult = await aiEngineClient.analyzeFullPipeline({
    description,
    latitude,
    longitude,
    existingIncidents: []
  });

  const execTime = Date.now() - startTime;
  const ca = aiResult.complaint_analysis;
  const prio = aiResult.priority;

  return NextResponse.json({
    success: true,
    pipeline: {
      nextjs: true,
      aiClient: true,
      fastapi: fastapiAvailable
    },
    provider: ca.meta.provider,
    fallback: ca.meta.fallback,
    result: {
      category: ca.category,
      severity: `${ca.severity}/5`,
      priority: `${prio.priority_score} (${prio.priority_level})`,
      urgency: ca.urgency,
      explanation: ca.explanation
    },
    executionTimeMs: execTime
  });
}
