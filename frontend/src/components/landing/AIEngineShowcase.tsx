"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { 
  Sparkles, 
  Layers, 
  ArrowRight, 
  X, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Info,
  Maximize2
} from "lucide-react";

interface EngineMeta {
  num: string;
  id: string;
  name: string;
  color: string;
  colorHex: number;
  weight: string;
  score: string;
  tagline: string;
  what: string;
  pipeline: Array<{ step: string; sub: string }>;
  example: Array<{ k: string; v: string }>;
  importance: string;
}

const ENGINE_METADATA: Record<string, EngineMeta> = {
  semantic: {
    num: "01",
    id: "semantic",
    name: "Semantic Intelligence",
    color: "#4d9fff",
    colorHex: 0x4d9fff,
    weight: "25%",
    score: "0.86",
    tagline: "Understands issue descriptions using civic lexicon & embeddings.",
    what: "Understands the meaning of citizen descriptions using a deterministic civic-domain lexical embedding engine.",
    pipeline: [
      { step: "Citizen Description", sub: "Unstructured natural language input" },
      { step: "Civic Terminology Detection", sub: "28-dimensional vocabulary mapping" },
      { step: "Feature Vectorization", sub: "Dense keyword frequency weights" },
      { step: "L2 Normalization & Cosine Sim", sub: "Directional similarity [0.0 - 1.0]" }
    ],
    example: [
      { k: "Citizen Input", v: '"Large crater near the school on the main road"' },
      { k: "Detected Concepts", v: "pothole, crater, road damage, safety risk" },
      { k: "Feature Dimension", v: "28-D Lexical Vector (L2 Normalized)" },
      { k: "Cosine Similarity", v: "0.86 (High Confidence Match)" }
    ],
    importance: "Detects semantically related reports even when citizens use different vernacular or dialects to describe the same physical real-world problem."
  },
  geo: {
    num: "02",
    id: "geo",
    name: "Geospatial Intelligence",
    color: "#34d399",
    colorHex: 0x34d399,
    weight: "35%",
    score: "0.96",
    tagline: "Calculates real-world distance, proximity & sensitive-zone impact.",
    what: "Calculates real-world geographic proximity between incoming citizen reports and existing incident clusters using spherical geometry.",
    pipeline: [
      { step: "Citizen GPS Coordinates", sub: "Mobile telemetry latitude & longitude" },
      { step: "Cluster Centroid Proximity", sub: "Existing incident geospatial radius" },
      { step: "Haversine Distance Math", sub: "Great-circle surface calculation (meters)" },
      { step: "Non-Linear Decay Score", sub: "Municipal cluster horizon (650m cutoff)" }
    ],
    example: [
      { k: "Incoming Report", v: "21.1702° N, 72.8311° E" },
      { k: "Existing Incident", v: "21.1705° N, 72.8314° E" },
      { k: "Surface Distance", v: "42 metres" },
      { k: "Municipal Horizon", v: "650 metres (Score: 0.96)" }
    ],
    importance: "Prevents geographically distant incidents from being incorrectly merged even if their textual descriptions or photos look identical."
  },
  visual: {
    num: "03",
    id: "visual",
    name: "Visual Evidence Intelligence",
    color: "#b18cf7",
    colorHex: 0xb18cf7,
    weight: "20%",
    score: "0.78",
    tagline: "Analyzes images using perceptual hashing & morphology detection.",
    what: "Analyzes citizen-submitted photographic evidence to compare physical hazard appearance and structural distress.",
    pipeline: [
      { step: "Citizen Photo Ingestion", sub: "Base64 / Data URL upload validation" },
      { step: "Image Signature Extraction", sub: "SHA-256 16-character perceptual digest" },
      { step: "Hazard Morphology Detection", sub: "Pavement, hydraulic, debris classification" },
      { step: "Visual Similarity Matching", sub: "Weighted digest character agreement" }
    ],
    example: [
      { k: "Evidence Status", v: "AVAILABLE (Ground truth captured)" },
      { k: "Detected Hazard", v: "Pavement Distress / Crater Morphology" },
      { k: "Digest Match", v: "14 / 16 Hexadecimal Characters" },
      { k: "Visual Score", v: "0.78 (Strong Photographic Corroboration)" }
    ],
    importance: "Provides additional physical evidence when multiple citizens photograph the same hazard. Visual evidence alone cannot force a merge without geospatial validation."
  },
  temporal: {
    num: "04",
    id: "temporal",
    name: "Temporal Intelligence",
    color: "#fb923c",
    colorHex: 0xfb923c,
    weight: "10%",
    score: "0.74",
    tagline: "Measures recency & time decay to identify active, ongoing issues.",
    what: "Measures how closely reports occur in time to determine whether they describe an active, concurrent ongoing incident.",
    pipeline: [
      { step: "Incoming Timestamp", sub: "ISO-8601 citizen intake clock" },
      { step: "Cluster Genesis Timestamp", sub: "Master incident initiation time" },
      { step: "Elapsed Time Delta (Δt)", sub: "Hours between submissions" },
      { step: "72-Hour Exponential Decay", sub: "Temporal proximity decay curve" }
    ],
    example: [
      { k: "Incoming Report", v: "2 hours ago" },
      { k: "Existing Cluster", v: "5 hours ago" },
      { k: "Elapsed Time Gap", v: "3.0 hours" },
      { k: "Temporal Score", v: "0.74 (Active Ongoing Surge)" }
    ],
    importance: "Helps distinguish active ongoing municipal emergencies from unrelated reports submitted weeks or months apart at the same recurring location."
  },
  category: {
    num: "05",
    id: "category",
    name: "Category Intelligence",
    color: "#f2c744",
    colorHex: 0xf2c744,
    weight: "10%",
    score: "0.81",
    tagline: "Checks category compatibility & domain relationships.",
    what: "Evaluates category compatibility and domain relationships between municipal civic issue classifications.",
    pipeline: [
      { step: "Incoming Category", sub: "Citizen or NLP-inferred domain" },
      { step: "Cluster Target Category", sub: "Existing incident primary class" },
      { step: "Domain Taxonomy Graph", sub: "Roads, Water, Sanitation, Power" },
      { step: "Compatibility Matrix", sub: "Exact match, related, or conflict" }
    ],
    example: [
      { k: "Incoming Label", v: "ROAD DAMAGE" },
      { k: "Existing Cluster", v: "POTHOLE" },
      { k: "Domain Affinity", v: "STRONG COMPATIBILITY MATCH" },
      { k: "Category Score", v: "0.81 (Structural Alignment)" }
    ],
    importance: "Adds structured domain taxonomy checks to ensure sewage spills are never conflated into road resurfacing tickets without dedicated review."
  },
  fusion: {
    num: "CORE",
    id: "fusion",
    name: "Multimodal Fusion Core",
    color: "#38bdf8",
    colorHex: 0x38bdf8,
    weight: "100%",
    score: "82%",
    tagline: "Fuses five independent signals into a single explainable AI decision.",
    what: "Combines Geospatial, Semantic, Visual, Temporal, and Category signals with dynamic weight normalization into a single transparent score.",
    pipeline: [
      { step: "Multi-Signal Extraction", sub: "Geo (35%), Sem (25%), Vis (20%), Temp (10%), Cat (10%)" },
      { step: "Dynamic Normalization", sub: "Redistributes visual weight if photos absent" },
      { step: "Weighted Composite Sum", sub: "Score = wg*G + ws*S + wv*V + wt*T + wc*C" },
      { step: "Automated Decision", sub: ">=72% duplicate link; <50% new incident" }
    ],
    example: [
      { k: "Formula", v: "Score = 0.35(0.92) + 0.25(0.86) + 0.20(0.78) + 0.10(0.74) + 0.10(0.81)" },
      { k: "Fused Score", v: "82% (Normalized 0 - 100)" },
      { k: "Classification", v: "HIGH PROBABILITY DUPLICATE" },
      { k: "Action", v: "LINK TO EXISTING INCIDENT CLUSTER" }
    ],
    importance: "Eliminates duplicate municipal dispatches, concentrates community evidence, and prevents operational alert fatigue."
  }
};

