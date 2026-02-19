import React, { useRef, useMemo, useLayoutEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, MathUtils } from 'three';
import { HandControls, GameStatus } from '../types';

interface CityProps {
  controlsRef: React.MutableRefObject<HandControls>;
  gameStatus: GameStatus;
  onGameOver: () => void;
  onScore: (points: number) => void;
}

const BUILDING_COUNT = 800;
const SHARD_COUNT = 50;
const CHUNK_SIZE = 600;
const BASE_SPEED = 60;
const MAX_SPEED = 180;

const City: React.FC<CityProps> = ({ controlsRef, gameStatus, onGameOver, onScore }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const lightMeshRef = useRef<InstancedMesh>(null);
  const shardsRef = useRef<InstancedMesh>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  
  // Player hitbox approximation
  const PLAYER_RADIUS = 0.8; 
  const PLAYER_Z = -2;

  // Neon palette
  const neonColors = useMemo(() => [
    '#ff00ff', '#00ffff', '#ccff00', '#ff0055', '#aa00ff'
  ], []);

  // Data State
  const [buildings] = useState(() => {
    const arr = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const scaleY = Math.random() * 40 + 10;
      const scaleXZ = Math.random() * 4 + 2;
      const x = (Math.random() - 0.5) * 200; 
      // Ensure a "safe tunnel" at the very start (z > -100) so player doesn't die instantly
      const xAdjusted = x > 0 ? x + 10 : x - 10;
      
      const z = -Math.random() * CHUNK_SIZE;
      const y = scaleY / 2 - 30;
      
      arr.push({ 
        position: [xAdjusted, y, z], 
        scale: [scaleXZ, scaleY, scaleXZ], 
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
        active: true
      });
    }
    return arr;
  });

  const [shards] = useState(() => {
    const arr = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
        arr.push({
            position: [(Math.random() - 0.5) * 100, (Math.random() * 20) - 10, -Math.random() * CHUNK_SIZE],
            active: true
        });
    }
    return arr;
  });

  // Initial Setup
  useLayoutEffect(() => {
    if (!meshRef.current || !lightMeshRef.current || !shardsRef.current) return;

    // Buildings
    buildings.forEach((data, i) => {
      dummy.position.set(data.position[0] as number, data.position[1] as number, data.position[2] as number);
      dummy.scale.set(data.scale[0] as number, data.scale[1] as number, data.scale[2] as number);
      dummy.updateMatrix();
      
      meshRef.current?.setMatrixAt(i, dummy.matrix);
      const darkness = Math.random() * 0.1;
      color.setRGB(darkness, darkness, darkness + 0.1); 
      meshRef.current?.setColorAt(i, color);

      // Wireframe
      dummy.scale.multiplyScalar(1.02);
      dummy.updateMatrix();
      lightMeshRef.current?.setMatrixAt(i, dummy.matrix);
      color.set(data.color as string);
      lightMeshRef.current?.setColorAt(i, color);
    });

    // Shards
    shards.forEach((data, i) => {
        dummy.position.set(data.position[0] as number, data.position[1] as number, data.position[2] as number);
        dummy.scale.set(1.5, 1.5, 1.5);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        shardsRef.current?.setMatrixAt(i, dummy.matrix);
        color.set('#ffd700'); // Gold
        shardsRef.current?.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
    lightMeshRef.current.instanceMatrix.needsUpdate = true;
    lightMeshRef.current.instanceColor!.needsUpdate = true;
    shardsRef.current.instanceMatrix.needsUpdate = true;
    shardsRef.current.instanceColor!.needsUpdate = true;
  }, [buildings, shards, dummy, color, neonColors]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING') return;
    if (!meshRef.current || !lightMeshRef.current || !shardsRef.current) return;

    const { x, y, isFlying } = controlsRef.current;
    
    // Calculate Speed based on time/difficulty
    const timeFactor = Math.min(state.clock.elapsedTime * 2, 100); 
    let currentSpeed = (isFlying ? BASE_SPEED : BASE_SPEED * 0.2) + timeFactor;
    currentSpeed = Math.min(currentSpeed, MAX_SPEED);

    const distance = currentSpeed * delta;
    
    // Add distance score implicitly by movement
    if (isFlying) {
        // approx 1 point per unit traveled? handled in App.tsx via simple accumulation or here. 
        // Let's do a simple frame-based score trigger to keep App updated? 
        // Actually, better to just let App handle time-based score, we handle event-based score (collisions).
    }

    // Player World Coordinates (Approximation matching PaperPlane.tsx logic)
    const playerX = x * 12;
    const playerY = -y * 8;
    
    // 1. Update Buildings & Check Collisions
    for (let i = 0; i < BUILDING_COUNT; i++) {
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      dummy.position.z += distance;

      // Recycle
      if (dummy.position.z > 20) {
        dummy.position.z -= CHUNK_SIZE;
        const xBase = (Math.random() - 0.5) * 200;
        dummy.position.x = xBase > 0 ? xBase + 15 : xBase - 15;
        // Randomize height on recycle
        dummy.scale.y = Math.random() * 40 + 10;
        dummy.position.y = dummy.scale.y / 2 - 30;
      }

      // Collision Detection
      // Only check if building is close to player Z
      if (Math.abs(dummy.position.z - PLAYER_Z) < (dummy.scale.z / 2 + PLAYER_RADIUS)) {
          // Check X (AABB)
          const halfWidth = dummy.scale.x / 2;
          if (Math.abs(dummy.position.x - playerX) < (halfWidth + PLAYER_RADIUS)) {
              // Check Y (AABB)
              const halfHeight = dummy.scale.y / 2;
              if (Math.abs(dummy.position.y - playerY) < (halfHeight + PLAYER_RADIUS)) {
                  onGameOver();
              }
          }
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Sync Wireframe
      const solidScale = dummy.scale.clone();
      dummy.scale.multiplyScalar(1.02);
      dummy.updateMatrix();
      lightMeshRef.current.setMatrixAt(i, dummy.matrix);
      dummy.scale.copy(solidScale); // revert scale
    }

    // 2. Update Shards
    for (let i = 0; i < SHARD_COUNT; i++) {
        shardsRef.current.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        // Move
        dummy.position.z += distance;
        
        // Rotate for effect
        dummy.rotation.x += delta;
        dummy.rotation.y += delta;

        // Recycle
        if (dummy.position.z > 20) {
            dummy.position.z -= CHUNK_SIZE;
            dummy.position.x = (Math.random() - 0.5) * 50; // Keep shards central
            dummy.position.y = (Math.random() * 20) - 10;
            // Reset scale if it was collected (hidden)
            dummy.scale.set(1.5, 1.5, 1.5);
        }

        // Collision with Shard
        if (dummy.scale.x > 0) { // Only check if not already collected
            const dist = Math.sqrt(
                Math.pow(dummy.position.x - playerX, 2) + 
                Math.pow(dummy.position.y - playerY, 2) + 
                Math.pow(dummy.position.z - PLAYER_Z, 2)
            );
            
            if (dist < 2.5) { // Generous pickup radius
                onScore(500);
                // "Hide" it by scaling to 0
                dummy.scale.set(0, 0, 0);
            }
        }

        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    lightMeshRef.current.instanceMatrix.needsUpdate = true;
    shardsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Dark Solid Buildings */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, BUILDING_COUNT]}>
        <boxGeometry />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
      </instancedMesh>

      {/* Neon Wireframes */}
      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, BUILDING_COUNT]}>
         <boxGeometry />
         <meshBasicMaterial wireframe toneMapped={false} />
      </instancedMesh>

      {/* Collectible Shards */}
      <instancedMesh ref={shardsRef} args={[undefined, undefined, SHARD_COUNT]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffd700" wireframe={true} />
      </instancedMesh>
      
      {/* Retro Grid Floor */}
      <gridHelper args={[400, 100, 0xff00ff, 0x111111]} position={[0, -30, 0]} />
    </group>
  );
};

export default City;