import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      ref.current = h > 0 ? window.scrollY / h : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return ref;
}

function SpinningModel({ url, position, scale = 0.9, speed = 0.4 }) {
  const ref = useRef();
  const { scene } = useGLTF(url);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += speed * delta;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function Scene({ scrollRef }) {
  useFrame(({ camera }) => {
    const t = scrollRef.current;
    camera.position.set(0, 0.5 - t * 0.5, 6 - t * 1.0);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <ambientLight intensity={0.9} />
      <Suspense fallback={null}>
        {/* Statues - centered in viewport */}
        <SpinningModel url="/models/statue1.glb" position={[-2.2, 0, 0.5]} />
        <SpinningModel url="/models/statue2.glb" position={[0, 0, 0]} scale={1.0} />
        <SpinningModel url="/models/statue3.glb" position={[2.2, 0, -0.3]} />
        {/* Frames - slightly behind and above */}
        <SpinningModel url="/models/frame1.glb" position={[-2.0, 1.2, -2.2]} />
        <SpinningModel url="/models/frame2.glb" position={[0, 1.4, -2.6]} />
        <SpinningModel url="/models/frame3.glb" position={[2.0, 1.2, -2.0]} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}

export default function App() {
  const scrollRef = useScrollProgress();

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#05060a] text-slate-50">
      {/* Fixed 3D canvas behind everything */}
      <Canvas
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
        camera={{ fov: 45, position: [0, 0.5, 6] }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>

      {/* Scrollable content on top */}
      <main style={{ position: "relative", zIndex: 10 }}>
        {/* Hero */}
        <section className="min-h-screen flex items-center px-6 md:px-20 lg:px-36">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gallery Pro</p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
              Always curate like a pro.
            </h1>
            <p className="text-sm md:text-base text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Blazing fast visuals,
              incredible detail preservation, and immersive depth that showcases every sculpture and frame.
            </p>
            <button className="mt-4 inline-flex items-center rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-red-600 transition">
              Know more
            </button>
          </div>
        </section>

        {/* Sculptures */}
        <section className="min-h-screen flex items-center px-6 md:px-20 lg:px-36">
          <div className="max-w-xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Sculptures</p>
            <h2 className="text-2xl md:text-3xl font-semibold">Sculpted forms in constant motion.</h2>
            <p className="text-sm md:text-base text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tincidunt,
              ipsum in convallis auctor, turpis ipsum pulvinar lectus, vitae feugiat velit nulla non purus.
            </p>
          </div>
        </section>

        {/* Frames */}
        <section className="min-h-screen flex items-center justify-end px-6 md:px-20 lg:px-36 pb-20">
          <div className="max-w-xl space-y-4 text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Frames</p>
            <h2 className="text-2xl md:text-3xl font-semibold">Stories floating around the gallery.</h2>
            <p className="text-sm md:text-base text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat,
              urna eget venenatis convallis, ex augue consequat orci, non tincidunt lectus justo et ante.
            </p>
          </div>
        </section>

        <section className="min-h-[40vh]" />
      </main>
    </div>
  );
}
