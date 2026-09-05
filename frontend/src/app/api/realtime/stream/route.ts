import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";
import { realtimeEventBus, RealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. RBAC Guard: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connected greeting and heartbeat
        const initialPayload = JSON.stringify({
          type: "CONNECTION_ESTABLISHED",
          timestamp: new Date().toISOString(),
          status: "connected",
        });
        controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

        // Push buffered recent events so connecting client immediately has context
        const recent = realtimeEventBus.getRecentEvents(undefined, 25);
        for (const evt of recent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
        }

        // Subscribe to live events
        const unsubscribe = realtimeEventBus.subscribe((event: RealtimeEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch (err) {
            // Stream might be closed
          }
        });

        // 15-second heartbeat to keep connection alive across proxies
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch (err) {
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // Clean cleanup on client disconnect or abort
        request.signal.addEventListener("abort", () => {
          unsubscribe();
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (err) {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
