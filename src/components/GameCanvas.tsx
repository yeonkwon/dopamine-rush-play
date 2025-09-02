import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '@/lib/gameEngine';
import { GameUI } from './GameUI';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState({
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    isLevelingUp: false,
    availableSkills: [],
    score: 0
  });

  const handleSkillSelect = useCallback((skillIndex: number) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.selectSkill(skillIndex);
      setGameState(prev => ({ ...prev, isLevelingUp: false }));
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 600;

    // Initialize game engine
    const gameEngine = new GameEngine(canvas, ctx);
    gameEngineRef.current = gameEngine;

    // Game state update callback
    gameEngine.onStateUpdate = (newState) => {
      setGameState(newState);
    };

    // Start game loop
    gameEngine.start();

    // Cleanup
    return () => {
      gameEngine.stop();
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleKeyDown(e);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleKeyUp(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-blue-900/20"
        style={{ 
          imageRendering: 'pixelated',
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
      
      <GameUI 
        gameState={gameState}
        onSkillSelect={handleSkillSelect}
      />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-sm text-muted-foreground">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3">
          <div className="text-primary font-semibold mb-1">Controls:</div>
          <div>WASD/Arrow Keys - Move & Jump</div>
          <div>Space - Attack</div>
        </div>
      </div>
    </div>
  );
};