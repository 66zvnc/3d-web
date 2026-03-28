import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

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
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim === 0) return;
  scene.position.sub(center);
  scene.scale.setScalar(1.8 / maxDim);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function Model({ url, position, rotSpeed = 0.4, triggerAt = 0, scrollRef }) {
  const groupRef = useRef();
  const alphaRef = useRef(triggerAt === 0 ? 0.001 : 0);
  const { scene: rawScene } = useGLTF(url);

  const scene = useMemo(() => {
    const cloned = rawScene.clone(true);
    normalizeScene(cloned);
    return cloned;
  }, [rawScene]);

  useFrame((_, delta) => {
    const t = scrollRef.current;
    // Models with triggerAt=0 appear immediately without needing scroll
    const scrollVal = triggerAt === 0 ? Math.max(t, 0.001) : t;
    const progress = smoothstep(triggerAt, triggerAt + 0.15, scrollVal);
    alphaRef.current += (progress - alphaRef.current) * 0.06;
    const a = alphaRef.current;

    const g = groupRef.current;
    if (!g) return;

    g.rotation.y += rotSpeed * delta;
    g.scale.setScalar(Math.max(0.01, a));
    g.position.set(position[0], position[1] - (1 - a) * 3, position[2]);

    g.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          m.transparent = true;
          m.opacity = a;
          m.depthWrite = a > 0.9;
        });
      }
    });
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] - 3, position[2]]}>
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

// Spinning pink cube — confirms canvas is working while models load
function DebugCube() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function Scene({ scrollRef }) {
  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <directionalLight position={[-5, 2, -5]} intensity={1} />

      {/* Always-visible debug cube in center — remove once models confirmed working */}
      <DebugCube />

      <Suspense fallback={null}>
        {/* Statues: triggerAt=0 means they start appearing immediately */}
        <Model url="/models/statue1.glb" position={[-5, 0, 0]}  triggerAt={0}    scrollRef={scrollRef} rotSpeed={0.5} />
        <Model url="/models/statue2.glb" position={[ 0, 0, 0]}  triggerAt={0}    scrollRef={scrollRef} rotSpeed={0.4} />
        <Model url="/models/statue3.glb" position={[ 5, 0, 0]}  triggerAt={0.1}  scrollRef={scrollRef} rotSpeed={0.45} />

        {/* Frames: appear on scroll */}
        <Model url="/models/frame1.glb" position={[-5, 0, -3]}  triggerAt={0.35} scrollRef={scrollRef} rotSpeed={0.3} />
        <Model url="/models/frame2.glb" position={[ 0, 0, -3]}  triggerAt={0.45} scrollRef={scrollRef} rotSpeed={0.25} />
        <Model url="/models/frame3.glb" position={[ 5, 0, -3]}  triggerAt={0.55} scrollRef={scrollRef} rotSpeed={0.35} />
      </Suspense>
    </>
  );
}

export default function App() {
  const scrollRef = useScrollProgress();

  return (
    <div style={{ width: "100vw", minHeight: "300vh", background: "#07080f", color: "#f8f8f8" }}>
      <Canvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 70, position: [0, 0, 9], near: 0.1, far: 100 }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>

      <div style={{ position: "relative", zIndex: 10 }}>
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 5rem" }}>
          <div style={{ maxWidth: 500 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Gallery Pro</p>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: 18 }}>
              Always curate<br />like a pro.
            </h1>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75, marginBottom: 28, maxWidth: 420 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals,
              incredible detail preservation, and immersive depth.
            </p>
            <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 999, padding: "12px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Know more
            </button>
            <p style={{ marginTop: 60, fontSize: 12, color: "#6b7280", letterSpacing: "0.2em" }}>↓ scroll to explore</p>
          </div>
        </section>

        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 5rem" }}>
          <div style={{ maxWidth: 460 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Sculptures</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>Sculpted forms in constant motion.</h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tincidunt,
              ipsum in convallis auctor, turpis ipsum pulvinar lectus.
            </p>
          </div>
        </section>

        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 5rem" }}>
          <div style={{ maxWidth: 460, textAlign: "right" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>Frames</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>Stories floating around the gallery.</h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.75 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat,
              urna eget venenatis convallis, ex augue consequat orci.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
