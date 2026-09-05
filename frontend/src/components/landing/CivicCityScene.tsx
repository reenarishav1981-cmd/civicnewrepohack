"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PerspectiveCamera } from "@react-three/drei";
import {
  CatmullRomCurve3,
  Color,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  TubeGeometry,
  Vector3,
} from "three";
import {
  CITY_LAYOUT,
  FIELD_TEAM,
  INCIDENT_MARKERS,
} from "./cityData";
import type {
  CityLayoutConfig,
  FieldTeamData,
  IncidentMarkerData,
  IncidentSeverity,
} from "./city";

/* -------------------------------------------------------------------- */
/*  Client-only environment hooks (SSR-safe: default to false on the    */
/*  server, then read the real value after mount).                     */
/* -------------------------------------------------------------------- */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsMobile(breakpoint = 860): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(query.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

/* -------------------------------------------------------------------- */
/*  Camera rig — subtle pointer parallax, no orbit, no spin.            */
/* -------------------------------------------------------------------- */

function CameraRig({
  basePosition,
  lookAt,
  maxOffset = 4.5,
  enabled,
}: {
  basePosition: [number, number, number];
  lookAt: [number, number, number];
  maxOffset?: number;
  enabled: boolean;
}) {
  const { camera, pointer } = useThree();
  const target = useRef(new Vector3(...basePosition));
  const lookTarget = useRef(new Vector3(...lookAt));

  useFrame(() => {
    if (enabled && pointer) {
      target.current.set(
        basePosition[0] + (pointer.x || 0) * maxOffset,
        basePosition[1] - (pointer.y || 0) * (maxOffset * 0.4),
        basePosition[2]
      );
    } else {
      target.current.set(...basePosition);
    }
    // Ease toward the target — slow and deliberate, never snappy.
    camera.position.lerp(target.current, 0.045);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

/* -------------------------------------------------------------------- */
/*  Procedural city — instanced dark-glass / charcoal massing.          */
/* -------------------------------------------------------------------- */

interface BuildingInstance {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  tint: number;
}

const dummy = new Object3D();

function generateBuildings(
  layout: CityLayoutConfig,
  count: number
): BuildingInstance[] {
  const { citySpan, plazaRadius, blockSize, roadGap } = layout;
  const half = citySpan / 2;
  const cell = blockSize + roadGap;
  const cols = Math.floor(citySpan / cell);

  const lots: { x: number; z: number }[] = [];
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < cols; iz++) {
      const x = -half + cell / 2 + ix * cell;
      const z = -half + cell / 2 + iz * cell;
      if (Math.hypot(x, z) > plazaRadius) lots.push({ x, z });
    }
  }

  // Deterministic pseudo-random sorting
  const seeded = [...lots].sort((a, b) => {
    const ha = Math.sin(a.x * 12.9898 + a.z * 78.233) * 43758.5453;
    const hb = Math.sin(b.x * 12.9898 + b.z * 78.233) * 43758.5453;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });

  const chosen = seeded.slice(0, Math.min(count, seeded.length));

  return chosen.map(({ x, z }) => {
    const dist = Math.hypot(x, z) / (citySpan / 2);
    const heightBias = 1 - dist * 0.55; // taller near the civic core
    const rand = Math.abs(Math.sin(x * 91.7 + z * 13.3));
    const height = MathUtils.lerp(3, 26, rand) * heightBias;

    return {
      x,
      z,
      width: blockSize * MathUtils.lerp(0.55, 0.85, rand),
      depth: blockSize * MathUtils.lerp(0.55, 0.85, 1 - rand),
      height: Math.max(2.2, height),
      tint: rand,
    };
  });
}

function CityBuildings({
  layout,
  buildingCount,
  reducedMotion,
}: {
  layout: CityLayoutConfig;
  buildingCount: number;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const buildings = useMemo(
    () => generateBuildings(layout, buildingCount),
    [layout, buildingCount]
  );

  const charcoal = useMemo(() => new Color("#0d1320"), []);
  const glass = useMemo(() => new Color("#16233b"), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.height / 2, b.z);
      dummy.scale.set(b.width, b.height, b.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const color = charcoal.clone().lerp(glass, b.tint * 0.6);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [buildings, charcoal, glass]);

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 0.06) * 0.03;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[layout.citySpan + 20, layout.citySpan + 20]} />
        <meshStandardMaterial color="#05070d" roughness={0.95} metalness={0} />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, buildings.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          roughness={0.35}
          metalness={0.55}
          clearcoat={0.4}
          clearcoatRoughness={0.6}
          envMapIntensity={0.6}
        />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Incident intelligence markers.                                      */
/* -------------------------------------------------------------------- */

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  critical: "#e5484d",
  high: "#e0a23b",
  standard: "#5b9dfb",
  resolved: "#3fb27f",
};

function markerHeight(marker: IncidentMarkerData): number {
  switch (marker.severity) {
    case "critical":
      return 15;
    case "high":
      return 11;
    case "standard":
      return 6;
    case "resolved":
      return 5;
  }
}

function IncidentCard({
  id,
  label,
  severity,
  count,
}: {
  id: string;
  label: string;
  severity: IncidentSeverity;
  count: number;
}) {
  const color = SEVERITY_COLOR[severity];
  return (
    <div className="pointer-events-none flex select-none items-start gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a0e18]/90 px-3 py-2 backdrop-blur-md shadow-lg">
      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: color }} />
      <div>
        <p className="font-mono text-xs font-medium text-slate-100">{id}</p>
        <p className="mt-0.5 text-[10px] font-semibold tracking-wide" style={{ color }}>
          {label.toUpperCase()}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">{count} signals</p>
      </div>
    </div>
  );
}

