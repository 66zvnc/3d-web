import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Auto-centers and normalizes a scene to fit within a unit sphere
function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  scene.position.sub(center);
  scene.scale.setScalar(1.5 / maxDim);
}

function Model({ url, position, rotSpeed = 0.4 }) {
  const groupRef = useRef();
  const { scene: rawScene } = useGLTF(url);

  const scene = React.useMemo(() => {
    const cloned = rawScene.clone(true);
    normalizeScene(cloned);
    return cloned;
  }, [rawScene]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += rotSpeed * delta;
  });

  return (
    <group ref={groupRef} position={position}>
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

function Scene() {
  return (
    <>
      <color attach="background" args={["#07080f"]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-5, 2, -5]} intensity={0.5} />

      <Suspense fallback={null}>
        {/* Row 1 - statues spread across center */}
        <Model url="/models/statue1.glb" position={[-3, 0, 0]} />
        <Model url="/models/statue2.glb" position={[0, 0, 0]} />
        <Model url="/models/statue3.glb" position={[3, 0, 0]} />

        {/* Row 2 - frames slightly behind */}
        <Model url="/models/frame1.glb" position={[-3, 0, -4]} rotSpeed={0.3} />
        <Model url="/models/frame2.glb" position={[0, 0, -4]} rotSpeed={0.3} />
        <Model url="/models/frame3.glb" position={[3, 0, -4]} rotSpeed={0.3} />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#07080f", color: "#f8f8f8" }}>
      {/* Fixed full-screen canvas */}
      <Canvas
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
        camera={{ fov: 70, position: [0, 0, 8], near: 0.1, far: 100 }}
      >
        <Scene />
      </Canvas>

      {/* Scrollable HTML content */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {/* Hero */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 6rem",
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>
              Gallery Pro
            </p>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 600, lineHeight: 1.2, marginBottom: 20 }}>
              Always curate like a pro.
            </h1>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.7, marginBottom: 28 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals,
              incredible detail preservation, and immersive depth.
            </p>
            <button
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Know more
            </button>
          </div>
        </section>

        {/* Sculptures */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 6rem",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>
              Sculptures
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>
              Sculpted forms in constant motion.
            </h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.7 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tincidunt,
              ipsum in convallis auctor, turpis ipsum pulvinar lectus.
            </p>
          </div>
        </section>

        {/* Frames */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 6rem",
          }}
        >
          <div style={{ maxWidth: 480, textAlign: "right" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>
              Frames
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 600, marginBottom: 16 }}>
              Stories floating around the gallery.
            </h2>
            <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.7 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat,
              urna eget venenatis convallis, ex augue consequat orci.
            </p>
          </div>
        </section>

        <section style={{ minHeight: "50vh" }} />
      </div>
    </div>
  );
}
