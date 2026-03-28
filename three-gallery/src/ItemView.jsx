import React, { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { ITEMS } from "./data";

function normalizeScene(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const c = new THREE.Vector3();
  const s = new THREE.Vector3();
  box.getCenter(c);
  box.getSize(s);
  const m = Math.max(s.x, s.y, s.z);
  if (m === 0) return;
  scene.position.sub(c);
  scene.scale.setScalar(2.6 / m);
}

function SpinningModel({ url }) {
  const groupRef = useRef();
  const opacityRef = useRef(0);
  const { scene: raw } = useGLTF(url);

  const scene = useMemo(() => {
    const clone = raw.clone(true);
    normalizeScene(clone);
    return clone;
  }, [raw]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.4;
    opacityRef.current = Math.min(1, opacityRef.current + delta * 1.5);
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

export default function ItemView({ itemId, onBack }) {
  const item = ITEMS.find((i) => i.id === itemId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!item) return null;

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#08090e", color: "#f0f0f0",
      display: "flex", overflow: "hidden", fontFamily: "system-ui, sans-serif",
      opacity: visible ? 1 : 0, transition: "opacity 0.5s ease",
    }}>

      {/* LEFT — info panel */}
      <div style={{
        width: "36%", minWidth: 300, padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        background: "#0c0d14", borderRight: "1px solid #1a1b26",
        overflowY: "auto",
      }}>
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start", marginBottom: 40,
            background: "transparent", border: "1px solid #2a2b3a",
            color: "#9ca3af", borderRadius: 999, padding: "8px 18px",
            fontSize: 12, cursor: "pointer", letterSpacing: "0.1em",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          ← Back to Gallery
        </button>

        <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#ef4444", marginBottom: 12 }}>
          {item.category}
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: 20 }}>
          {item.name}
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.85, marginBottom: 36 }}>
          {item.description}
        </p>

        {/* Metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 36 }}>
          {[
            ["Year", item.year],
            ["Material", item.material],
            ["Dimensions", item.dimensions],
            ["Asking price", item.price],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4b5563", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 500 }}>{value}</p>
            </div>
          ))}
        </div>

        <button style={{
          background: "#ef4444", color: "#fff", border: "none",
          borderRadius: 999, padding: "14px 32px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          alignSelf: "flex-start", letterSpacing: "0.05em",
        }}>
          Inquire about this piece
        </button>
      </div>

      {/* RIGHT — 3D model */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Subtle radial glow behind model */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse at center, rgba(239,68,68,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ fov: 50, position: [0, 0, 5], near: 0.1, far: 100 }}
        >
          <color attach="background" args={["#08090e"]} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[4, 6, 4]}  intensity={2} />
          <directionalLight position={[-4, 2, -4]} intensity={0.6} />
          <Suspense fallback={null}>
            <SpinningModel key={item.modelUrl} url={item.modelUrl} />
            <Environment preset="museum" />
          </Suspense>
        </Canvas>

        {/* Model label overlay */}
        <div style={{
          position: "absolute", bottom: 24, right: 28, zIndex: 10,
          color: "#374151", fontSize: 10, letterSpacing: "0.25em",
          textTransform: "uppercase", pointerEvents: "none",
        }}>
          Drag to rotate
        </div>
      </div>
    </div>
  );
}