function IncidentMarkers({
  markers,
  citySpan,
}: {
  markers: IncidentMarkerData[];
  citySpan: number;
}) {
  const half = citySpan / 2;

  return (
    <group>
      {markers.map((marker) => {
        const x = marker.gridPosition[0] * half;
        const z = marker.gridPosition[1] * half;
        const top = markerHeight(marker);
        const color = SEVERITY_COLOR[marker.severity];

        return (
          <group key={marker.id}>
            {/* Native 3D Light Column */}
            <mesh position={[x, top / 2, z]}>
              <cylinderGeometry args={[0.09, 0.09, top, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.65} />
            </mesh>

            {/* Glowing Beacon Tip */}
            <mesh position={[x, top, z]}>
              <sphereGeometry args={[0.32, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Projected HTML Card */}
            <Html position={[x, top + 0.6, z]} center distanceFactor={26}>
              <IncidentCard
                id={marker.id}
                label={marker.label}
                severity={marker.severity}
                count={marker.signalCount}
              />
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Field team marker — routed toward its target incident.              */
/* -------------------------------------------------------------------- */

function FieldTeamMarker({
  team,
  target,
  citySpan,
  reducedMotion,
}: {
  team: FieldTeamData;
  target: IncidentMarkerData | undefined;
  citySpan: number;
  reducedMotion: boolean;
}) {
  const half = citySpan / 2;
  const meshRef = useRef<Mesh>(null);
  const progressRef = useRef(team.routeProgress);

  const curve = useMemo(() => {
    if (!target) return null;
    const targetX = target.gridPosition[0] * half;
    const targetZ = target.gridPosition[1] * half;
    const start = new Vector3(
      Math.sign(targetX || 1) * half * 1.05,
      0.15,
      Math.sign(targetZ || 1) * half * 0.4
    );
    const mid = new Vector3(targetX * 0.5, 0.15, targetZ * 0.9);
    const end = new Vector3(targetX, 0.15, targetZ);
    return new CatmullRomCurve3([start, mid, end]);
  }, [target, half]);

  const tubeGeo = useMemo(() => {
    if (!curve) return null;
    return new TubeGeometry(curve, 28, 0.14, 6, false);
  }, [curve]);

  useFrame((_, delta) => {
    if (!curve || !meshRef.current) return;
    if (!reducedMotion) {
      progressRef.current = (progressRef.current + delta * 0.02) % 1;
    }
    const p = curve.getPointAt(progressRef.current);
    meshRef.current.position.set(p.x, p.y, p.z);
  });

  if (!curve) return null;
  const p0 = curve.getPointAt(progressRef.current);

  return (
    <group>
      {tubeGeo && (
        <mesh geometry={tubeGeo}>
          <meshBasicMaterial color="#5b9dfb" transparent opacity={0.35} />
        </mesh>
      )}

      <mesh ref={meshRef} position={[p0.x, p0.y, p0.z]}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshBasicMaterial color="#c9dbff" />
      </mesh>

      <Html position={[p0.x, p0.y + 1.6, p0.z]} center distanceFactor={26}>
        <div className="pointer-events-none flex select-none items-start gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a0e18]/90 px-3 py-2 backdrop-blur-md shadow-lg">
          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[#5b9dfb]" />
          <div>
            <p className="font-mono text-xs font-medium text-slate-100">{team.name}</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-[#5b9dfb]">
              {team.status.toUpperCase()}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {team.distanceKm.toFixed(1)} km away
            </p>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Signal connections — one slow pulse per incident path toward hub.   */
/* -------------------------------------------------------------------- */

function SignalConnections({
  markers,
  citySpan,
  reducedMotion,
}: {
  markers: IncidentMarkerData[];
  citySpan: number;
  reducedMotion: boolean;
}) {
  const half = citySpan / 2;
  const meshRef = useRef<InstancedMesh>(null);
  const progressOffsets = useRef<number[]>([0, 0.2, 0.4, 0.6]);

  const curves = useMemo(() => {
    return markers.map((marker, i) => {
      const x = marker.gridPosition[0] * half;
      const z = marker.gridPosition[1] * half;
      const start = new Vector3(x, 0.4, z);
      const mid = new Vector3(x * 0.4, 4, z * 0.4);
      const end = new Vector3(0, 1.2, 0); // civic hub at the plaza center
      progressOffsets.current[i] = i * 0.25;
      return new CatmullRomCurve3([start, mid, end]);
    });
  }, [markers, half]);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();

    curves.forEach((curve, i) => {
      if (!reducedMotion) {
        const prev = progressOffsets.current[i] ?? (i * 0.25);
        progressOffsets.current[i] = (prev + delta * 0.045) % 1;
      }
      const progress = progressOffsets.current[i] ?? 0;
      const p = curve.getPointAt(progress);
      dummy.position.copy(p);
      const pulse = reducedMotion ? 1 : 0.85 + Math.sin(t * 2 + i) * 0.15;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, markers.length]}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshBasicMaterial color="#8fb8ff" transparent opacity={0.85} />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------------- */
/*  Scene root — Canvas, camera, lights, fog, composition.              */
/* -------------------------------------------------------------------- */

export function CivicCityScene() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const buildingCount = isMobile
    ? CITY_LAYOUT.buildingCountMobile
    : CITY_LAYOUT.buildingCountDesktop;

  const cameraPosition: [number, number, number] = isMobile
    ? [0, 46, 62]
    : [38, 34, 58];

  const targetIncident = INCIDENT_MARKERS.find(
    (m) => m.id === FIELD_TEAM.targetIncidentId
  );

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows={!isMobile}
    >
      <color attach="background" args={["#04060b"]} />
      <fog attach="fog" args={["#04060b", 50, 130]} />

      <PerspectiveCamera makeDefault fov={isMobile ? 42 : 32} position={cameraPosition} />
      <CameraRig
        basePosition={cameraPosition}
        lookAt={[0, 3, 0]}
        maxOffset={isMobile ? 1.5 : 4.5}
        enabled={!reducedMotion}
      />

      <ambientLight intensity={0.35} color="#3a4a6a" />
      <directionalLight
        position={[30, 45, 20]}
        intensity={1.1}
        color="#dbe6ff"
        castShadow={!isMobile}
      />
      <pointLight position={[0, 12, 0]} intensity={2.2} color="#5b9dfb" distance={45} />

      <CityBuildings
        layout={CITY_LAYOUT}
        buildingCount={buildingCount}
        reducedMotion={reducedMotion}
      />

      <IncidentMarkers markers={INCIDENT_MARKERS} citySpan={CITY_LAYOUT.citySpan} />

      <SignalConnections
        markers={INCIDENT_MARKERS}
        citySpan={CITY_LAYOUT.citySpan}
        reducedMotion={reducedMotion}
      />

      <FieldTeamMarker
        team={FIELD_TEAM}
        target={targetIncident}
        citySpan={CITY_LAYOUT.citySpan}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

export default CivicCityScene;
