import { GameCanvas } from '@/components/GameCanvas';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);

  if (gameStarted) {
    return <GameCanvas />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <Card className="bg-card/90 backdrop-blur-md border-2 border-primary/50 p-8 max-w-2xl mx-4 text-center space-y-8 z-10">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold rainbow-text">
            도파민 러시
          </h1>
          <h2 className="text-3xl font-bold text-primary pulse-glow">
            PLATFORMER
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the ultimate dopamine-driven platformer adventure
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="space-y-2">
            <div className="text-accent font-semibold">⚡ Fast-Paced Action</div>
            <div className="text-sm text-muted-foreground">
              Smooth physics-based platforming with satisfying controls
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-secondary font-semibold">🎯 Skill Progression</div>
            <div className="text-sm text-muted-foreground">
              Level up and choose from powerful abilities
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-primary font-semibold">✨ Reward Effects</div>
            <div className="text-sm text-muted-foreground">
              Stunning visual effects and instant gratification
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-game-xp font-semibold">🎮 Endless Fun</div>
            <div className="text-sm text-muted-foreground">
              Procedural enemies and dynamic difficulty
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="space-y-4">
          <Button
            onClick={() => setGameStarted(true)}
            className="game-button text-2xl px-12 py-6 text-primary-foreground bg-primary hover:bg-primary-glow transform hover:scale-110 transition-all duration-300"
          >
            🎮 START GAME
          </Button>
          <div className="text-sm text-muted-foreground">
            Use WASD/Arrow Keys to move, Space to attack
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
