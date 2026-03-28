import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const URLS = [
  "/models/statue1.glb",
  "/models/statue2.glb",
  "/models/statue3.glb",
  "/models/frame1.glb",
  "/models/frame2.glb",
  "/models/frame3.glb",
];
const N = URLS.length;
URLS.forEach((u) => useGLTF.preload(u));

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

function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const c = new THREE.Vector3();
  const s = new THREE.Vector3();
  box.getCenter(c);
  box.getSize(s);
  const m = Math.max(s.x, s.y, s.z);
  if (m === 0) return;
  scene.position.sub(c);
  scene.scale.setScalar(2.2 / m);
}

function Model({ url, index, scrollRef }) {
  const groupRef = useRef();
  const rotY = useRef(0);
  const { scene: raw } = useGLTF(url);

  const scene = useMemo(() => {
    const clone = raw.clone(true);
    normalizeScene(clone);
    return clone;
  }, [raw]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const t = scrollRef.current;       // 0-1 total scroll
    const slot = t * N;                // 0-6 float
    const entry = Math.max(0, Math.min(1, slot - index + 0.6));
    const exit  = Math.max(0, Math.min(1, slot - index - 0.6));
    const opacity = Math.max(0, entry - exit);

    rotY.current += delta * 0.4;
    g.rotation.y = rotY.current + entry * Math.PI * 0.4;

    const sc = 0.3 + entry * 0.7 - exit * 0.5;
    g.scale.setScalar(Math.max(0.01, sc));
    g.position.set(0, (entry - 1) * 2 + exit * 3, 0);

    g.traverse((obj) => {
      if (!obj.isMesh) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        m.transparent = true;
        m.opacity = Math.max(0, Math.min(1, opacity));
        m.depthWrite = opacity > 0.9;
      });
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Scene({ scrollRef }) {
  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 6, 4]}  intensity={2} />
      <directionalLight position={[-4, 2, -4]} intensity={0.8} />
      <Suspense fallback={null}>
        {URLS.map((url, i) => (
          <Model key={url} url={url} index={i} scrollRef={scrollRef} />
        ))}
      </Suspense>
    </>
  );
}

const SECTIONS = [
  { label: "Statue I",   title: "Always curate like a pro.",           body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals and immersive depth." },
  { label: "Statue II",  title: "Sculpted forms in constant motion.",   body: "Integer tincidunt, ipsum in convallis auctor, turpis ipsum pulvinar lectus, vitae feugiat velit." },
  { label: "Statue III", title: "Power carved from stone and light.",    body: "Curabitur tempus, ligula at ultrices finibus, arcu nisl gravida justo, id cursus mi nisi." },
  { label: "Frame I",    title: "Stories captured on canvas.",           body: "Vivamus volutpat, urna eget venenatis convallis, ex augue consequat orci, non tincidunt lectus." },
  { label: "Frame II",   title: "Every brushstroke tells a tale.",       body: "Sed euismod, augue in interdum pharetra, risus arcu pretium lectus, eget lobortis eros." },
  { label: "Frame III",  title: "The gallery never sleeps.",             body: "Nunc sed erat porttitor, faucibus nisi a, tincidunt nunc. Cras rhoncus dapibus dui." },
];

export default function App() {
  const scrollRef = useScrollProgress();

  return (
    <div style={{ width: "100vw", background: "#07080f", color: "#f8f8f8" }}>
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 60, position: [0, 0, 5], near: 0.1, far: 100 }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>

      <div style={{ position: "relative", zIndex: 10 }}>
        {SECTIONS.map((s, i) => (
          <section
            key={i}
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              padding: "0 5rem",
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
            }}
          >
            <div style={{ maxWidth: 400 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7280", marginBottom: 14 }}>
                {s.label}
              </p>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 3rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: 18 }}>
                {s.title}
              </h2>
              <p style={{ fontSize: 15, color: "#9ca3af", lineHeight: 1.8, marginBottom: 28 }}>
                {s.body}
              </p>
              {i === 0 && (
                <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 999, padding: "12px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Explore collection
                </button>
              )}
            </div>
          </section>
        ))}
        <section style={{ minHeight: "50vh" }} />
      </div>

      <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#4b5563", fontSize: 11, letterSpacing: "0.2em", pointerEvents: "none" }}>
        <span>SCROLL</span>
        <div style={{ width: 1, height: 36, background: "#374151" }} />
      </div>
    </div>
  );
}
