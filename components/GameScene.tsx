import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import PaperPlane from './PaperPlane';
import City from './City';
import { HandControls, GameStatus } from '../types';
import * as THREE from 'three';

interface GameSceneProps {
  controlsRef: React.MutableRefObject<HandControls>;
  gameStatus: GameStatus;
  onGameOver: () => void;
  onScore: (points: number) => void;
}

const SceneContent: React.FC<GameSceneProps> = ({ controlsRef, gameStatus, onGameOver, onScore }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={75} />
      
      {/* Dark, Moody Lighting */}
      <ambientLight intensity={0.2} color="#110022" />
      <pointLight position={[0, 10, 0]} intensity={1} color="#ffffff" />
      
      {/* Environment */}
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 20, 120]} /> 
      
      <Stars radius={200} depth={50} count={3000} factor={4} saturation={1} fade speed={gameStatus === 'PLAYING' ? 2 : 0.5} />
      
      {/* Game Objects */}
      <PaperPlane controlsRef={controlsRef} />
      <City 
        controlsRef={controlsRef} 
        gameStatus={gameStatus} 
        onGameOver={onGameOver} 
        onScore={onScore}
      />
    </>
  );
};

const GameScene: React.FC<GameSceneProps> = ({ controlsRef, gameStatus, onGameOver, onScore }) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <SceneContent controlsRef={controlsRef} gameStatus={gameStatus} onGameOver={onGameOver} onScore={onScore} />
      </Canvas>
    </div>
  );
};

export default GameScene;