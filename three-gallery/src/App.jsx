import React, { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ─── scroll tracker ───────────────────────────────────────────────
function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      ref.current = h > 0 ? window.scrollY / h : 0;
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return ref;
}

// ─── normalize GLB to ~2 units tall, centered ──────────────────────
function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size   = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim === 0) return;
  scene.position.sub(center);
  scene.scale.setScalar(2.2 / maxDim);
}

// ─── easing ───────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

// ─── single model slot ────────────────────────────────────────────
// visibleProgress 0→1: fades/scales in
// exitProgress   0→1: fades/scales out upward
function ModelSlot({ url, visibleProgress, exitProgress }) {
  const groupRef = useRef();
  const rotRef   = useRef(0);
  const { scene: raw } = useGLTF(url);

  const scene = useMemo(() => {
    const c = raw.clone(true);
    normalizeScene(c);
    return c;
  }, [raw]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    // continuous slow spin
    rotRef.current += delta * 0.35;
    // extra rotation driven by scroll entry
    const entryRot = visibleProgress * Math.PI * 0.5;
    g.rotation.y = rotRef.current + entryRot;

    // entry: rise from below + scale up + fade in
    const entryY     = lerp(-3, 0, visibleProgress);
    const entryScale = lerp(0.4, 1, visibleProgress);
    // exit: float upward + shrink + fade out
    const exitY     = lerp(0, 3, exitProgress);
    const exitScale = lerp(1, 0.4, exitProgress);
    const opacity   = visibleProgress * (1 - exitProgress);

    g.position.set(0, entryY + exitY, 0);
    g.scale.setScalar(entryScale * exitScale);

    g.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        m.transparent = true;
        m.opacity = Math.max(0, Math.min(1, opacity));
        m.depthWrite = opacity > 0.8;
      });
    });
  });

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── preload ──────────────────────────────────────────────────────
const MODELS = [
  "/models/statue1.glb",
  "/models/statue2.glb",
  "/models/statue3.glb",
  "/models/frame1.glb",
  "/models/frame2.glb",
  "/models/frame3.glb",
];
MODELS.forEach((url) => useGLTF.preload(url));

// ─── scene ────────────────────────────────────────────────────────
function Scene({ scrollRef }) {
  const vpRef  = useRef(new Array(MODELS.length).fill(0));
  const epRef  = useRef(new Array(MODELS.length).fill(0));
  const [, forceUpdate] = useState(0);

  // Each model occupies 1/N of total scroll
  const N = MODELS.length;

  useFrame(() => {
    const t = scrollRef.current; // 0–1
    const slot = t * N;           // 0–N float

    for (let i = 0; i < N; i++) {
      // entry: how far into this slot we are (0→1)
      const entry = Math.max(0, Math.min(1, slot - i + 0.5));
      // exit: how far past this slot we are (0→1)
      const exit  = Math.max(0, Math.min(1, slot - i - 0.5));
      vpRef.current[i] = entry;
      epRef.current[i] = exit;
    }
  });

  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 6, 4]}  intensity={1.8} />
      <directionalLight position={[-4, 2, -4]} intensity={0.6} />

      <Suspense fallback={null}>
        {MODELS.map((url, i) => (
          <ModelSlot
            key={url}
            url={url}
            visibleProgress={vpRef.current[i]}
            exitProgress={epRef.current[i]}
          />
        ))}
      </Suspense>
    </>
  );
}

// ─── sections ─────────────────────────────────────────────────────
const SECTIONS = [
  {
    label: "Statue I",
    title: "Always curate like a pro.",
    body:  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals, incredible detail preservation, and immersive depth.",
  },
  {
    label: "Statue II",
    title: "Sculpted forms in constant motion.",
    body:  "Integer tincidunt, ipsum in convallis auctor, turpis ipsum pulvinar lectus, vitae feugiat velit nulla non purus.",
  },
  {
    label: "Statue III",
    title: "Power carved from stone and light.",
    body:  "Curabitur tempus, ligula at ultrices finibus, arcu nisl gravida justo, id cursus mi nisi in nisl.",
  },
  {
    label: "Frame I",
    title: "Stories captured on canvas.",
    body:  "Vivamus volutpat, urna eget venenatis convallis, ex augue consequat orci, non tincidunt lectus justo et ante.",
  },
  {
    label: "Frame II",
    title: "Every brushstroke tells a tale.",
    body:  "Sed euismod, augue in interdum pharetra, risus arcu pretium lectus, eget lobortis eros enim a dolor.",
  },
  {
    label: "Frame III",
    title: "The gallery never sleeps.",
    body:  "Nunc sed erat porttitor, faucibus nisi a, tincidunt nunc. Cras rhoncus dapibus dui, vitae ultricies elit.",
  },
];

// ─── app ──────────────────────────────────────────────────────────
export default function App() {
  const scrollRef = useScrollProgress();

  return (
    <div style={{ width: "100vw", background: "#07080f", color: "#f8f8f8" }}>
      {/* Fixed canvas */}
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 60, position: [0, 0, 5], near: 0.1, far: 100 }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>

      {/* Scrollable sections — each 100vh tall */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {SECTIONS.map((s, i) => (
          <section
            key={i}
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              padding: "0 5rem",
              // alternate text left/right
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
            }}
          >
            <div style={{ maxWidth: 420 }}>
              <p style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 14,
              }}>
                {s.label}
              </p>
              <h2 style={{
                fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: 18,
              }}>
                {s.title}
              </h2>
              <p style={{
                fontSize: 15,
                color: "#9ca3af",
                lineHeight: 1.8,
                marginBottom: 28,
              }}>
                {s.body}
              </p>
              {i === 0 && (
                <button style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}>
                  Explore collection
                </button>
              )}
            </div>
          </section>
        ))}

        {/* Extra scroll room at end */}
        <section style={{ minHeight: "50vh" }} />
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        color: "#4b5563",
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        pointerEvents: "none",
      }}>
        <span>Scroll</span>
        <div style={{ width: 1, height: 40, background: "#374151" }} />
      </div>
    </div>
  );
}
