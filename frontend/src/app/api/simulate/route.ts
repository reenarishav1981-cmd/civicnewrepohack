import { NextResponse } from "next/server";
import { civicRepository } from "@/lib/repositories";
import { correlateSignal } from "@/lib/ai/correlationEngine";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors/AppError";

const SIMULATION_SCENARIOS = [
  {
    userName: "Devanshi Shah",
    description: "Deep pothole outside school compound! An auto-rickshaw nearly overturned trying to avoid the hole.",
    latitude: 21.1703,
    longitude: 72.8312,
    address: "Outside St. Xavier's Gate 2, Sector 3",
    category: "Road Hazard"
  },
  {
    userName: "Karan Singhania",
    description: "Water accumulating in large road craters right opposite the school. Traffic completely blocked.",
    latitude: 21.1706,
    longitude: 72.8315,
    address: "University Road Junction, Sector 3",
    category: "Road Hazard"
  },
  {
    userName: "Ananya Roy",
    description: "Fresh water pipe cracked near the hospital parking entrance. Pavement is getting damaged.",
    latitude: 21.1758,
    longitude: 72.8252,
    address: "Hospital Quarters Lane 4, Sector 2",
    category: "Water Leakage"
  }
];

export async function POST(request: Request) {
  try {
    // Enforce Role-Based Access Control: Operator or Admin only
    await requireRole(request, ["operator", "admin"]);

    const { scenarioIndex = 0 } = await request.json().catch(() => ({}));
    const scenario = SIMULATION_SCENARIOS[scenarioIndex % SIMULATION_SCENARIOS.length];

    const existingIncidents = await civicRepository.getIncidents();
    const correlation = correlateSignal({
      description: scenario.description,
      category: scenario.category,
      latitude: scenario.latitude,
      longitude: scenario.longitude,
      existingIncidents
    });

    const reportId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetIncidentId = correlation.targetIncidentId || "CP-1024";

    const newReport = {
      id: reportId,
      userId: "usr-1",
      userName: scenario.userName,
      userPhone: "+91 98980 " + Math.floor(10000 + Math.random() * 90000),
      incidentId: targetIncidentId,
      description: scenario.description,
      category: scenario.category as any,
      latitude: scenario.latitude,
      longitude: scenario.longitude,
      address: scenario.address,
      status: "correlated" as const,
      createdAt: new Date().toISOString()
    };
    await civicRepository.createReport(newReport);
    await civicRepository.connectReportToIncident(reportId, targetIncidentId);

    const updatedIncident = await civicRepository.getIncidentById(targetIncidentId);

    return NextResponse.json({
      success: true,
      message: `Simulated signal ${reportId} correlated with incident ${targetIncidentId}`,
      data: {
        report: newReport,
        correlation,
        incident: updatedIncident
      }
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
