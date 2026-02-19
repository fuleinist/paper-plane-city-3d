import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Euler } from 'three';
import { HandControls } from '../types';

interface PaperPlaneProps {
  controlsRef: React.MutableRefObject<HandControls>;
}

const PaperPlane: React.FC<PaperPlaneProps> = ({ controlsRef }) => {
  const groupRef = useRef<Group>(null);
  
  // Smoothing factors
  const positionLerp = 0.1;
  const rotationLerp = 0.1;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { x, y, isFlying } = controlsRef.current;
    
    // Target position based on hand coordinates
    // Map -1..1 hand coords to world space limits
    const targetX = x * 12; // Wider range
    const targetY = -y * 8; // Wider range

    // Lerp position
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * positionLerp;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * positionLerp;

    // Add some hovering bob motion if not flying
    const time = state.clock.getElapsedTime();
    const hoverY = isFlying ? 0 : Math.sin(time * 2) * 0.2;
    groupRef.current.position.y += hoverY * 0.1;

    // Banking logic (Rotation)
    const targetRoll = -x * 1.0; 
    const targetPitch = y * 0.8; 

    const currentRot = groupRef.current.rotation;
    
    groupRef.current.rotation.z += (targetRoll - currentRot.z) * rotationLerp;
    groupRef.current.rotation.x += (targetPitch - currentRot.x) * rotationLerp;

    // Forward speed boost visual (jitter)
    if (isFlying) {
      groupRef.current.position.z = -2 + (Math.random() - 0.5) * 0.05; 
    } else {
      groupRef.current.position.z += (-2 - groupRef.current.position.z) * 0.1; 
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      {/* Paper Plane Geometry */}
      <mesh rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.8, 2.5, 3]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#00ffff"
          emissiveIntensity={0.5}
          roughness={0.2} 
          metalness={0.8} 
        />
      </mesh>
      {/* Wings/Details */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0]}>
         <boxGeometry args={[0.05, 2.5, 0.5]} />
         <meshStandardMaterial color="#eeeeee" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      {/* Engine glow trail hint */}
      <pointLight position={[0, 0, 1.5]} color="#00ffff" distance={3} intensity={2} />
    </group>
  );
};

export default PaperPlane;