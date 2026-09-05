export type IncidentSeverity = "critical" | "high" | "standard" | "resolved";

export interface IncidentMarkerData {
  id: string;
  severity: IncidentSeverity;
  label: string;
  signalCount: number;
  /** Normalized city-grid position, -1..1 on both axes. Independent of
   *  world units so the scene can rescale without touching this data. */
  gridPosition: [number, number];
}

export interface FieldTeamData {
  name: string;
  status: string;
  distanceKm: number;
  /** Which incident this team is currently routed toward. */
  targetIncidentId: string;
  /** 0..1 progress along the route at first paint. */
  routeProgress: number;
}

export interface SignalFlowStage {
  id: "signal" | "correlation" | "cluster" | "field" | "resolution";
  label: string;
}

export interface CityLayoutConfig {
  citySpan: number; // world units, city footprint (square)
  plazaRadius: number; // radius kept clear at the center for the civic hub
  blockSize: number; // approximate footprint of one building lot
  roadGap: number; // spacing reserved for roads between lots
  buildingCountDesktop: number;
  buildingCountMobile: number;
}