const ENGINE_ORDER = ["semantic", "geo", "visual", "temporal", "category", "fusion"];

const ORBIT_LABELS = [
  { id: "fusion", shortName: "Fusion Core", fullName: "Multimodal Fusion Core", color: "#38bdf8", weight: "100%" },
  { id: "semantic", shortName: "Semantic", fullName: "Semantic Intelligence", color: "#4d9fff", weight: "25%" },
  { id: "geo", shortName: "Geospatial", fullName: "Geospatial Intelligence", color: "#34d399", weight: "35%" },
  { id: "visual", shortName: "Visual", fullName: "Visual Evidence", color: "#b18cf7", weight: "20%" },
  { id: "temporal", shortName: "Temporal", fullName: "Temporal Dynamics", color: "#fb923c", weight: "10%" },
  { id: "category", shortName: "Category", fullName: "Category Domain", color: "#f2c744", weight: "10%" },
];

export function AIEngineShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);
  const labelElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [hoveredEngine, setHoveredEngine] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // References to communicate with Three.js animation loop
  const selectEngineRef = useRef<(id: string) => void>(() => {});
  const resetEngineRef = useRef<() => void>(() => {});

  useEffect(() => {
    const holder = canvasHolderRef.current;
    if (!holder) return;

    let W = holder.clientWidth;
    let H = holder.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
    camera.position.set(0, 0.6, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    holder.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x6677aa, 0.9));
    const pl = new THREE.PointLight(0x4d9fff, 2.4, 30);
    pl.position.set(4, 4, 6);
    scene.add(pl);

    // CENTRAL FUSION CORE
    const core = new THREE.Group();
    core.userData = { id: "fusion", type: "core" };
    scene.add(core);

    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x4d9fff, wireframe: true, transparent: true, opacity: 0.85 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData = { id: "fusion" };
    core.add(coreMesh);

    const coreGeo2 = new THREE.IcosahedronGeometry(1.15, 3);
    const coreMat2 = new THREE.MeshBasicMaterial({ color: 0x9fc4ff, wireframe: true, transparent: true, opacity: 0.12 });
    const coreMesh2 = new THREE.Mesh(coreGeo2, coreMat2);
    core.add(coreMesh2);

    const glowGeo = new THREE.SphereGeometry(0.88, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x1c3a66, transparent: true, opacity: 0.55 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.userData = { id: "fusion", name: "Multimodal Fusion Core" };
    core.add(glowMesh);

    // Neuron particles inside core
    const neuronCount = 240;
    const npos = new Float32Array(neuronCount * 3);
    for (let i = 0; i < neuronCount; i++) {
      const r = 0.95 * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      npos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      npos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      npos[i * 3 + 2] = r * Math.cos(ph);
    }
    const npGeo = new THREE.BufferGeometry();
    npGeo.setAttribute("position", new THREE.BufferAttribute(npos, 3));
    const npMat = new THREE.PointsMaterial({ color: 0xbfe0ff, size: 0.035, transparent: true, opacity: 0.9 });
    core.add(new THREE.Points(npGeo, npMat));

    // 5 ORBITING ENGINE NODES
    const engineData = [
      { id: "semantic", name: "Semantic", color: 0x4d9fff, weight: 25, angle: 90 },
      { id: "geo", name: "Geospatial", color: 0x34d399, weight: 35, angle: 18 },
      { id: "temporal", name: "Temporal", color: 0xfb923c, weight: 10, angle: -54 },
      { id: "category", name: "Category", color: 0xf2c744, weight: 10, angle: 234 },
      { id: "visual", name: "Visual", color: 0xb18cf7, weight: 20, angle: 162 },
    ];

    const orbitRadius = 3.05;
    const nodes: Array<{
      id: string;
      g: THREE.Group;
      coreMesh: THREE.Mesh;
      glowMesh: THREE.Mesh;
      ring: THREE.Mesh;
      glowMat: THREE.MeshBasicMaterial;
      coreMat: THREE.MeshStandardMaterial;
      base: THREE.Vector3;
      speed: number;
      phase: number;
    }> = [];
    const connectionLines: Array<{ line: THREE.Line; mat: THREE.LineBasicMaterial; id: string }> = [];
    const clickableObjects: THREE.Object3D[] = [glowMesh, coreMesh];
    const streamParticles: Array<{
      points: THREE.Points;
      geo: THREE.BufferGeometry;
      mat: THREE.PointsMaterial;
      progress: Float32Array;
      baseVec: THREE.Vector3;
      id: string;
    }> = [];

    engineData.forEach((e) => {
      const rad = THREE.MathUtils.degToRad(e.angle);
      const x = Math.cos(rad) * orbitRadius;
      const y = Math.sin(rad * 0.55) * 0.9;
      const z = Math.sin(rad) * orbitRadius;

      // Line to core
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: e.color, transparent: true, opacity: 0.45 });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      scene.add(lineMesh);
      connectionLines.push({ line: lineMesh, mat: lineMat, id: e.id });

      // Group
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.userData = { id: e.id, name: `${e.name} Engine` };

      const nodeGlowMat = new THREE.MeshBasicMaterial({ color: e.color, transparent: true, opacity: 0.25 });
      const nodeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), nodeGlowMat);
      g.add(nodeGlow);

      const nodeCoreMat = new THREE.MeshStandardMaterial({
        color: e.color,
        emissive: e.color,
        emissiveIntensity: 0.9,
        roughness: 0.3,
      });
      const nodeCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), nodeCoreMat);
      nodeCore.userData = { id: e.id, name: `${e.name} Engine` };
      g.add(nodeCore);
      clickableObjects.push(nodeCore, nodeGlow);

      const ringGeo = new THREE.RingGeometry(0.24, 0.27, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: e.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.3;
      g.add(ring);

      scene.add(g);
      nodes.push({
        id: e.id,
        g,
        coreMesh: nodeCore,
        glowMesh: nodeGlow,
        ring,
        glowMat: nodeGlowMat,
        coreMat: nodeCoreMat,
        base: new THREE.Vector3(x, y, z),
        speed: 0.6 + Math.random() * 0.3,
        phase: Math.random() * 10,
      });

      // Stream particles
      const pCount = 14;
      const pPos = new Float32Array(pCount * 3);
      const pProgress = new Float32Array(pCount);
      for (let p = 0; p < pCount; p++) {
        pProgress[p] = p / pCount;
        pPos[p * 3] = x * (1 - pProgress[p]);
        pPos[p * 3 + 1] = y * (1 - pProgress[p]);
        pPos[p * 3 + 2] = z * (1 - pProgress[p]);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: e.color, size: 0.045, transparent: true, opacity: 0.7 });
      const pPoints = new THREE.Points(pGeo, pMat);
      scene.add(pPoints);
      streamParticles.push({
        points: pPoints,
        geo: pGeo,
        mat: pMat,
        progress: pProgress,
        baseVec: new THREE.Vector3(x, y, z),
        id: e.id,
      });
    });

    // Outer faint shell
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x1a2540, wireframe: true, transparent: true, opacity: 0.06 })
    );
    scene.add(shell);

    // Dust particles
    const dustCount = 260;
    const dpos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dpos[i * 3] = (Math.random() - 0.5) * 14;
      dpos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dpos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    const dMat = new THREE.PointsMaterial({ color: 0x5578aa, size: 0.02, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(dGeo, dMat));

    // Interaction controls
    let selectedId: string | null = null;
    let isDown = false, lastX = 0, lastY = 0, dragDistance = 0;
    let rotX = 0.15, rotY = 0.35, targetRotX = 0.15, targetRotY = 0.35;
    let dist = 9.5, targetDist = 9.5;
    const lookTarget = new THREE.Vector3(0, 0, 0);
    const currentLook = new THREE.Vector3(0, 0, 0);
    let autoRotate = true;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function getHitId(e: MouseEvent | PointerEvent): string | null {
      const rect = holder!.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableObjects, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.id && obj.parent) {
          obj = obj.parent;
        }
        return obj?.userData?.id || null;
      }
      return null;
    }

    const selectEngineHandler = (id: string) => {
      selectedId = id;
      setSelectedEngine(id);
      autoRotate = false;

      const isCore = id === "fusion";
      nodes.forEach((n) => {
        const isThis = n.id === id;
        if (isCore) {
          n.coreMat.opacity = 0.85;
          n.glowMat.opacity = 0.35;
          n.g.scale.setScalar(1.0);
        } else if (isThis) {
          n.coreMat.opacity = 1.0;
          n.glowMat.opacity = 0.75;
          n.glowMesh.scale.setScalar(1.4);
          n.g.scale.setScalar(1.35);
        } else {
          n.coreMat.opacity = 0.28;
          n.glowMat.opacity = 0.1;
          n.glowMesh.scale.setScalar(1.0);
          n.g.scale.setScalar(0.88);
        }
      });

      if (isCore) {
        coreMat.opacity = 1.0;
        glowMat.opacity = 0.85;
        core.scale.setScalar(1.25);
        targetRotX = 0.2;
        targetRotY = 0.4;
        targetDist = 7.5;
        lookTarget.set(0, 0.2, 0);
      } else {
        coreMat.opacity = 0.7;
        glowMat.opacity = 0.45;
        core.scale.setScalar(1.0);

        const activeNode = nodes.find((n) => n.id === id);
        if (activeNode) {
          const base = activeNode.base;
          const angle = Math.atan2(base.x, base.z);
          targetRotY = angle - 0.2;
          targetRotX = 0.18;
          targetDist = 8.0;
          lookTarget.set(base.x * 0.4 - 0.6, base.y * 0.4, base.z * 0.4);
        }
      }

      connectionLines.forEach((cl) => {
        if (isCore || cl.id === id) {
          cl.mat.opacity = 0.9;
        } else {
          cl.mat.opacity = 0.12;
        }
      });
    };

    const resetEngineHandler = () => {
      selectedId = null;
      setSelectedEngine(null);
      autoRotate = true;
      targetDist = 9.5;
      targetRotX = 0.15;
      lookTarget.set(0, 0, 0);

      nodes.forEach((n) => {
        n.coreMat.opacity = 1.0;
        n.glowMat.opacity = 0.25;
        n.glowMesh.scale.setScalar(1.0);
        n.g.scale.setScalar(1.0);
      });

      coreMat.opacity = 0.85;
      glowMat.opacity = 0.55;
      core.scale.setScalar(1.0);

      connectionLines.forEach((cl) => {
        cl.mat.opacity = 0.45;
      });
    };

    selectEngineRef.current = selectEngineHandler;
    resetEngineRef.current = resetEngineHandler;

    // Pointer events
    const onPointerDown = (e: PointerEvent) => {
      isDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dragDistance = 0;
      holder.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = holder.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (isDown) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        lastX = e.clientX;
        lastY = e.clientY;
        targetRotY += dx * 0.006;
        targetRotX += dy * 0.006;
        targetRotX = Math.max(-0.9, Math.min(0.9, targetRotX));
        autoRotate = false;
        setHoveredEngine(null);
        return;
      }

      const hitId = getHitId(e);
      if (hitId) {
        holder.style.cursor = "pointer";
        setHoveredEngine(hitId);
        setTooltipPos({ x: sx, y: sy });
      } else {
        holder.style.cursor = "grab";
        setHoveredEngine(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDown = false;
      try { holder.releasePointerCapture(e.pointerId); } catch {}
      if (dragDistance < 5) {
        const hitId = getHitId(e);
        if (hitId) {
          selectEngineHandler(hitId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDist += e.deltaY * 0.004;
      targetDist = Math.max(5.0, Math.min(14, targetDist));
    };

    holder.addEventListener("pointerdown", onPointerDown);
    holder.addEventListener("pointermove", onPointerMove);
    holder.addEventListener("pointerup", onPointerUp);
    holder.addEventListener("wheel", onWheel, { passive: false });

    // Resize
    const onResize = () => {
      if (!holder) return;
      W = holder.clientWidth;
      H = holder.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      if (autoRotate && !selectedId) {
        targetRotY += 0.0018;
      }

      rotX += (targetRotX - rotX) * 0.06;
      rotY += (targetRotY - rotY) * 0.06;
      dist += (targetDist - dist) * 0.08;
      currentLook.lerp(lookTarget, 0.08);

      camera.position.x = currentLook.x + Math.sin(rotY) * Math.cos(rotX) * dist;
      camera.position.z = currentLook.z + Math.cos(rotY) * Math.cos(rotX) * dist;
      camera.position.y = currentLook.y + Math.sin(rotX) * dist * 0.6 + 0.6;
      camera.lookAt(currentLook);

      coreMesh.rotation.y = t * 0.15;
      coreMesh.rotation.x = t * 0.08;
      coreMesh2.rotation.y = -t * 0.1;

      nodes.forEach((n) => {
        const bob = Math.sin(t * n.speed + n.phase) * 0.12;
        n.g.position.set(n.base.x, n.base.y + bob, n.base.z);
        n.ring.rotation.z = t * 0.6;

        // Project 3D node position to screen coordinates so the label orbits in real-time with the ball
        const el = labelElementsRef.current[n.id];
        if (el) {
          tempVec.copy(n.g.position);
          tempVec.y += 0.44; // Float directly above the orbiting ball
          tempVec.project(camera);

          const x = (tempVec.x * 0.5 + 0.5) * W;
          const y = (-tempVec.y * 0.5 + 0.5) * H;
          const inFront = tempVec.z < 1.0;

          if (inFront && x >= -100 && x <= W + 100 && y >= -40 && y <= H + 40) {
            const d = camera.position.distanceTo(n.g.position);
            const scale = Math.max(0.72, Math.min(1.12, 9.2 / d));
            const isSelected = selectedId === n.id;
            const opacity = selectedId && !isSelected ? 0.22 : (d > 10.5 ? 0.8 : 1.0);
            const zIndex = Math.round((25 - d) * 10);

            el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) scale(${scale})`;
            el.style.opacity = `${opacity}`;
            el.style.zIndex = `${zIndex}`;
            el.style.display = "flex";
          } else {
            el.style.display = "none";
          }
        }
      });

      // Project central core label
      const coreEl = labelElementsRef.current["fusion"];
      if (coreEl) {
        tempVec.set(0, 1.45, 0);
        tempVec.project(camera);

        const x = (tempVec.x * 0.5 + 0.5) * W;
        const y = (-tempVec.y * 0.5 + 0.5) * H;
        const inFront = tempVec.z < 1.0;

        if (inFront && x >= -100 && x <= W + 100 && y >= -40 && y <= H + 40) {
          const d = camera.position.length();
          const scale = Math.max(0.78, Math.min(1.1, 9.2 / d));
          const isSelected = selectedId === "fusion";
          const opacity = selectedId && !isSelected ? 0.28 : 1.0;
          const zIndex = Math.round((25 - d) * 10);

          coreEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) scale(${scale})`;
          coreEl.style.opacity = `${opacity}`;
          coreEl.style.zIndex = `${zIndex}`;
          coreEl.style.display = "flex";
        } else {
          coreEl.style.display = "none";
        }
      }

      // Stream particles
      streamParticles.forEach((sp) => {
        const isSelected = selectedId === sp.id;
        const isCore = selectedId === "fusion";
        const speed = isSelected || isCore ? 1.4 : 0.45;
        const count = sp.progress.length;
        const positions = (sp.geo.attributes.position as THREE.BufferAttribute).array as Float32Array;

        for (let p = 0; p < count; p++) {
          sp.progress[p] += dt * speed * 0.35;
          if (sp.progress[p] > 1.0) sp.progress[p] -= 1.0;
          const pr = sp.progress[p];
          positions[p * 3] = sp.baseVec.x * (1 - pr);
          positions[p * 3 + 1] = sp.baseVec.y * (1 - pr);
          positions[p * 3 + 2] = sp.baseVec.z * (1 - pr);
        }
        sp.geo.attributes.position.needsUpdate = true;
        sp.mat.opacity = isSelected || isCore ? 0.95 : 0.35;
        sp.mat.size = isSelected || isCore ? 0.06 : 0.035;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      holder.removeEventListener("pointerdown", onPointerDown);
      holder.removeEventListener("pointermove", onPointerMove);
      holder.removeEventListener("pointerup", onPointerUp);
      holder.removeEventListener("wheel", onWheel);
      if (renderer.domElement && holder.contains(renderer.domElement)) {
        holder.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const activeMeta = selectedEngine ? ENGINE_METADATA[selectedEngine] : null;

  const handleNextEngine = () => {
    const curIdx = ENGINE_ORDER.indexOf(selectedEngine || "semantic");
    const nextIdx = (curIdx + 1) % ENGINE_ORDER.length;
    selectEngineRef.current(ENGINE_ORDER[nextIdx]);
  };

  const handlePrevEngine = () => {
    const curIdx = ENGINE_ORDER.indexOf(selectedEngine || "semantic");
    const prevIdx = (curIdx - 1 + ENGINE_ORDER.length) % ENGINE_ORDER.length;
    selectEngineRef.current(ENGINE_ORDER[prevIdx]);
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden font-sans"
      aria-label="CivicPulse Interactive Multimodal AI Engine Observatory"
    >
      {/* Editorial Narrative Bridge */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>HOW DOES THE AI ACTUALLY THINK?</span>
        </div>
        
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Multimodal Fusion Intelligence Observatory
        </h2>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
          Five deterministic intelligence signals converge into an explainable incident correlation decision. 
          <strong className="text-slate-200 font-bold"> Click any orbiting engine node or the central AI core </strong> 
          to inspect its internal algorithms, weights, and live forensic evidence.
        </p>
      </div>

      {/* 3D Core Viewport Frame with Side Drawer */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden h-[620px] mb-8">
        
        {/* Three.js Canvas Container */}
        <div ref={canvasHolderRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Real-time 3D Orbiting Labels Bound to Each Globe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {ORBIT_LABELS.map((item) => {
            const isCore = item.id === "fusion";
            return (
              <div
                key={item.id}
                ref={(el) => { labelElementsRef.current[item.id] = el; }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectEngineRef.current(item.id);
                }}
                className={`absolute top-0 left-0 flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shadow-2xl font-mono text-[11px] cursor-pointer transition-[border-color,background-color,box-shadow] duration-150 select-none pointer-events-auto group ${
                  isCore 
                    ? "bg-sky-950/90 hover:bg-sky-900/90 border-sky-400/60 shadow-sky-500/20" 
                    : "bg-slate-950/90 hover:bg-slate-900/95"
                }`}
                style={{
                  borderColor: isCore ? undefined : `${item.color}55`,
                  willChange: "transform, opacity",
                  display: "none",
                }}
                title={`Click to inspect ${item.fullName} algorithm`}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}`
                  }}
                />
                <span className="font-bold text-white text-[11px] whitespace-nowrap group-hover:text-cyan-200 transition-colors">
                  <span className="hidden sm:inline">{item.fullName}</span>
                  <span className="sm:hidden">{item.shortName}</span>
                </span>
                <span 
                  className="text-[9.5px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{
                    backgroundColor: `${item.color}20`,
                    color: item.color,
                    border: `1px solid ${item.color}40`
                  }}
                >
                  {item.weight}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover Raycast Tooltip */}
        {hoveredEngine && !selectedEngine && (
          <div 
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl font-mono text-[11px] flex flex-col items-center gap-0.5 z-20 transition-all duration-150"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <span className="font-bold text-white uppercase tracking-wider" style={{ color: ENGINE_METADATA[hoveredEngine]?.color }}>
              {ENGINE_METADATA[hoveredEngine]?.name || hoveredEngine}
            </span>
            <span className="text-[9px] text-slate-400">Click to inspect internal AI pipeline</span>
          </div>
        )}

        {/* Bottom Orbiting Drag Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none z-10">
          <span>⟲ drag to orbit</span>
          <span>&bull;</span>
          <span>scroll to zoom</span>
          <span>&bull;</span>
          <span className="text-cyan-400 font-bold">click node to inspect</span>
        </div>

        {/* =================================================================== */}
        {/* GLASSMORPHIC ENGINE INSPECTION DRAWER                                */}
        {/* =================================================================== */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-full sm:w-[440px] bg-slate-950/95 sm:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl z-30 p-6 flex flex-col justify-between overflow-y-auto transition-transform duration-500 ease-out ${
            selectedEngine ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          {activeMeta && (
            <>
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border"
                      style={{ color: activeMeta.color, borderColor: activeMeta.color, backgroundColor: `${activeMeta.color}15` }}
                    >
                      {activeMeta.num}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {activeMeta.id === "fusion" ? "FUSION ORCHESTRATOR" : "AI ENGINE INSPECTION"}
                    </span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => resetEngineRef.current()}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Return to full system view (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {activeMeta.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                    {activeMeta.tagline}
                  </p>
                </div>

                {/* What it does */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-cyan-400" />
                    <span>WHAT IT DOES</span>
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                    {activeMeta.what}
                  </div>
                </div>

                {/* Live Process Pipeline */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    LIVE PROCESS PIPELINE
                  </span>
                  <div className="space-y-1.5">
                    {activeMeta.pipeline.map((step, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: `${activeMeta.color}25`, color: activeMeta.color }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-slate-200 font-bold block text-[11px]">{step.step}</span>
                            <span className="text-[10px] text-slate-400 font-sans block">{step.sub}</span>
                          </div>
                        </div>
                        {idx < activeMeta.pipeline.length - 1 ? (
                          <span className="text-slate-400 text-xs">&darr;</span>
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live CivicPulse Example */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    LIVE CIVICPULSE EXAMPLE
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    {activeMeta.example.map((ex, idx) => (
                      <div key={idx} className="flex justify-between items-baseline gap-2 pb-1.5 border-b border-slate-800/60 last:border-0 last:pb-0">
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">{ex.k}:</span>
                        <span className="text-right text-slate-200 font-medium text-[11px] font-sans">{ex.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">SIGNAL SCORE</span>
                    <span className="text-2xl font-black font-mono mt-1 block" style={{ color: activeMeta.color }}>
                      {activeMeta.score}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">ROLE IN FUSION</span>
                    <span className="text-2xl font-black font-mono text-white mt-1 block">
                      {activeMeta.weight}
                    </span>
                  </div>
                </div>

                {/* Why This Matters */}
                <div 
                  className="p-3.5 rounded-xl border-l-2 text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/60"
                  style={{ borderColor: activeMeta.color }}
                >
                  <strong className="text-white block font-mono text-[10px] uppercase mb-1">WHY THIS MATTERS:</strong>
                  {activeMeta.importance}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={handlePrevEngine}
                  className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <button
                  type="button"
                  onClick={() => resetEngineRef.current()}
                  className="px-3 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-wider transition-colors"
                >
                  [ RESET AI CORE ]
                </button>

                <button
                  type="button"
                  onClick={handleNextEngine}
                  className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* 5 Engine Clickable Interactive Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-12">
        {engineData.map((e) => {
          const isSelected = selectedEngine === e.id;
          const meta = ENGINE_METADATA[e.id];
          return (
            <div
              key={e.id}
              onClick={() => selectEngineRef.current(e.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-cyan-400 shadow-lg scale-[1.02]"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:-translate-y-1"
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-2">
                  <span className="font-bold" style={{ color: meta.color }}>{meta.num}</span>
                  <span className="text-[10px] text-slate-400">{e.weight}% Weight</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{e.name}</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                  {meta.tagline}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span className="text-slate-400">Score: <strong style={{ color: meta.color }}>{meta.score}</strong></span>
                <span className="flex items-center gap-0.5 text-cyan-400">
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}

const engineData = [
  { id: "semantic", name: "Semantic Engine", weight: 25 },
  { id: "geo", name: "Geospatial Engine", weight: 35 },
  { id: "visual", name: "Visual Engine", weight: 20 },
  { id: "temporal", name: "Temporal Engine", weight: 10 },
  { id: "category", name: "Category Engine", weight: 10 },
];

export default AIEngineShowcase;
