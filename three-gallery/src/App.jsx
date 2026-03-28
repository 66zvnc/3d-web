import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Track scroll 0→1
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

// Normalize any GLB to ~1.8 units tall, centered at origin
function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  scene.position.sub(center);
  scene.scale.setScalar(1.8 / maxDim);
}

// smoothstep helper
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Model that animates in when scroll passes its `triggerAt` threshold.
 * Starts off-screen below (y - 4), scales from 0, fades in.
 */
function Model({ url, position, rotSpeed = 0.4, triggerAt = 0, scrollRef }) {
  const groupRef = useRef();
  const { scene: rawScene } = useGLTF(url);
  const alphaRef = useRef(0);

  const scene = useMemo(() => {
    const cloned = rawScene.clone(true);
    normalizeScene(cloned);
    return cloned;
  }, [rawScene]);

  useFrame((_, delta) => {
    const t = scrollRef.current;
    const progress = smoothstep(triggerAt, triggerAt + 0.12, t);

    // Lerp alpha toward target
    alphaRef.current += (progress - alphaRef.current) * 0.08;
    const a = alphaRef.current;

    const g = groupRef.current;
    if (!g) return;

    // Spin
    g.rotation.y += rotSpeed * delta;

    // Scale in from 0
    const s = 0.2 + a * 0.8;
    g.scale.setScalar(s);

    // Rise up from below
    g.position.set(
      position[0],
      position[1] - (1 - a) * 4,
      position[2]
    );

    // Fade in via material opacity
    g.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          m.transparent = true;
          m.opacity = a;
        });
      }
    });
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] - 4, position[2]]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/statue1.glb");
useGLTF.preload("/models/statue2.glb");
useGLTF.preload("/models/statue3.glb");
useGLTF.preload("/models/frame1.glb");
useGLTF.preload("/models/frame2.glb");
useGLTF.preload("/models/frame3.glb");

function Scene({ scrollRef }) {
  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-5, 2, -5]} intensity={0.5} />

      <Suspense fallback={null}>
        {/* Statues: trigger early (scroll 0–0.15), spread wide */}
        <Model url="/models/statue1.glb" position={[-5, 0, 0]}  triggerAt={0.0}  scrollRef={scrollRef} rotSpeed={0.5} />
        <Model url="/models/statue2.glb" position={[ 0, 0, 0]}  triggerAt={0.07} scrollRef={scrollRef} rotSpeed={0.4} />
        <Model url="/models/statue3.glb" position={[ 5, 0, 0]}  triggerAt={0.14} scrollRef={scrollRef} rotSpeed={0.45} />

        {/* Frames: trigger mid-scroll (0.35–0.55), spread wide + different depth */}
        <Model url="/models/frame1.glb" position={[-5, 0.5, -3]} triggerAt={0.35} scrollRef={scrollRef} rotSpeed={0.3} />
        <Model url="/models/frame2.glb" position={[ 0, 0.5, -3]} triggerAt={0.45} scrollRef={scrollRef} rotSpeed={0.25} />
        <Model url="/models/frame3.glb" position={[ 5, 0.5, -3]} triggerAt={0.55} scrollRef={scrollRef} rotSpeed={0.35} />
      </Suspense>
    </>
  );
}

export default function App() {
  const scrollRef = useScrollProgress();

  return (
    <div style={{ width: "100vw", minHeight: "300vh", background: "#07080f", color: "#f8f8f8" }}>
      {/* Fixed full-screen canvas */}
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 70, position: [0, 0, 9], near: 0.1, far: 100 }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>

      {/* Scrollable HTML */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* HERO — statues appear here */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 5rem" }}>
          <div style={{ maxWidth: 500 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>
              Gallery Pro
            </p>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: 18 }}>
              Always curate<br />like a pro.
            </h1>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75, marginBottom: 28, maxWidth: 420 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Blazing fast visuals, incredible detail preservation, and
              immersive depth that showcases every sculpture and frame.
            </p>
            <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 999, padding: "12px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Know more
            </button>
            <p style={{ marginTop: 60, fontSize: 12, color: "#6b7280", letterSpacing: "0.2em" }}>
              ↓ scroll to explore
            </p>
          </div>
        </section>

        {/* SCULPTURES SECTION */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 5rem" }}>
          <div style={{ maxWidth: 460 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>
              Sculptures
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>
              Sculpted forms in constant motion.
            </h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Integer tincidunt, ipsum in convallis auctor, turpis ipsum
              pulvinar lectus, vitae feugiat velit nulla non purus.
            </p>
          </div>
        </section>

        {/* FRAMES SECTION */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 5rem" }}>
          <div style={{ maxWidth: 460, textAlign: "right" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>
              Frames
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>
              Stories floating around the gallery.
            </h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Vivamus volutpat, urna eget venenatis convallis, ex augue
              consequat orci, non tincidunt lectus justo et ante.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
