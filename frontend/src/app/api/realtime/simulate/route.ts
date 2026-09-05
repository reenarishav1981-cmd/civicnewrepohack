import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { handleApiError, ValidationError } from "@/lib/errors/AppError";
import { demoSimulationEngine } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const simulateActionSchema = z.object({
  action: z.enum(["start", "pause", "step", "reset", "status"]),
});

export async function POST(request: Request) {
  try {
    await requireRole(request, ["operator", "admin"]);

    const body = await request.json().catch(() => ({ action: "status" }));
    const parseResult = simulateActionSchema.safeParse(body);
    if (!parseResult.success) {
      return handleApiError(new ValidationError("Invalid simulation action. Allowed: start, pause, step, reset, status."));
    }

    const { action } = parseResult.data;

    let resultData: any = {};

    switch (action) {
      case "start":
        demoSimulationEngine.start();
        resultData = {
          message: "Demo simulation started",
          status: demoSimulationEngine.getStatus(),
          currentStep: demoSimulationEngine.getCurrentStep(),
        };
        break;

      case "pause":
        demoSimulationEngine.pause();
        resultData = {
          message: "Demo simulation paused",
          status: demoSimulationEngine.getStatus(),
          currentStep: demoSimulationEngine.getCurrentStep(),
        };
        break;

      case "step":
        const step = demoSimulationEngine.stepForward();
        resultData = {
          message: step ? "Advanced one step" : "Simulation completed",
          status: demoSimulationEngine.getStatus(),
          currentStep: step || demoSimulationEngine.getCurrentStep(),
        };
        break;

      case "reset":
        const resetStep = demoSimulationEngine.reset();
        resultData = {
          message: "Demo simulation reset cleanly to T+0",
          status: demoSimulationEngine.getStatus(),
          currentStep: resetStep,
        };
        break;

      case "status":
      default:
        resultData = {
          status: demoSimulationEngine.getStatus(),
          currentStep: demoSimulationEngine.getCurrentStep(),
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: resultData,
      isSimulation: true,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
