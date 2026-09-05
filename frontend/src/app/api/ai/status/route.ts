import { NextResponse } from "next/server";
import { aiTelemetry } from "@/lib/ai/AIEngineClient";
import { env } from "@/lib/config";

export async function GET() {
  const fastapiBase = env.AI_ENGINE_BASE_URL || "http://127.0.0.1:8000";
  let fastapiReachable = false;
  let fastapiHealthData = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${fastapiBase}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      fastapiReachable = true;
      fastapiHealthData = await res.json();
    }
  } catch {
    fastapiReachable = false;
  }

  return NextResponse.json({
    nextjs: "online",
    fastapi: {
      reachable: fastapiReachable,
      url: fastapiBase,
      details: fastapiHealthData
    },
    aiEngine: {
      lastRequestTime: aiTelemetry.lastRequestTime,
      requestCount: aiTelemetry.requestCount,
      lastExecutionTimeMs: aiTelemetry.lastExecutionTimeMs
    },
    provider: {
      lastProvider: aiTelemetry.lastProvider,
      lastModel: aiTelemetry.lastModel,
      fallback: aiTelemetry.lastFallback
    }
  });
}
