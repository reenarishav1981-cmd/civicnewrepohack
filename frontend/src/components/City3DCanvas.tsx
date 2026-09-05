"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface TowerData {
  name: string;
  id: string;
  status: string;
  count: string;
  x: number;
  z: number;
  h: number;
  color: number;
  hexColor: string;
  cls: string;
}

export const City3DCanvas: React.FC<{ className?: string; height?: string | number }> = ({
  className = "",
  height = "100%",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [activeIncidentsCount] = useState(12);

  useEffect(() => {
    const stage = mountRef.current;
    const labelsRoot = labelsRef.current;
    if (!stage || !labelsRoot) return;

    let W = stage.clientWidth || 800;
    let H = stage.clientHeight || 560;

    // 1. SCENE & FOG
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060c, 0.0028);

    // 2. ORTHOGRAPHIC CAMERA (Exact Isometric Angle from Reference HTML)
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

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    stage.appendChild(renderer.domElement);

    const world = new THREE.Group();
    scene.add(world);

    // 4. LIGHTS
    scene.add(new THREE.AmbientLight(0x1a2a4a, 1.1));
    const hubLight = new THREE.PointLight(0x4fd6ff, 3.2, 220);
    hubLight.position.set(0, 50, 0);
    world.add(hubLight);

    // 5. GROUND & GRID
    const grid = new THREE.GridHelper(420, 42, 0x1c3a5c, 0x0d1a2e);
    grid.position.y = 0;
    world.add(grid);

    const groundMat = new THREE.MeshBasicMaterial({ color: 0x030509, transparent: true, opacity: 0.55 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    world.add(ground);

    // 6. STARFIELD PARTICLES
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

    // 7. PROCEDURAL CITY BUILDINGS
    function addBuilding(x: number, z: number, w: number, d: number, h: number) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a1424,
        emissive: 0x0b2a44,
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

      // Sparse glowing windows
      if (Math.random() > 0.4) {
        const wGeo = new THREE.SphereGeometry(0.5, 4, 4);
        const wMat = new THREE.MeshBasicMaterial({ color: 0x6fd6ff });
        for (let i = 0; i < 3; i++) {
          const win = new THREE.Mesh(wGeo, wMat);
          win.position.set(x + (Math.random() - 0.5) * w * 0.7, Math.random() * h, z + (Math.random() - 0.5) * d * 0.7);
          world.add(win);
        }
      }
      return mesh;
    }

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const cityBounds = 165;
    const plaza = 34;
    for (let i = 0; i < 70; i++) {
      let x = 0, z = 0, dist = 0;
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

    // 8. CENTRAL OPERATIONS COMMAND HUB
    const hubGroup = new THREE.Group();
    world.add(hubGroup);

    const hubBase = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 24, 6, 24),
      new THREE.MeshStandardMaterial({ color: 0x0a1626, emissive: 0x123a5c, emissiveIntensity: 0.5, roughness: 0.6 })
    );
    hubBase.position.y = 3;
    hubGroup.add(hubBase);

    const hubCore = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 26, 16),
      new THREE.MeshStandardMaterial({ color: 0x0d2138, emissive: 0x2fa8e8, emissiveIntensity: 0.9, roughness: 0.4 })
    );
    hubCore.position.y = 16;
    hubGroup.add(hubCore);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4fd6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
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

    // 9. SIGNAL TOWERS
    const TOWERS: (TowerData & { anchor?: THREE.Vector3 })[] = [
      { name: "critical", id: "CP-1024", status: "CRITICAL", count: "18 Signals", x: -18, z: -118, h: 70, color: 0xf04444, hexColor: "#f04444", cls: "critical" },
      { name: "high",     id: "CP-1019", status: "HIGH",     count: "12 Signals", x: 112, z: -46,  h: 52, color: 0xf5a524, hexColor: "#f5a524", cls: "high" },
      { name: "resolved", id: "CP-0991", status: "RESOLVED", count: "8 Signals",  x: 150, z: 64,   h: 26, color: 0x22c55e, hexColor: "#22c55e", cls: "resolved" },
      { name: "standard", id: "CP-1033", status: "STANDARD", count: "6 Signals",  x: -95, z: 70,   h: 20, color: 0x4fa8ff, hexColor: "#4fa8ff", cls: "standard" },
    ];

    TOWERS.forEach((t) => {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, t.h, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      beam.position.set(t.x, t.h / 2, t.z);
      world.add(beam);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), new THREE.MeshBasicMaterial({ color: t.color }));
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

      t.anchor = new THREE.Vector3(t.x, t.h, t.z);
    });

    // 10. GLOWING ARTERIAL CONNECTOR PATHS
    function connector(t: TowerData) {
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
    }

    const paths = TOWERS.map((t) => ({ curve: connector(t), color: t.color }));

    // 11. MOVING FIELD TEAM VEHICLE TELEMETRY
    const teamCurve = paths[3].curve;
    const teamMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
    world.add(teamMesh);

    const teamGlow = new THREE.PointLight(0x9fd8ff, 1.6, 30);
    world.add(teamGlow);

    // 12. FLOATING HTML HUD LABELS
    const currentLabelsRoot = labelsRoot;
    currentLabelsRoot.innerHTML = "";
    function makeLabel(html: string, cls: string) {
      const el = document.createElement("div");
      el.innerHTML = html;
      el.className = cls;
      currentLabelsRoot.appendChild(el);
      return el;
    }

    const iconTri = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>`;
    const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M4 12l5 5L20 6"/></svg>`;
    const iconInfo = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></svg>`;

    const markerMap = [
      { t: TOWERS[0], icon: iconTri },
      { t: TOWERS[1], icon: iconTri },
      { t: TOWERS[2], icon: iconCheck },
      { t: TOWERS[3], icon: iconInfo },
    ].map((m) => {
      const el = makeLabel(
        `<div class="flex items-center gap-2 p-2 rounded-xl bg-[#0b1122]/90 border border-[#1c2740] backdrop-blur-md shadow-2xl font-mono-data text-xs pointer-events-auto cursor-pointer hover:border-[#53d7ff] transition">
           <div class="w-5 h-5 rounded flex items-center justify-center shrink-0" style="color:${m.t.hexColor}; background:${m.t.hexColor}20; border:1px solid ${m.t.hexColor}40">${m.icon}</div>
           <div>
             <div class="font-bold text-white tracking-wider">${m.t.id}</div>
             <div class="text-[10px] font-bold" style="color:${m.t.hexColor}">${m.t.status}</div>
             <div class="text-[9px] text-[#5c6480]">${m.t.count}</div>
           </div>
         </div>`,
        "absolute -translate-x-1/2 -translate-y-full z-10 transition-opacity duration-200"
      );
      return { t: m.t, el };
    });

    const hubLabelEl = makeLabel(
      `<div class="px-3.5 py-1.5 rounded-xl bg-[#0b1122]/90 border border-[#2a4a7a] backdrop-blur-md text-[11px] font-mono-data font-bold tracking-wider text-[#7ab8ff] text-center shadow-2xl pointer-events-none">
         OPERATIONS<br><span class="text-[9px] text-[#5c6480]">COMMAND HUB</span>
       </div>`,
      "absolute -translate-x-1/2 -translate-y-full z-10 pointer-events-none"
    );

    const teamLabelEl = makeLabel(
      `<div class="p-2 rounded-xl bg-[#0b1122]/90 border border-[#1c2740] backdrop-blur-md shadow-2xl font-mono-data text-[11px] pointer-events-none">
         <div class="font-bold text-white flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#53d7ff] animate-pulse"></span>FIELD SQUAD ALPHA</div>
         <div class="text-[9px] text-[#8b93ab]">En route to site</div>
         <div class="text-[9px] text-[#53d7ff] font-bold mt-0.5">📍 2.4 km away</div>
       </div>`,
      "absolute -translate-x-1/2 -translate-y-full z-10 pointer-events-none"
    );

    // 13. PROJECT 3D COORDINATES TO 2D SCREEN PIXELS
    const tmpV = new THREE.Vector3();
    function project(vec3: THREE.Vector3, offsetY = 0) {
      tmpV.copy(vec3);
      tmpV.y += offsetY;
      tmpV.project(camera);
      return {
        x: (tmpV.x * 0.5 + 0.5) * W,
        y: (1 - (tmpV.y * 0.5 + 0.5)) * H,
        visible: tmpV.z < 1,
      };
    }

    // 14. INTERACTIVE MOUSE PARALLAX
    let targetRotY = 0.55;
    let currentRotY = 0.55;
    let targetTiltX = 0;
    let currentTiltX = 0;

    const onMouseMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targetRotY = 0.55 + nx * 0.35;
      targetTiltX = ny * 10;
    };
    const onMouseLeave = () => {
      targetRotY = 0.55;
      targetTiltX = 0;
    };

    stage.addEventListener("mousemove", onMouseMove);
    stage.addEventListener("mouseleave", onMouseLeave);

    // 15. ANIMATION LOOP
    let animationFrameId: number;
    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      currentRotY += (targetRotY - currentRotY) * 0.03;
      currentTiltX += (targetTiltX - currentTiltX) * 0.03;
      world.rotation.y = currentRotY + Math.sin(t * 0.05) * 0.02;

      ring1.rotation.z = t * 0.4;
      ring2.rotation.z = -t * 0.6;
      hubCore.rotation.y = t * 0.3;

      const camDist = 335;
      camera.position.x = Math.sin(currentTiltX * 0.002) * camDist + 230;
      camera.position.y = 190 + Math.sin(t * 0.15) * 4;
      camera.lookAt(0, 10, 0);

      // Move Field Team marker smoothly along arterial curve
      const progress = (t * 0.05) % 1;
      const pos = teamCurve.getPointAt(progress);
      teamMesh.position.copy(pos);
      teamMesh.position.y = 1.5;
      teamGlow.position.copy(teamMesh.position);

      // Update HTML label positions
      markerMap.forEach((m) => {
        if (m.t.anchor) {
          const p = project(m.t.anchor, 6);
          m.el.style.left = `${p.x}px`;
          m.el.style.top = `${p.y}px`;
          m.el.style.opacity = p.visible ? "1" : "0";
        }
      });

      const hp = project(new THREE.Vector3(0, 26, 0));
      hubLabelEl.style.left = `${hp.x}px`;
      hubLabelEl.style.top = `${hp.y}px`;

      const tp = project(teamMesh.position, 5);
      teamLabelEl.style.left = `${tp.x}px`;
      teamLabelEl.style.top = `${tp.y}px`;

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      W = stage.clientWidth || 800;
      H = stage.clientHeight || 560;
      camera.left = -frustum;
      camera.right = frustum;
      camera.top = frustum * (H / W);
      camera.bottom = -frustum * (H / W);
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("mousemove", onMouseMove);
      stage.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && stage.contains(renderer.domElement)) {
        stage.removeChild(renderer.domElement);
      }
      renderer.dispose();
      labelsRoot.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden select-none bg-[#04060c] ${className}`}
      style={{ height }}
    >
      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,#04060c_92%)] z-[5]" />

      {/* Floating HTML 3D Tracked HUD Labels */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none z-[6]" />

      {/* Real-time Incidents Live HUD Bar (Bottom Right from Reference) */}
      <div className="absolute right-4 bottom-4 z-[7] p-4 rounded-xl bg-[#0b1122]/90 border border-[#1c2740] backdrop-blur-md min-w-[190px] font-mono-data text-xs shadow-2xl pointer-events-none">
        <div className="text-[10px] tracking-[1.5px] text-[#5c6480] font-bold mb-2">ACTIVE INCIDENTS</div>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-3xl font-bold text-white">{activeIncidentsCount}</span>
          <span className="text-xs text-[#f04444] font-bold">↑ 2</span>
        </div>
        <div className="text-[11px] text-[#8b93ab] mt-0.5">Requiring attention</div>
        <div className="flex items-end gap-1 h-6 mt-3">
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "30%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "45%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "38%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "60%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "52%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "78%" }} />
          <span className="w-1.5 rounded-t bg-gradient-to-t from-[#7a1e1e] to-[#f04444]" style={{ height: "100%" }} />
        </div>
      </div>
    </div>
  );
};

export default City3DCanvas;
