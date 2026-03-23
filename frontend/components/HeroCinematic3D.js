import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Float, Sparkles, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import * as THREE from 'three';

function EncryptedBlocks() {
  const groupRef = useRef(null);
  const blockPositions = useMemo(
    () => [
      [-1.2, 0.5, 0],
      [0.1, 1.1, -0.7],
      [1.1, 0.3, 0.3],
      [-0.6, -0.7, 0.4],
      [0.8, -0.8, -0.4],
      [0.2, 0, 0.9],
    ],
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      state.pointer.y * 0.35,
      0.06
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -state.pointer.x * 0.2,
      0.06
    );
  });

  return (
    <group ref={groupRef}>
      {blockPositions.map((position, idx) => (
        <Float key={`${position[0]}-${position[1]}`} speed={1.2 + idx * 0.08} rotationIntensity={0.6}>
          <mesh position={position} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshPhysicalMaterial
              color="#89ffe0"
              roughness={0.08}
              metalness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.1}
              transmission={0.72}
              thickness={1.8}
              emissive="#2dff81"
              emissiveIntensity={0.42}
            />
            <Edges color="#66ff95" />
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
    coinGroup.current.position.x = THREE.MathUtils.lerp(
      coinGroup.current.position.x,
      state.pointer.x * 0.35,
      0.05
    );
  });

  return (
    <group ref={coinGroup}>
      <Float speed={1.1} rotationIntensity={0.5}>
        <mesh position={[-2.2, 1.1, -0.6]}>
          <cylinderGeometry args={[0.55, 0.55, 0.14, 36]} />
          <meshStandardMaterial color="#8df5ff" metalness={0.8} roughness={0.12} />
        </mesh>
        <Text position={[-2.2, 1.1, -0.5]} fontSize={0.5} color="#0c1a24" anchorX="center" anchorY="middle">
          Ξ
        </Text>
      </Float>

      <Float speed={1.2} rotationIntensity={0.5}>
        <mesh position={[2.25, 0.7, -0.8]}>
          <cylinderGeometry args={[0.55, 0.55, 0.14, 36]} />
          <meshStandardMaterial color="#d5f9ff" metalness={0.95} roughness={0.18} />
        </mesh>
        <Text position={[2.25, 0.7, -0.7]} fontSize={0.42} color="#0f1820" anchorX="center" anchorY="middle">
          ₿
        </Text>
      </Float>
    </group>
  );
}

function HeroScene() {
  return (
    <>
      <color attach="background" args={['#0b0f17']} />
      <fog attach="fog" args={['#09141d', 5, 15]} />
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 2, 4]} intensity={1.4} color="#71ffc8" />
      <spotLight
        position={[3, 6, 2]}
        angle={0.55}
        penumbra={1}
        intensity={2.4}
        color="#54d9ff"
        castShadow
      />

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
        <sphereGeometry args={[2.9, 32, 32]} />
        <meshBasicMaterial color="#4dff9f" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0.7, -0.3, -2.2]}>
        <sphereGeometry args={[3.8, 32, 32]} />
        <meshBasicMaterial color="#5ed1ff" transparent opacity={0.05} />
      </mesh>
    </>
  );
}

export default function HeroCinematic3D() {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardsRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(titleRef.current, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
      .fromTo(subtitleRef.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
      .fromTo(
        cardsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 },
        '-=0.35'
      );
  }, []);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x, y });
  }

  return (
    <section ref={heroRef} className="cinematic-hero" onMouseMove={handleMouseMove}>
      <div className="hero-canvas-layer">
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.8]}>
          <HeroScene />
        </Canvas>
      </div>

      <div className="hero-grid-overlay" style={{ transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)` }} />
      <div className="hero-glow-wave wave-a" />
      <div className="hero-glow-wave wave-b" />

      <div className="hero-content">
        <h1 ref={titleRef} className="hero-title-cinematic">
          Encrypted Execution Layer
        </h1>
        <p ref={subtitleRef} className="hero-subtitle-cinematic">
          Invisible to bots. Built for institutions.
        </p>

        <div ref={cardsRef} className="floating-feature-cards">
          {['Encrypted Orders', 'Private Matching', 'Zero MEV'].map((item) => (
            <motion.div
              key={item}
              className="floating-feature-card"
              whileHover={{ y: -8, boxShadow: '0 0 42px rgba(71, 255, 161, 0.33)' }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
