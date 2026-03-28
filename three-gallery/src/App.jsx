import React, { Suspense, useRef, useEffect, useMemo, useState } from "react";
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
URLS.forEach((u) => useGLTF.preload(u));

const SECTIONS = [
  { label: "Statue I",   title: "Always curate like a pro.",         body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals and immersive depth." },
  { label: "Statue II",  title: "Sculpted forms in constant motion.", body: "Integer tincidunt, ipsum in convallis auctor, turpis ipsum pulvinar lectus, vitae feugiat velit." },
  { label: "Statue III", title: "Power carved from stone and light.",  body: "Curabitur tempus, ligula at ultrices finibus, arcu nisl gravida justo, id cursus mi nisi." },
  { label: "Frame I",    title: "Stories captured on canvas.",         body: "Vivamus volutpat, urna eget venenatis convallis, ex augue consequat orci, non tincidunt." },
  { label: "Frame II",   title: "Every brushstroke tells a tale.",     body: "Sed euismod, augue in interdum pharetra, risus arcu pretium lectus, eget lobortis eros." },
  { label: "Frame III",  title: "The gallery never sleeps.",           body: "Nunc sed erat porttitor, faucibus nisi a, tincidunt nunc. Cras rhoncus dapibus dui." },
];

function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const c = new THREE.Vector3();
  const s = new THREE.Vector3();
  box.getCenter(c);
  box.getSize(s);
  const m = Math.max(s.x, s.y, s.z);
  if (m === 0) return;
  scene.position.sub(c);
  scene.scale.setScalar(2.4 / m);
}

// One model — always centered, always spinning, fades in/out when active changes
function ActiveModel({ url }) {
  const groupRef = useRef();
  const opacityRef = useRef(0);
  const scaleRef = useRef(0.6);
  const { scene: raw } = useGLTF(url);

  const scene = useMemo(() => {
    const clone = raw.clone(true);
    normalizeScene(clone);
    return clone;
  }, [raw]);

  useEffect(() => {
    // Reset on mount so it animates in fresh
    opacityRef.current = 0;
    scaleRef.current = 0.6;
  }, [url]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    // Spin
    g.rotation.y += delta * 0.5;

    // Animate in
    opacityRef.current = Math.min(1, opacityRef.current + delta * 2);
    scaleRef.current   = Math.min(1, scaleRef.current   + delta * 2);
    g.scale.setScalar(scaleRef.current);
    g.position.set(0, 0, 0);

    g.traverse((obj) => {
      if (!obj.isMesh) return;
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => {
        m.transparent = true;
        m.opacity = opacityRef.current;
        m.depthWrite = opacityRef.current > 0.9;
      });
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function Scene({ activeUrl }) {
  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 6, 4]}  intensity={2} />
      <directionalLight position={[-4, 2, -4]} intensity={0.8} />
      <Suspense fallback={null}>
        {/* Key forces remount + fresh fade-in when url changes */}
        <ActiveModel key={activeUrl} url={activeUrl} />
      </Suspense>
    </>
  );
}

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = sectionRefs.current.indexOf(entry.target);
            if (i !== -1) setActiveIndex(i);
          }
        });
      },
      { threshold: 0.5 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ width: "100vw", background: "#07080f", color: "#f8f8f8" }}>
      {/* Fixed canvas — model always dead center */}
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 55, position: [0, 0, 5], near: 0.1, far: 100 }}
      >
        <Scene activeUrl={URLS[activeIndex]} />
      </Canvas>

      {/* Scrollable text */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {SECTIONS.map((s, i) => (
          <section
            key={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              padding: "0 6rem",
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
            }}
          >
            <div style={{ maxWidth: 380 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7280", marginBottom: 14 }}>
                {s.label}
              </p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 700, lineHeight: 1.12, marginBottom: 18 }}>
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
      </div>

      {/* Progress dots */}
      <div style={{ position: "fixed", right: 28, top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {SECTIONS.map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === activeIndex ? "#f8f8f8" : "#374151", transition: "background 0.3s" }} />
        ))}
      </div>

      <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#374151", fontSize: 10, letterSpacing: "0.25em", pointerEvents: "none" }}>
        <span>SCROLL</span>
        <div style={{ width: 1, height: 32, background: "#374151" }} />
      </div>
    </div>
  );
}
