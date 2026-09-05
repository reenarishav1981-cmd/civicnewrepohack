"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AlertTriangle, Check, Info, ShieldAlert, Sparkles, Truck } from "lucide-react";

interface TowerDef {
  name: string;
  x: number;
  z: number;
  h: number;
  color: number;
  hexColor: string;
  id: string;
  status: string;
  count: string;
  cls: "critical" | "high" | "resolved" | "standard";
  iconType: "alert" | "check" | "info";
  anchor?: THREE.Vector3;
}

const TOWERS: TowerDef[] = [
  { name: "critical", x: -18, z: -118, h: 70, color: 0xf04444, hexColor: "#f04444", id: "CP-1024", status: "CRITICAL", count: "18 Signals", cls: "critical", iconType: "alert" },
  { name: "high",     x: 112, z: -46,  h: 52, color: 0xf5a524, hexColor: "#f5a524", id: "CP-1019", status: "HIGH",     count: "12 Signals", cls: "high",     iconType: "alert" },
  { name: "resolved", x: 150, z: 64,   h: 26, color: 0x22c55e, hexColor: "#22c55e", id: "CP-0991", status: "RESOLVED", count: "8 Signals",  cls: "resolved", iconType: "check" },
  { name: "standard", x: -95, z: 70,   h: 20, color: 0x4fa8ff, hexColor: "#4fa8ff", id: "CP-1033", status: "STANDARD", count: "6 Signals",  cls: "standard", iconType: "info" },
];

interface LabelProjectedPos {
  x: number;
  y: number;
  visible: boolean;
}

