import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { ITEMS } from "./data";

// Local HDRI captured at the gallery
const PANO_URL = "/Untitled.hdr";

function PanoSphere() {
  const [texture, setTexture] = React.useState(null);

  React.useEffect(() => {
    const loader = new RGBELoader();
    loader.load(PANO_URL, (t) => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      setTexture(t);
    });
  }, []);

  if (!texture) return null;

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function HotspotLabel({ item, onClick }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.style.transform = `scale(${1 + Math.sin(clock.elapsedTime * 2) * 0.04})`;
    }
  });

  // Convert spherical (phi, theta) to Cartesian on radius=490 sphere
  const r = 490;
  const x = r * Math.sin(item.hotspot.phi) * Math.cos(item.hotspot.theta);
  const y = r * Math.cos(item.hotspot.phi);
  const z = r * Math.sin(item.hotspot.phi) * Math.sin(item.hotspot.theta);

  return (
    <Html position={[x, y, z]} center>
      <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={onClick}>
        <button style={{
          background: "rgba(255,255,255,0.92)",
          color: "#111",
          border: "none",
          borderRadius: 999,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
          backdropFilter: "blur(6px)",
        }}>
          {item.name}
        </button>
        <div style={{ width: 2, height: 20, background: "rgba(255,255,255,0.6)" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 12px #ef4444" }} />
      </div>
    </Html>
  );
}

function DragControls() {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const spherical = useRef({ theta: 0, phi: Math.PI / 2 });
  const target = useRef(new THREE.Vector3());

  React.useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e) => {
      isDragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = (e.clientX - last.current.x) * 0.005;
      const dy = (e.clientY - last.current.y) * 0.003;
      last.current = { x: e.clientX, y: e.clientY };
      spherical.current.theta -= dx;
      spherical.current.phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.current.phi + dy));
      const s = spherical.current;
      target.current.set(
        Math.sin(s.phi) * Math.cos(s.theta),
        Math.cos(s.phi),
        Math.sin(s.phi) * Math.sin(s.theta)
      );
      camera.lookAt(target.current);
    };

    // Touch
    const onTouchStart = (e) => { isDragging.current = true; last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      const dx = (e.touches[0].clientX - last.current.x) * 0.005;
      const dy = (e.touches[0].clientY - last.current.y) * 0.003;
      last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      spherical.current.theta -= dx;
      spherical.current.phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.current.phi + dy));
      const s = spherical.current;
      target.current.set(
        Math.sin(s.phi) * Math.cos(s.theta),
        Math.cos(s.phi),
        Math.sin(s.phi) * Math.sin(s.theta)
      );
      camera.lookAt(target.current);
    };
    const onTouchEnd = () => { isDragging.current = false; };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [camera, gl]);

  return null;
}

export default function GalleryView({ onSelectItem }) {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden", position: "relative" }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "0.05em" }}>GALLERY PRO</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>Drag to explore · Click items to view</div>
      </div>

      {/* Compass hint */}
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 20, color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", pointerEvents: "none" }}>
        ← drag to look around →
      </div>

      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ fov: 75, position: [0, 0, 0.001], near: 0.1, far: 1000 }}
      >
        <PanoSphere />
        <DragControls />
        {ITEMS.map((item) => (
          <HotspotLabel key={item.id} item={item} onClick={() => onSelectItem(item.id)} />
        ))}
      </Canvas>
    </div>
  );
}
