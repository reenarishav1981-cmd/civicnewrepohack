function simulateAuditWithMockData() {
  console.log("=== TESTING AUDIT LOGIC SENSITIVITY WITH VIOLATION ===");

  const reports = [
    { id: "R-1", incidentId: "CP-1024" },
    { id: "R-ORPHAN", incidentId: "CP-NON-EXISTENT" } // INJECTED ORPHAN VIOLATION
  ];
  const incidents = [
    { id: "CP-1024", assignedTeamId: "team-alpha" },
    { id: "CP-BAD-TEAM", assignedTeamId: "team-non-existent" } // INJECTED TEAM VIOLATION
  ];
  const tasks = [
    { id: "TSK-ORPHAN", incidentId: "CP-GHOST", teamId: "team-ghost" } // INJECTED TASK VIOLATION
  ];
  const teams = [{ id: "team-alpha" }];
  const timelineEvents = [
    { id: "TL-ORPHAN", incidentId: "CP-GHOST" } // INJECTED TIMELINE VIOLATION
  ];

  let violationCount = 0;
  const incidentIds = new Set(incidents.map(i => i.id));
  const teamIds = new Set(teams.map(t => t.id));

  // 1. Report check
  for (const r of reports) {
    if (r.incidentId && !incidentIds.has(r.incidentId)) {
      console.log(`[DETECTED] Orphan CitizenReport ${r.id} -> ${r.incidentId}`);
      violationCount++;
    }
  }

  // 2. Task check
  for (const t of tasks) {
    if (!incidentIds.has(t.incidentId)) {
      console.log(`[DETECTED] Orphan FieldTask ${t.id} -> ${t.incidentId}`);
      violationCount++;
    }
    if (!teamIds.has(t.teamId)) {
      console.log(`[DETECTED] Orphan FieldTask ${t.id} -> ${t.teamId}`);
      violationCount++;
    }
  }

  // 3. Timeline check
  for (const tl of timelineEvents) {
    if (!incidentIds.has(tl.incidentId)) {
      console.log(`[DETECTED] Orphan TimelineEvent ${tl.id} -> ${tl.incidentId}`);
      violationCount++;
    }
  }

  // 4. Incident check
  for (const inc of incidents) {
    if (inc.assignedTeamId && !teamIds.has(inc.assignedTeamId)) {
      console.log(`[DETECTED] Incident ${inc.id} -> ${inc.assignedTeamId}`);
      violationCount++;
    }
  }

  console.log(`Total Violations Detected: ${violationCount}`);
  if (violationCount === 5) {
    console.log("[PASS] AUDIT LOGIC IS SENSITIVE: CAUGHT ALL 5 SYNTHETIC INTEGRITY VIOLATIONS.");
  } else {
    throw new Error(`Expected 5 violations, caught ${violationCount}`);
  }
}

simulateAuditWithMockData();
