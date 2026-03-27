import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Float, Sparkles, Text } from '@react-three/drei';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import * as THREE from 'three';

function EncryptedBlocks() {
  const groupRef = useRef(null);
  const blockPositions = useMemo(
    () => [
      [-1.2, 0.4, 0],
      [0.2, 1.1, -0.7],
      [1.1, 0.2, 0.4],
      [-0.7, -0.8, 0.5],
      [0.8, -0.9, -0.5],
      [0.2, -0.1, 0.9],
    ],
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      state.pointer.y * 0.3,
      0.06
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -state.pointer.x * 0.16,
      0.06
    );
  });

  return (
    <group ref={groupRef}>
      {blockPositions.map((position, index) => (
        <Float
          key={`${position[0]}-${position[1]}`}
          speed={1.1 + index * 0.08}
          rotationIntensity={0.6}
        >
          <mesh position={position}>
            <boxGeometry args={[0.82, 0.82, 0.82]} />
            <meshPhysicalMaterial
              color="#89ffe0"
              roughness={0.08}
              metalness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.08}
              transmission={0.75}
              thickness={1.8}
              emissive="#2dff81"
              emissiveIntensity={0.38}
            />
            <Edges color="#6dffb3" />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CryptoSymbols() {
  const coinGroup = useRef(null);

  useFrame((state, delta) => {
    if (!coinGroup.current) return;
    coinGroup.current.rotation.y -= delta * 0.18;
    coinGroup.current.rotation.x = THREE.MathUtils.lerp(
      coinGroup.current.rotation.x,
      state.pointer.y * 0.16,
      0.05
    );
    coinGroup.current.rotation.z = THREE.MathUtils.lerp(
      coinGroup.current.rotation.z,
      -state.pointer.x * 0.16,
      0.05
    );
    coinGroup.current.position.x = THREE.MathUtils.lerp(
      coinGroup.current.position.x,
      state.pointer.x * 0.35,
      0.05
    );
    coinGroup.current.position.y = THREE.MathUtils.lerp(
      coinGroup.current.position.y,
      state.pointer.y * 0.18,
      0.05
    );
  });

  return (
    <group ref={coinGroup}>
      <Float speed={1.1} rotationIntensity={0.5}>
        <mesh position={[-2.2, 1, -0.6]}>
          <cylinderGeometry args={[0.55, 0.55, 0.14, 36]} />
          <meshStandardMaterial color="#8df5ff" metalness={0.86} roughness={0.12} />
        </mesh>
        <Text
          position={[-2.2, 1, -0.5]}
          fontSize={0.48}
          color="#0d1a25"
          anchorX="center"
          anchorY="middle"
        >
          ETH
        </Text>
      </Float>

      <Float speed={1.2} rotationIntensity={0.5}>
        <mesh position={[2.2, 0.7, -0.8]}>
          <cylinderGeometry args={[0.55, 0.55, 0.14, 36]} />
          <meshStandardMaterial color="#d5f9ff" metalness={0.95} roughness={0.18} />
        </mesh>
        <Text
          position={[2.2, 0.7, -0.7]}
          fontSize={0.44}
          color="#0f1820"
          anchorX="center"
          anchorY="middle"
        >
          BTC
        </Text>
      </Float>
    </group>
  );
}

function HeroScene() {
  return (
    <>
      <color attach="background" args={['#0b0f17']} />
      <fog attach="fog" args={['#071017', 5, 16]} />
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 2, 4]} intensity={1.4} color="#71ffc8" />
      <spotLight position={[3, 6, 2]} angle={0.55} penumbra={1} intensity={2.4} color="#54d9ff" />

      <Sparkles
        count={180}
        size={2.1}
        speed={0.45}
        color="#80ffd2"
        opacity={0.65}
        scale={[8, 5, 5]}
      />
      <EncryptedBlocks />
      <CryptoSymbols />
      <mesh position={[0, 0.2, -1.8]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#4dff9f" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0.7, -0.4, -2.2]}>
        <sphereGeometry args={[3.6, 32, 32]} />
        <meshBasicMaterial color="#5ed1ff" transparent opacity={0.05} />
      </mesh>
    </>
  );
}

function MagneticAction({ children, className, href, onClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.45 });

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-12, Math.min(12, relX * 0.18)));
    y.set(Math.max(-10, Math.min(10, relY * 0.18)));
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  if (href) {
    return (
      <motion.a
        href={href}
        className={className}
        style={{ x: springX, y: springY }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.99 }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={className}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.button>
  );
}

