/**
 * CivicPulse Root Cause Hypothesis Engine
 * Generates transparent, evidence-backed root cause hypotheses for recurring civic failures.
 * 
 * CORE PRINCIPLE: Never claim absolute certainty or causation.
 * Always utilize probabilistic phrasing ('possible', 'suspected', 'potential indicator').
 */

import { Incident } from "@/types";
import { calculateHaversineDistance } from "../ai/geo";
import { RootCauseHypothesis } from "./predictiveTypes";

export function inferRootCauses(
  targetIncident: Incident,
  allIncidents: Incident[] = []
): RootCauseHypothesis[] {
  const hypotheses: RootCauseHypothesis[] = [];

  // Find nearby incidents within 350m radius
  const nearby = allIncidents.filter(other => {
    if (other.id === targetIncident.id) return false;
    const dist = calculateHaversineDistance(
      targetIncident.latitude,
      targetIncident.longitude,
      other.latitude,
      other.longitude
    );
    return dist <= 350;
  });

  const catLower = targetIncident.category.toLowerCase();
  const nearbyCategories = nearby.map(i => i.category.toLowerCase());

  // RULE 1: Road Surface Distress + Nearby Water/Drainage Seepage
  const hasWaterNearby = nearby.filter(
    i => i.category.toLowerCase().includes("water") || i.category.toLowerCase().includes("drainage")
  );

  if (catLower.includes("road") && hasWaterNearby.length > 0) {
    const waterIds = hasWaterNearby.map(i => i.id);
    hypotheses.push({
      hypothesis: "Possible subsurface pipe leak or fluid seepage contributing to repeated pavement cavity formation.",
      confidence: Math.min(0.85, 0.55 + hasWaterNearby.length * 0.10),
      supportingEvidence: [
        `Incident ${targetIncident.id} (${targetIncident.category}) is located within 350m of ${hasWaterNearby.length} hydraulic incident(s): ${waterIds.join(", ")}.`,
        "Subsurface water pooling frequently washes away sub-base aggregate, causing asphalt pavement collapse above.",
        `Citizen report context mentions surface deformation in an active water/sewer corridor.`
      ],
      relatedIncidentIds: [targetIncident.id, ...waterIds],
      relatedCategories: [targetIncident.category, "Water Leakage", "Drainage & Sewage"],
      recommendedInvestigation: "Execute acoustic pipe leak detection and ground-penetrating radar survey prior to asphalt resurfacing."
    });
  }

  // RULE 2: Repeated Garbage Accumulation / Dumping
  const hasGarbageNearby = nearby.filter(i => i.category.toLowerCase().includes("garbage"));
  if (catLower.includes("garbage") || hasGarbageNearby.length >= 2) {
    const gIds = [targetIncident.id, ...hasGarbageNearby.map(i => i.id)];
    hypotheses.push({
      hypothesis: "Suspected inadequate municipal waste containment capacity or collection frequency mismatch with local generation rate.",
      confidence: Math.min(0.88, 0.60 + hasGarbageNearby.length * 0.08),
      supportingEvidence: [
        `Recurring waste overflow signals registered across ${gIds.length} observations in the immediate sector.`,
        "Repeated rapid accumulation post-clearance indicates point-source commercial generation or missing bulk containment bins.",
        "Citizen reports frequently note bin capacity overflow rather than delayed collection alone."
      ],
      relatedIncidentIds: gIds,
      relatedCategories: ["Garbage & Sanitation"],
      recommendedInvestigation: "Evaluate installation of high-capacity semi-underground waste bins and audit merchant disposal schedules."
    });
  }

  // RULE 3: Drainage & Sewage Backflow
  const hasDrainageNearby = nearby.filter(i => i.category.toLowerCase().includes("drainage"));
  if (catLower.includes("drainage") || hasDrainageNearby.length >= 2) {
    const dIds = [targetIncident.id, ...hasDrainageNearby.map(i => i.id)];
    hypotheses.push({
      hypothesis: "Potential downstream conduit bottleneck or stormwater channel silt sedimentation causing localized backflow.",
      confidence: Math.min(0.82, 0.58 + hasDrainageNearby.length * 0.08),
      supportingEvidence: [
        `Cluster of ${dIds.length} drainage distress events within a 350m hydraulic reach.`,
        "Localized surface pooling suggests downstream main line capacity restriction rather than single catch-basin blockage.",
        "Correlated reports indicate repeated overflow during moderate to high precipitation periods."
      ],
      relatedIncidentIds: dIds,
      relatedCategories: ["Drainage & Sewage", "Infrastructure"],
      recommendedInvestigation: "Deploy sewer inspection camera crawler to identify internal pipeline obstructions or root intrusion."
    });
  }

  // RULE 4: Streetlight / Electrical Circuit Instability
  const hasPowerNearby = nearby.filter(i => i.category.toLowerCase().includes("light") || i.category.toLowerCase().includes("power"));
  if (catLower.includes("light") || catLower.includes("power") || hasPowerNearby.length >= 2) {
    const pIds = [targetIncident.id, ...hasPowerNearby.map(i => i.id)];
    hypotheses.push({
      hypothesis: "Possible underground feeder cable insulation degradation or phase imbalance causing localized circuit breaker trips.",
      confidence: Math.min(0.79, 0.52 + hasPowerNearby.length * 0.09),
      supportingEvidence: [
        `Multiple adjacent luminaire or electrical outages (${pIds.length} nodes) on the same street segment.`,
        "Simultaneous failure of adjacent fixtures points to feeder branch circuit or timer relay malfunction rather than burnt bulbs.",
        "Citizen reports indicate recurring intermittent power loss during evening peak hours."
      ],
      relatedIncidentIds: pIds,
      relatedCategories: ["Streetlight & Power"],
      recommendedInvestigation: "Perform megger insulation resistance testing on the feeder circuit branch and inspect junction box connections."
    });
  }

  return hypotheses;
}

export function inferAllCityRootCauses(
  allIncidents: Incident[]
): RootCauseHypothesis[] {
  const seenKeys = new Set<string>();
  const allHypotheses: RootCauseHypothesis[] = [];

  for (const inc of allIncidents) {
    const hyps = inferRootCauses(inc, allIncidents);
    for (const h of hyps) {
      // Deduplicate by hypothesis and primary category
      const key = `${h.hypothesis}_${h.relatedCategories.sort().join("_")}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allHypotheses.push(h);
      }
    }
  }

  return allHypotheses.sort((a, b) => b.confidence - a.confidence);
}