export function ThreeHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Projected 2D screen positions for floating HTML labels
  const [markerPositions, setMarkerPositions] = useState<{ [key: string]: LabelProjectedPos }>({});
  const [hubPosition, setHubPosition] = useState<LabelProjectedPos>({ x: 0, y: 0, visible: false });
  const [teamPosition, setTeamPosition] = useState<LabelProjectedPos>({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const stage = containerRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let animId: number;
    let W = stage.clientWidth;
    let H = stage.clientHeight;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060c, 0.0028);

    // 2. Orthographic Isometric Camera
    const frustum = 165;
    const camera = new THREE.OrthographicCamera(
      -frustum,
      frustum,
      frustum * (H / W),
      -frustum * (H / W),
      1,
      2000
    );
    camera.position.set(230, 190, 230);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    // 4. World Group
    const world = new THREE.Group();
    scene.add(world);

    // 5. Lighting
    scene.add(new THREE.AmbientLight(0x1a2a4a, 1.1));
    const hubLight = new THREE.PointLight(0x4fd6ff, 3.2, 220);
    hubLight.position.set(0, 50, 0);
    world.add(hubLight);

    // 6. Ground Grid & Base Slab
    const grid = new THREE.GridHelper(420, 42, 0x1c3a5c, 0x0d1a2e);
    grid.position.y = 0;
    world.add(grid);

    const groundMat = new THREE.MeshBasicMaterial({ color: 0x030509, transparent: true, opacity: 0.55 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    world.add(ground);

    // 7. Starfield Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 900;
      starPos[i * 3 + 1] = Math.random() * 300 + 40;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 900;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x3a5a8a, size: 1.4, transparent: true, opacity: 0.5 })
    );
    scene.add(stars);

    // 8. 70 Procedural City Buildings
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const cityBounds = 165;
    const plaza = 34;

    function addBuilding(x: number, z: number, w: number, d: number, h: number, tint?: number) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a1424,
        emissive: tint || 0x0b2a44,
        emissiveIntensity: 0.35,
        roughness: 0.85,
        metalness: 0.1,
      });
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      world.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x2a5a8a, transparent: true, opacity: 0.55 })
      );
      line.position.copy(mesh.position);
      world.add(line);

      // Sparse emissive window lights
      if (Math.random() > 0.4) {
        const wGeo = new THREE.SphereGeometry(0.5, 4, 4);
        const wMat = new THREE.MeshBasicMaterial({ color: 0x6fd6ff });
        for (let i = 0; i < 3; i++) {
          const win = new THREE.Mesh(wGeo, wMat);
          win.position.set(
            x + (Math.random() - 0.5) * w * 0.7,
            Math.random() * h,
            z + (Math.random() - 0.5) * d * 0.7
          );
          world.add(win);
        }
      }
      return mesh;
    }

    for (let i = 0; i < 70; i++) {
      let x = 0;
      let z = 0;
      let dist = 0;
      do {
        x = rand(-cityBounds, cityBounds);
        z = rand(-cityBounds, cityBounds);
        dist = Math.hypot(x, z);
      } while (dist < plaza);
      const w = rand(5, 11);
      const d = rand(5, 11);
      const h = rand(4, 30) * (1 - Math.min(dist / cityBounds, 1) * 0.3 + 0.3);
      addBuilding(x, z, w, d, h);
    }

    // 9. Central Operations Command Hub
    const hubGroup = new THREE.Group();
    world.add(hubGroup);

    const hubBase = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 24, 6, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0a1626,
        emissive: 0x123a5c,
        emissiveIntensity: 0.5,
        roughness: 0.6,
      })
    );
    hubBase.position.y = 3;
    hubGroup.add(hubBase);

    const hubCore = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 26, 16),
      new THREE.MeshStandardMaterial({
        color: 0x0d2138,
        emissive: 0x2fa8e8,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      })
    );
    hubCore.position.y = 16;
    hubGroup.add(hubCore);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4fd6ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(16, 0.35, 8, 48), ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 9;
    hubGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(11, 0.3, 8, 48), ringMat.clone());
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 22;
    hubGroup.add(ring2);

    const hubGlow = new THREE.PointLight(0x4fd6ff, 4, 90);
    hubGlow.position.y = 20;
    hubGroup.add(hubGlow);

    // 10. 4 Signal Towers & Glowing Curved Conduits
    const towerAnchors: { [key: string]: THREE.Vector3 } = {};

    TOWERS.forEach((t) => {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, t.h, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      beam.position.set(t.x, t.h / 2, t.z);
      world.add(beam);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 12, 12),
        new THREE.MeshBasicMaterial({ color: t.color })
      );
      tip.position.set(t.x, t.h, t.z);
      world.add(tip);

      const pl = new THREE.PointLight(t.color, 2.6, 60);
      pl.position.set(t.x, t.h * 0.5, t.z);
      world.add(pl);

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 0.6, 20),
        new THREE.MeshStandardMaterial({ color: 0x0a1220, emissive: t.color, emissiveIntensity: 0.35 })
      );
      pad.position.set(t.x, 0.3, t.z);
      world.add(pad);

      towerAnchors[t.id] = new THREE.Vector3(t.x, t.h, t.z);
    });

    // Connector Paths from Hub to Towers
    const connectorCurves = TOWERS.map((t) => {
      const mid1 = new THREE.Vector3(t.x * 0.35, 0.6, 0);
      const mid2 = new THREE.Vector3(t.x * 0.7, 0.6, t.z * 0.55);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.6, 0),
        mid1,
        mid2,
        new THREE.Vector3(t.x, 0.6, t.z),
      ]);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 40, 0.55, 6, false),
        new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.75 })
      );
      world.add(tube);
      return curve;
    });

    // 11. Traveling Field Team Alpha Node
    const teamCurve = connectorCurves[3];
    const teamMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x9fd8ff })
    );
    world.add(teamMesh);
    const teamGlow = new THREE.PointLight(0x9fd8ff, 1.6, 30);
    world.add(teamGlow);

    // 12. 3D to 2D Screen Projector Helper
    const tmpV = new THREE.Vector3();
    function project(vec3: THREE.Vector3, offsetY = 0): LabelProjectedPos {
      tmpV.copy(vec3);
      tmpV.y += offsetY;
      tmpV.project(camera);
      return {
        x: (tmpV.x * 0.5 + 0.5) * W,
        y: (1 - (tmpV.y * 0.5 + 0.5)) * H,
        visible: tmpV.z < 1,
      };
    }

    // 13. Interactive Mouse Parallax
    let targetRotY = 0.55;
    let currentRotY = 0.55;
    let targetTiltX = 0;
    let currentTiltX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targetRotY = 0.55 + nx * 0.35;
      targetTiltX = ny * 10;
    };

    const handleMouseLeave = () => {
      targetRotY = 0.55;
      targetTiltX = 0;
    };

    stage.addEventListener("mousemove", handleMouseMove);
    stage.addEventListener("mouseleave", handleMouseLeave);

    // 14. Resize Handler
    const handleResize = () => {
      if (!stage || !renderer) return;
      W = stage.clientWidth;
      H = stage.clientHeight;
      camera.left = -frustum;
      camera.right = frustum;
      camera.top = frustum * (H / W);
      camera.bottom = -frustum * (H / W);
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };

    window.addEventListener("resize", handleResize);

    // 15. Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth camera lerp
      currentRotY += (targetRotY - currentRotY) * 0.03;
      currentTiltX += (targetTiltX - currentTiltX) * 0.03;
      world.rotation.y = currentRotY + Math.sin(t * 0.05) * 0.02;

      // Energy rings rotation
      ring1.rotation.z = t * 0.4;
      ring2.rotation.z = -t * 0.6;
      hubCore.rotation.y = t * 0.3;

      const camDist = 335;
      camera.position.x = Math.sin(currentTiltX * 0.002) * camDist + 230;
      camera.position.y = 190 + Math.sin(t * 0.15) * 4;
      camera.lookAt(0, 10, 0);

      // Field Team movement along conduit
      const progress = (t * 0.05) % 1;
      const pos = teamCurve.getPointAt(progress);
      teamMesh.position.copy(pos);
      teamMesh.position.y = 1.5;
      teamGlow.position.copy(teamMesh.position);

      // Project labels to 2D coordinates
      const newMarkerPos: { [key: string]: LabelProjectedPos } = {};
      TOWERS.forEach((tw) => {
        const anchor = towerAnchors[tw.id];
        if (anchor) {
          newMarkerPos[tw.id] = project(anchor, 6);
        }
      });
      setMarkerPositions(newMarkerPos);

      const hp = project(new THREE.Vector3(0, 26, 0));
      setHubPosition(hp);

      const tp = project(teamMesh.position, 5);
      setTeamPosition(tp);

      renderer.render(scene, camera);
    }

    animate();

    // 16. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", handleMouseLeave);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[560px] lg:h-[78vh] rounded-2xl overflow-hidden bg-radial-vignette border border-slate-800/90 shadow-2xl select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #0a1226 0%, #04060c 72%)",
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Stage Vignette Radial Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 45%, transparent 45%, #04060c 92%)",
        }}
      />

      {/* ========================================================================= */}
      {/* FLOATING PROJECTED HTML 2D LABELS                                         */}
      {/* ========================================================================= */}
      
      {/* Incident Markers */}
      {TOWERS.map((t) => {
        const pos = markerPositions[t.id];
        if (!pos) return null;

        return (
          <div
            key={t.id}
            className={`absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-opacity duration-200 z-20 flex items-start gap-2.5 p-2.5 rounded-xl border backdrop-blur-md shadow-2xl ${
              t.cls === "critical"
                ? "bg-[#0b1122]/90 border-red-500/40 text-red-400"
                : t.cls === "high"
                ? "bg-[#0b1122]/90 border-amber-500/40 text-amber-400"
                : t.cls === "resolved"
                ? "bg-[#0b1122]/90 border-emerald-500/40 text-emerald-400"
                : "bg-[#0b1122]/90 border-sky-500/40 text-sky-400"
            }`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              opacity: pos.visible ? 1 : 0,
            }}
          >
            {/* Icon Pill */}
            <div
              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                t.cls === "critical"
                  ? "bg-red-950 border border-red-800 text-red-400"
                  : t.cls === "high"
                  ? "bg-amber-950 border border-amber-800 text-amber-400"
                  : t.cls === "resolved"
                  ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                  : "bg-blue-950 border border-blue-800 text-sky-400"
              }`}
            >
              {t.iconType === "alert" ? (
                <AlertTriangle className="w-2.5 h-2.5" />
              ) : t.iconType === "check" ? (
                <Check className="w-2.5 h-2.5" />
              ) : (
                <Info className="w-2.5 h-2.5" />
              )}
            </div>

            {/* Label Data */}
            <div className="text-left font-mono">
              <div className="text-xs font-bold text-white leading-tight">{t.id}</div>
              <div className="text-[10px] font-bold tracking-wider">{t.status}</div>
              <div className="text-[9.5px] text-slate-400">{t.count}</div>
            </div>
          </div>
        );
      })}

      {/* Hub Label */}
      <div
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-opacity duration-200 z-20 text-center px-4 py-2 rounded-xl bg-[#0b1122]/90 border border-slate-700/80 backdrop-blur-md font-mono text-[11px] font-bold text-slate-200 tracking-wider leading-tight shadow-xl"
        style={{
          left: `${hubPosition.x}px`,
          top: `${hubPosition.y}px`,
          opacity: hubPosition.visible ? 1 : 0,
        }}
      >
        OPERATIONS<br />COMMAND HUB
      </div>

      {/* Field Team Alpha Label */}
      <div
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-opacity duration-200 z-20 p-2.5 rounded-xl bg-[#0b1122]/90 border border-sky-500/40 backdrop-blur-md shadow-2xl text-left font-mono"
        style={{
          left: `${teamPosition.x}px`,
          top: `${teamPosition.y}px`,
          opacity: teamPosition.visible ? 1 : 0,
        }}
      >
        <div className="text-xs font-bold text-white flex items-center gap-1.5">
          <Truck className="w-3 h-3 text-sky-400" />
          <span>FIELD TEAM ALPHA</span>
        </div>
        <div className="text-[10px] text-slate-400">Enroute to site</div>
        <div className="text-[10px] text-sky-400 font-bold mt-0.5">&#128205; 2.4 km away</div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING ACTIVE INCIDENTS HUD PANEL (BOTTOM RIGHT)                         */}
      {/* ========================================================================= */}
      <div className="absolute right-4 bottom-4 z-30 p-4 rounded-2xl bg-[#0b1122]/90 border border-slate-700/80 backdrop-blur-xl shadow-2xl font-mono text-left hidden sm:block min-w-[190px]">
        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
          ACTIVE INCIDENTS
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">12</span>
          <span className="text-xs font-bold text-red-400">&uarr; 2</span>
        </div>
        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
          Requiring attention
        </div>
        <div className="flex items-end gap-1 h-6 mt-3">
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[30%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[45%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[38%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[60%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[52%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[78%]" />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-red-800 to-red-500 h-[100%]" />
        </div>
      </div>

    </div>
  );
}

export default ThreeHeroScene;
