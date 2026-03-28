// src/App.jsx
import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

function Statue({ url, x }) {
  const group = useRef();
  const { scene } = useGLTF(url);
  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.01;
  });
  return (
    <group ref={group} position={[x, 0.5, 0]} scale={0.8}>
      <primitive object={scene} />
    </group>
  );
}

function Frame({ url, x }) {
  const group = useRef();
  const { scene } = useGLTF(url);
  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.01;
  });
  return (
    <group ref={group} position={[x, 0.5, -3]} scale={0.8}>
      <primitive object={scene} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <ambientLight intensity={0.9} />
      <Suspense fallback={null}>
        <Statue url="/models/statue1.glb" x={-2} />
        <Statue url="/models/statue2.glb" x={0} />
        <Statue url="/models/statue3.glb" x={2} />
        <Frame url="/models/frame1.glb" x={-2} />
        <Frame url="/models/frame2.glb" x={0} />
        <Frame url="/models/frame3.glb" x={2} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan={false} />
    </>
  );
}

export default function App() {
  return (
    <div className="page">
      <Canvas className="canvas" camera={{ fov: 60, position: [0, 1.5, 6] }}>
        <Scene />
      </Canvas>

      <main className="content">
        <section>
          <h1>Gallery Entrance</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        </section>
        <section>
          <h2>Statues</h2>
          <p>More lorem ipsum about statues etc.</p>
        </section>
        <section>
          <h2>Frames</h2>
          <p>More lorem ipsum about frames etc.</p>
        </section>
      </main>
    </div>
  );
}