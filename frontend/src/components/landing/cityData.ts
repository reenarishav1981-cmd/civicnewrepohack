import type {
  CityLayoutConfig,
  FieldTeamData,
  IncidentMarkerData,
  SignalFlowStage,
} from "./city";

export const CITY_LAYOUT: CityLayoutConfig = {
  citySpan: 120,
  plazaRadius: 14,
  blockSize: 7,
  roadGap: 3.2,
  buildingCountDesktop: 64,
  buildingCountMobile: 30,
};

export const INCIDENT_MARKERS: IncidentMarkerData[] = [
  {
    id: "CP-1024",
    severity: "critical",
    label: "Critical",
    signalCount: 18,
    gridPosition: [-0.32, -0.78],
  },
  {
    id: "CP-1019",
    severity: "high",
    label: "High",
    signalCount: 12,
    gridPosition: [0.62, -0.28],
  },
  {
    id: "CP-1033",
    severity: "standard",
    label: "Standard",
    signalCount: 4,
    gridPosition: [-0.58, 0.42],
  },
  {
    id: "CP-0991",
    severity: "resolved",
    label: "Resolved",
    signalCount: 8,
    gridPosition: [0.74, 0.5],
  },
];

export const FIELD_TEAM: FieldTeamData = {
  name: "Field Team Alpha",
  status: "En route",
  distanceKm: 2.4,
  targetIncidentId: "CP-1024",
  routeProgress: 0.35,
};

export const SIGNAL_FLOW_STAGES: SignalFlowStage[] = [
  { id: "signal", label: "Citizen signal" },
  { id: "correlation", label: "Correlation" },
  { id: "cluster", label: "Incident cluster" },
  { id: "field", label: "Field team" },
  { id: "resolution", label: "Verified resolution" },
];
