"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Incident } from "@/types";
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Radio, 
  Sparkles, 
  ShieldAlert, 
  MapPin, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from "lucide-react";

export interface CitySignalCanvasProps {
  interactive?: boolean;
  incidents?: Incident[];
  activeIncidentId?: string;
  onSelectIncident?: (id: string) => void;
  className?: string;
  height?: number | string;
  newSignalPulse?: { x: number; y: number; id: string } | null;
}

interface ProjectedCardPos {
  x: number;
  y: number;
  visible: boolean;
}

export function CitySignalCanvas({
  interactive = true,
  incidents = [],
  activeIncidentId = "CP-1024",
  onSelectIncident,
  className = "",
  height = "100%",
  newSignalPulse = null,
}: CitySignalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [projectedCards, setProjectedCards] = useState<{ [key: string]: ProjectedCardPos }>({});
  const [activeLayer, setActiveLayer] = useState<"all" | "conduits" | "clusters">("all");
  const [hoveredIncident, setHoveredIncident] = useState<string | null>(null);

  // Zoom / View scale multiplier
  const cameraDistanceRef = useRef<number>(140);

  // Fallback seed incidents if active incidents array is empty
  const displayIncidents: Partial<Incident>[] = useMemo(() => {
    if (incidents && incidents.length > 0) return incidents;
    return [
      {
        id: "CP-1024",
        title: "Severe Road Hazard Outside St. Xavier School",
        category: "Road Hazard",
        priority: "critical",
        priorityScore: 92,
        latitude: 21.1702,
        longitude: 72.8311,
        address: "Opp. St. Xavier's Model High School, Sector 3",
        status: "in_progress",
        zone: "Sector 3",
        connectedReportsCount: 18,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "CP-1019",
        title: "Major Drinking Water Pipeline Rupture",
        category: "Water Leakage",
        priority: "high",
        priorityScore: 78,
        latitude: 21.1755,
        longitude: 72.8250,
        address: "Lane 4, Civil Hospital Quarters, Sector 2",
        status: "in_progress",
        zone: "Sector 2",
        connectedReportsCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "CP-1033",
        title: "Streetlight Cable Severed Dark Corridor",
        category: "Streetlight & Power",
        priority: "medium",
        priorityScore: 54,
        latitude: 21.1820,
        longitude: 72.8390,
        address: "Ring Road Flyover Ramp, Sector 1",
        status: "new",
        zone: "Sector 1",
        connectedReportsCount: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "CP-0991",
        title: "Drainage Overflow & Silt Desilting",
        category: "Drainage & Sewage",
        priority: "low",
        priorityScore: 40,
        latitude: 21.1640,
        longitude: 72.8450,
        address: "Behind APMC Market, Sector 5",
        status: "resolved",
        zone: "Sector 5",
        connectedReportsCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [incidents]);

  // Spatial coordinates for the 4 primary sectors in 3D world coordinates
  const INCIDENT_3D_COORDS: { [id: string]: { x: number; z: number; sector: string } } = {
    "CP-1024": { x: 12, z: 14, sector: "Sector 3 • School Zone" },
    "CP-1019": { x: -42, z: -30, sector: "Sector 2 • Civil Hospital" },
    "CP-1033": { x: 48, z: -38, sector: "Sector 1 • North Flyover" },
    "CP-0991": { x: -28, z: 46, sector: "Sector 5 • APMC Corridor" },
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animId: number;
    let W = container.clientWidth;
    let H = container.clientHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050914);
    scene.fog = new THREE.FogExp2(0x050914, 0.0035);

    const camera = new THREE.PerspectiveCamera(42, W / H, 1, 1000);
    camera.position.set(90, 110, 120);
    camera.lookAt(0, 0, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. LIGHTING (CALM, ENTERPRISE MUNICIPAL AMBIENCE)
    const ambientLight = new THREE.AmbientLight(0x1a2c4a, 1.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 2.2);
    dirLight.position.set(60, 120, 70);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hubPointLight = new THREE.PointLight(0x38bdf8, 3.5, 180);
    hubPointLight.position.set(0, 40, 0);
    scene.add(hubPointLight);

    // 4. PERSPECTIVE GROUND PLANE & VECTOR GRID
    const groundGeo = new THREE.PlaneGeometry(360, 360, 36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070d1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.4;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(340, 34, 0x1e3a5f, 0x0e1c2e);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 5. TAPI WATERFRONT CURVE / RIVER CANAL
    const riverGeo = new THREE.PlaneGeometry(340, 45);
    const riverMat = new THREE.MeshBasicMaterial({
      color: 0x0c2744,
      transparent: true,
      opacity: 0.75,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = Math.PI / 6;
    river.position.set(-20, -0.2, 0);
    scene.add(river);

    // 6. 3D ARTERIAL ROAD NETWORK
    const roadGroup = new THREE.Group();
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x1e2c44 });
    const activeRouteMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.65 });

    // Main North-South Arterial Highway
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 320), roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.set(0, 0.05, 0);
    roadGroup.add(nsRoad);

    // Main East-West Expressway
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(320, 10), roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.set(0, 0.05, 0);
    roadGroup.add(ewRoad);

    // Ring Road Connector
    const ringRoadGeo = new THREE.RingGeometry(65, 73, 48);
    const ringRoad = new THREE.Mesh(ringRoadGeo, activeRouteMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.set(0, 0.08, 0);
    roadGroup.add(ringRoad);

    scene.add(roadGroup);

    // 7. 65+ PROCEDURAL 3D ARCHITECTURAL BUILDINGS (WITH WIREFRAME EDGES)
    const buildingsGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0b1424,
      roughness: 0.5,
      metalness: 0.7,
      emissive: 0x08152b,
      emissiveIntensity: 0.35,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e3a66, transparent: true, opacity: 0.55 });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    for (let i = 0; i < 68; i++) {
      let x = rand(-140, 140);
      let z = rand(-140, 140);
      const dist = Math.hypot(x, z);

      // Skip central intersection & road arteries
      if (Math.abs(x) < 14 || Math.abs(z) < 14 || dist < 22) continue;

      const w = rand(7, 13);
      const d = rand(7, 13);
      const h = rand(6, 36) * (1 - Math.min(dist / 140, 1) * 0.4 + 0.3);

      const bMesh = new THREE.Mesh(boxGeo, buildingMat);
      bMesh.scale.set(w, h, d);
      bMesh.position.set(x, h / 2, z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      buildingsGroup.add(bMesh);

      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.set(x, h / 2, z);
      buildingsGroup.add(line);
    }
    scene.add(buildingsGroup);

    // 8. REAL INCIDENT CENTROID BEACONS & SATELLITE SIGNAL CONDUITS
    const incidentNodesGroup = new THREE.Group();
    const incidentAnchors: { [id: string]: THREE.Vector3 } = {};
    const satelliteNodes: { mesh: THREE.Mesh; halo: THREE.Mesh; targetPos: THREE.Vector3 }[] = [];

    displayIncidents.forEach((inc) => {
      const incId = inc.id || "CP-UNKNOWN";
      const coords = (inc.id && INCIDENT_3D_COORDS[inc.id]) || { x: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 60, sector: "Surat Central" };
      const isCritical = (inc.priorityScore || 0) >= 80;
      const isHigh = (inc.priorityScore || 0) >= 55 && (inc.priorityScore || 0) < 80;
      const isResolved = inc.status === "resolved" || inc.status === "closed";

      let beaconColor = 0x38bdf8;
      if (isCritical) beaconColor = 0xef4444;
      else if (isHigh) beaconColor = 0xf59e0b;
      else if (isResolved) beaconColor = 0x10b981;

      // 8a. Incident Centroid Column
      const colHeight = isCritical ? 24 : isHigh ? 18 : 12;
      const colGeo = new THREE.CylinderGeometry(0.8, 0.8, colHeight, 16);
      const colMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.85 });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.set(coords.x, colHeight / 2, coords.z);
      incidentNodesGroup.add(colMesh);

      // 8b. Glowing Tip Sphere
      const tipGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.set(coords.x, colHeight, coords.z);
      incidentNodesGroup.add(tipMesh);

      // 8c. Ground Pad & Pulsing Halo
      const padGeo = new THREE.CylinderGeometry(6, 6, 0.5, 24);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x0a1424, emissive: beaconColor, emissiveIntensity: 0.4 });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.set(coords.x, 0.3, coords.z);
      incidentNodesGroup.add(padMesh);

      const haloGeo = new THREE.RingGeometry(7, 10, 24);
      const haloMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = -Math.PI / 2;
      haloMesh.position.set(coords.x, 0.4, coords.z);
      incidentNodesGroup.add(haloMesh);

      // 8d. PointLight
      const pLight = new THREE.PointLight(beaconColor, isCritical ? 3.5 : 2.2, 50);
      pLight.position.set(coords.x, colHeight * 0.6, coords.z);
      incidentNodesGroup.add(pLight);

      incidentAnchors[incId] = new THREE.Vector3(coords.x, colHeight + 3, coords.z);

      // 8e. Clustered Citizen Report Satellite Nodes & Curved Light Conduits
      const signalCount = Math.min(6, Math.max(3, Math.floor((inc.connectedReportsCount || 4) / 3)));
      for (let s = 0; s < signalCount; s++) {
        const angle = (s * (2 * Math.PI)) / signalCount + (coords.x * 0.1);
        const radius = 9 + (s % 2) * 4;
        const satX = coords.x + radius * Math.cos(angle);
        const satZ = coords.z + radius * Math.sin(angle);

        // Satellite Sphere
        const satGeo = new THREE.SphereGeometry(1.1, 12, 12);
        const satMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        satMesh.position.set(satX, 2, satZ);
        incidentNodesGroup.add(satMesh);

        // Curved Light Tube to Incident Centroid
        const p0 = new THREE.Vector3(satX, 2, satZ);
        const p1 = new THREE.Vector3((satX + coords.x) / 2, 8, (satZ + coords.z) / 2);
        const p2 = new THREE.Vector3(coords.x, colHeight * 0.6, coords.z);
        const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);

        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.25, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.65 });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        incidentNodesGroup.add(tubeMesh);

        satelliteNodes.push({ mesh: satMesh, halo: haloMesh, targetPos: new THREE.Vector3(coords.x, colHeight, coords.z) });
      }
    });

    scene.add(incidentNodesGroup);

    // 9. 3D TO 2D SCREEN SPACE PROJECTOR HELPER
    const tmpV = new THREE.Vector3();
    function project(vec3: THREE.Vector3): ProjectedCardPos {
      tmpV.copy(vec3);
      tmpV.project(camera);
      return {
        x: (tmpV.x * 0.5 + 0.5) * W,
        y: (1 - (tmpV.y * 0.5 + 0.5)) * H,
        visible: tmpV.z < 1,
      };
    }

    // 10. MOUSE INTERACTION & SMOOTH PARALLAX
    let targetRotY = 0;
    let currentRotY = 0;
    let targetPitch = 0;
    let currentPitch = 0;

    const onPointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = normX * 0.35;
      targetPitch = normY * 0.25;
    };

    container.addEventListener("mousemove", onPointerMove);

    // 11. RESIZE OBSERVER
    const onResize = () => {
      if (!container || !renderer) return;
      W = container.clientWidth;
      H = container.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };

    window.addEventListener("resize", onResize);

    // 12. ANIMATION LOOP
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth camera orbit & target adjustment based on selected incident
      currentRotY += (targetRotY - currentRotY) * 0.04;
      currentPitch += (targetPitch - currentPitch) * 0.04;

      const activeAnchor = incidentAnchors[activeIncidentId] || new THREE.Vector3(0, 10, 0);
      const camDist = cameraDistanceRef.current;

      const targetCamX = activeAnchor.x + Math.sin(0.75 + currentRotY) * camDist;
      const targetCamZ = activeAnchor.z + Math.cos(0.75 + currentRotY) * camDist;
      const targetCamY = 100 + currentPitch * 30;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;

      camera.lookAt(activeAnchor.x, activeAnchor.y * 0.4, activeAnchor.z);

      // Subtle pulse on satellite nodes
      satelliteNodes.forEach((sat, idx) => {
        sat.mesh.position.y = 2 + Math.sin(t * 2 + idx) * 0.6;
      });

      // Project floating 2D cards above each incident beacon
      const newCardPositions: { [id: string]: ProjectedCardPos } = {};
      displayIncidents.forEach((inc) => {
        if (inc.id && incidentAnchors[inc.id]) {
          newCardPositions[inc.id] = project(incidentAnchors[inc.id]);
        }
      });
      setProjectedCards(newCardPositions);

      renderer.render(scene, camera);
    };

    animate();

    // 13. CLEANUP
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onPointerMove);
      renderer.dispose();
      scene.clear();
    };
  }, [displayIncidents, activeIncidentId, interactive]);

  // Zoom Handler Functions
  const handleZoomIn = () => {
    cameraDistanceRef.current = Math.max(80, cameraDistanceRef.current - 20);
  };
  const handleZoomOut = () => {
    cameraDistanceRef.current = Math.min(220, cameraDistanceRef.current + 20);
  };
  const handleResetZoom = () => {
    cameraDistanceRef.current = 140;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-[#050914] ${className}`}
      style={{ height }}
      aria-label="Civic Intelligence Spatial Operations Canvas"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Atmospheric Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 55%, #050914 96%)",
        }}
      />

      {/* ========================================================================= */}
      {/* DISTRICT SECTOR WATERMARK LABELS (Surat Municipal Corridors)               */}
      {/* ========================================================================= */}
      <div className="absolute top-14 left-8 text-[11px] font-mono font-bold text-slate-500/40 pointer-events-none tracking-widest uppercase">
        Sector 1 &bull; North Ring Expressway
      </div>
      <div className="absolute top-14 right-8 text-[11px] font-mono font-bold text-slate-500/40 pointer-events-none tracking-widest uppercase">
        Sector 2 &bull; Civil Hospital Zone
      </div>
      <div className="absolute bottom-16 left-8 text-[11px] font-mono font-bold text-sky-400/50 pointer-events-none tracking-widest uppercase">
        Sector 3 &bull; St. Xavier Education Core
      </div>
      <div className="absolute bottom-16 right-8 text-[11px] font-mono font-bold text-slate-500/40 pointer-events-none tracking-widest uppercase">
        Sector 5 &bull; APMC Market Corridor
      </div>

      {/* ========================================================================= */}
      {/* FLOATING PROJECTED INCIDENT CLUSTER CARDS (ANCHORED IN 3D SPACE)          */}
      {/* ========================================================================= */}
      {displayIncidents.map((inc) => {
        if (!inc.id) return null;
        const pos = projectedCards[inc.id];
        if (!pos) return null;

        const isSelected = inc.id === activeIncidentId;
        const isCritical = (inc.priorityScore || 0) >= 80;
        const isHigh = (inc.priorityScore || 0) >= 55 && (inc.priorityScore || 0) < 80;
        const isResolved = inc.status === "resolved" || inc.status === "closed";

        let borderClass = "border-sky-500/50 hover:border-sky-400";
        let glowClass = "shadow-lg shadow-sky-950/50";
        let badgeColor = "bg-sky-950 text-sky-300 border-sky-500/40";

        if (isCritical) {
          borderClass = "border-red-500/80 hover:border-red-400 ring-1 ring-red-500/40";
          glowClass = "shadow-xl shadow-red-950/60";
          badgeColor = "bg-red-950 text-red-300 border-red-500/40";
        } else if (isHigh) {
          borderClass = "border-amber-500/70 hover:border-amber-400";
          glowClass = "shadow-lg shadow-amber-950/50";
          badgeColor = "bg-amber-950 text-amber-300 border-amber-500/40";
        } else if (isResolved) {
          borderClass = "border-emerald-500/70 hover:border-emerald-400";
          glowClass = "shadow-lg shadow-emerald-950/50";
          badgeColor = "bg-emerald-950 text-emerald-300 border-emerald-500/40";
        }

        return (
          <div
            key={inc.id}
            onClick={() => {
              if (onSelectIncident && inc.id) onSelectIncident(inc.id);
            }}
            onMouseEnter={() => {
              if (inc.id) setHoveredIncident(inc.id);
            }}
            onMouseLeave={() => setHoveredIncident(null)}
            className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 z-30 p-2.5 rounded-2xl bg-[#0b1329]/95 border backdrop-blur-xl ${borderClass} ${glowClass} ${
              isSelected ? "scale-110 ring-2 ring-sky-400 z-40" : "hover:scale-105 opacity-90 hover:opacity-100"
            }`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y - 12}px`,
              opacity: pos.visible ? 1 : 0,
            }}
          >
            {/* Top Row: ID & Priority Badge */}
            <div className="flex items-center justify-between gap-2 font-mono">
              <span className="text-xs font-black text-white">{inc.id}</span>
              <span className={`px-1.5 py-0.5 rounded-md border text-[9.5px] font-bold ${badgeColor}`}>
                {isCritical ? "CRITICAL" : isHigh ? "HIGH" : isResolved ? "RESOLVED" : "STANDARD"} [{inc.priorityScore}]
              </span>
            </div>

            {/* Title */}
            <div className="text-[11px] font-bold text-slate-200 font-sans leading-tight mt-1 truncate max-w-[170px]">
              {inc.title}
            </div>

            {/* Bottom Row: Signals Count & Action Prompt */}
            <div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 font-sans">
              <span className="text-sky-400 font-mono font-bold">
                {inc.connectedReportsCount || 1} Signals
              </span>
              <span className="text-slate-500">
                {isSelected ? "Active Focus" : "Click to Focus"}
              </span>
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* TACTICAL NAVIGATION HUD & SPATIAL CONTROLS                                 */}
      {/* ========================================================================= */}
      
      {/* Top Left: Compass Orientation & GPS Anchor */}
      <div className="absolute top-3 left-3 z-40 flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl font-mono text-[10.5px]">
        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-sky-400">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-white font-bold block leading-tight">SECTOR 3 SPATIAL GRID</span>
          <span className="text-slate-400 text-[9.5px]">21.1702° N &bull; 72.8311° E</span>
        </div>
      </div>

      {/* Top Right: Zoom & Layer Controls */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-1 rounded-xl font-mono text-xs">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-40 font-mono text-[10px] text-slate-400 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white">Critical Risk</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-white">High Priority</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-white">Standard</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white">Resolved</span>
        </span>
        <span className="hidden sm:inline text-slate-700">|</span>
        <span className="text-sky-400 font-bold hidden sm:inline">
          Live 3D City Mesh Synced
        </span>
      </div>

    </div>
  );
}

export default CitySignalCanvas;