export default function HeroCinematic3D({
  title = 'Invisible Trading Layer',
  subtitle = 'Execute trades without exposing intent.',
  description = 'Client-side encryption, private on-chain execution, and verifiable settlement without mempool leakage.',
  primaryLabel = 'Launch App',
  primaryHref = '/app',
  primaryAction,
  secondaryLabel = 'View Docs',
  secondaryHref = '#how-it-works',
  featureChips = [],
}) {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardsRef = useRef(null);
  const rafRef = useRef(null);
  const latestMouseRef = useRef({
    normX: 0,
    normY: 0,
    pxX: 0,
    pxY: 0,
  });

  const pointerNormX = useMotionValue(0);
  const pointerNormY = useMotionValue(0);
  const cursorXPx = useMotionValue(0);
  const cursorYPx = useMotionValue(0);

  const smoothNormX = useSpring(pointerNormX, { stiffness: 110, damping: 24, mass: 0.7 });
  const smoothNormY = useSpring(pointerNormY, { stiffness: 110, damping: 24, mass: 0.7 });
  const smoothCursorX = useSpring(cursorXPx, { stiffness: 125, damping: 22, mass: 0.55 });
  const smoothCursorY = useSpring(cursorYPx, { stiffness: 125, damping: 22, mass: 0.55 });

  const bgX = useTransform(smoothNormX, (value) => value * 12);
  const bgY = useTransform(smoothNormY, (value) => value * 10);
  const starX = useTransform(smoothNormX, (value) => value * 6);
  const starY = useTransform(smoothNormY, (value) => value * 5);
  const fgX = useTransform(smoothNormX, (value) => value * 30);
  const fgY = useTransform(smoothNormY, (value) => value * 24);
  const contentX = useTransform(smoothNormX, (value) => value * 6);
  const contentY = useTransform(smoothNormY, (value) => value * 5);
  const glowX = useTransform(smoothCursorX, (value) => value - 220);
  const glowY = useTransform(smoothCursorY, (value) => value - 220);
  const inverseFgX = useTransform(fgX, (value) => -value * 0.75);
  const inverseFgY = useTransform(fgY, (value) => -value * 0.75);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(titleRef.current, { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 1.05 })
      .fromTo(subtitleRef.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72 }, '-=0.5')
      .fromTo(
        cardsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
        '-=0.3'
      );

    const container = heroRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      cursorXPx.set(rect.width / 2);
      cursorYPx.set(rect.height / 2);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursorXPx, cursorYPx]);

  function flushMousePosition() {
    rafRef.current = null;
    const latest = latestMouseRef.current;
    pointerNormX.set(latest.normX);
    pointerNormY.set(latest.normY);
    cursorXPx.set(latest.pxX);
    cursorYPx.set(latest.pxY);
  }

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pxX = event.clientX - rect.left;
    const pxY = event.clientY - rect.top;

    latestMouseRef.current = {
      normX: pxX / rect.width - 0.5,
      normY: pxY / rect.height - 0.5,
      pxX,
      pxY,
    };

    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushMousePosition);
  }

  function handleMouseLeave() {
    const container = heroRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    latestMouseRef.current = {
      normX: 0,
      normY: 0,
      pxX: rect.width / 2,
      pxY: rect.height / 2,
    };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushMousePosition);
  }

  return (
    <section
      ref={heroRef}
      className="relative min-h-[88vh] w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 z-[1]">
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.8]}>
          <HeroScene />
        </Canvas>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] opacity-50"
        style={{
          x: starX,
          y: starY,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(215,246,255,0.45) 0.7px, transparent 1px), radial-gradient(circle at 74% 48%, rgba(177,255,237,0.45) 0.7px, transparent 1px), radial-gradient(circle at 44% 78%, rgba(151,235,255,0.36) 0.7px, transparent 1px)',
          backgroundSize: '240px 240px, 300px 300px, 360px 360px',
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] opacity-40"
        style={{ x: bgX, y: bgY }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,151,198,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,151,198,0.12) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 78%)',
          }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-[-20vw] top-[-20vw] z-[3] h-[58vw] w-[58vw] rounded-full bg-emerald-300/18 blur-[100px] mix-blend-screen"
        style={{ x: fgX, y: fgY }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-24vw] right-[-16vw] z-[3] h-[62vw] w-[62vw] rounded-full bg-cyan-300/16 blur-[110px] mix-blend-screen"
        style={{ x: inverseFgX, y: inverseFgY }}
      />
      <motion.div
        className="pointer-events-none absolute z-[3] h-[440px] w-[440px] rounded-full blur-[120px]"
        style={{
          x: glowX,
          y: glowY,
          background:
            'radial-gradient(circle, rgba(70,255,176,0.2) 0%, rgba(94,209,255,0.14) 34%, rgba(94,209,255,0.04) 54%, rgba(0,0,0,0) 72%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-b from-black/55 via-black/72 to-black/92" />

      <motion.div
        className="relative z-[5] flex min-h-[88vh] items-center px-4 py-24 text-center"
        style={{ x: contentX, y: contentY }}
      >
        <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-black/35 p-8 backdrop-blur-xl md:p-10">
          <h1
            ref={titleRef}
            className="mx-auto max-w-4xl bg-gradient-to-r from-emerald-300 via-cyan-200 to-cyan-400 bg-clip-text text-5xl font-extrabold tracking-[-0.03em] text-transparent md:text-6xl lg:text-7xl"
            style={{ textShadow: '0 0 20px rgba(0,255,150,0.18)' }}
          >
            {title}
          </h1>
          <p
            ref={subtitleRef}
            className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed tracking-[0.01em] text-slate-200 md:text-xl"
            style={{ textShadow: '0 0 12px rgba(0,255,150,0.12)' }}
          >
            {subtitle}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <MagneticAction
              className="sb-button-primary min-w-[220px]"
              href={primaryHref}
              onClick={primaryAction}
            >
              {primaryLabel}
            </MagneticAction>
            <MagneticAction className="sb-button-ghost min-w-[180px]" href={secondaryHref}>
              {secondaryLabel}
            </MagneticAction>
          </div>

          {featureChips.length ? (
            <div ref={cardsRef} className="mt-8 flex flex-wrap justify-center gap-3">
              {featureChips.map((item) => (
                <motion.div
                  key={item}
                  className="rounded-full border border-cyan-200/20 bg-slate-900/45 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-200 backdrop-blur-md"
                  whileHover={{ y: -4, scale: 1.02, boxShadow: '0 0 24px rgba(71, 255, 161, 0.16)' }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {item}
                </motion.div>
              ))}
            </div>
          ) : (
            <div ref={cardsRef} />
          )}
        </div>
      </motion.div>
    </section>
  );
}
