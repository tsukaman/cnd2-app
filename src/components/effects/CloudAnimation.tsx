'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedCloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      cloudRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={cloudRef} position={position} scale={scale}>
        <Cloud
          opacity={0.5}
          speed={0.4}
        />
      </group>
    </Float>
  );
}

export default function CloudAnimation() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Background Stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Floating Clouds */}
        <AnimatedCloud position={[-4, 2, -2]} scale={2} />
        <AnimatedCloud position={[4, -1, -3]} scale={1.5} />
        <AnimatedCloud position={[0, 3, -4]} scale={2.5} />
        <AnimatedCloud position={[-3, -2, -1]} scale={1.8} />
        <AnimatedCloud position={[3, 1, -2]} scale={1.3} />
      </Canvas>
    </div>
  );
}