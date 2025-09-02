import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface GameState {
  level: number;
  experience: number;
  experienceToNext: number;
  health: number;
  maxHealth: number;
  isLevelingUp: boolean;
  availableSkills: any[];
  score: number;
}

interface GameUIProps {
  gameState: GameState;
  onSkillSelect: (skillIndex: number) => void;
}

export const GameUI = ({ gameState, onSkillSelect }: GameUIProps) => {
  const healthPercent = (gameState.health / gameState.maxHealth) * 100;
  const xpPercent = (gameState.experience / gameState.experienceToNext) * 100;

  return (
    <>
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex justify-between items-start">
          {/* Left side - Player stats */}
          <Card className="bg-card/80 backdrop-blur-sm p-4 min-w-[300px]">
            <div className="space-y-3">
              {/* Level and Score */}
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-primary rainbow-text">
                  Level {gameState.level}
                </div>
                <div className="text-lg font-semibold text-accent">
                  Score: {gameState.score.toLocaleString()}
                </div>
              </div>

              {/* Health Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">Health</span>
                  <span className="text-muted-foreground">
                    {gameState.health}/{gameState.maxHealth}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={healthPercent} 
                    className="h-3 bg-muted"
                  />
                  <div 
                    className="absolute inset-0 h-3 rounded-full health-bar opacity-90"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>

              {/* Experience Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">Experience</span>
                  <span className="text-muted-foreground">
                    {gameState.experience}/{gameState.experienceToNext}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={xpPercent} 
                    className="h-3 bg-muted"
                  />
                  <div 
                    className="absolute inset-0 h-3 rounded-full xp-bar opacity-90"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Right side - Mini map placeholder */}
          <Card className="bg-card/80 backdrop-blur-sm p-3">
            <div className="w-32 h-20 bg-muted/50 rounded border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Mini Map</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Level Up Modal */}
      {gameState.isLevelingUp && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-card/95 backdrop-blur-md border-2 border-primary p-8 max-w-2xl mx-4 level-up-effect">
            <div className="text-center space-y-6">
              {/* Level Up Header */}
              <div className="space-y-2">
                <h1 className="text-6xl font-bold rainbow-text pulse-glow">
                  LEVEL UP!
                </h1>
                <h2 className="text-3xl font-bold text-primary">
                  Level {gameState.level}
                </h2>
                <p className="text-lg text-muted-foreground">
                  Choose your upgrade
                </p>
              </div>

              {/* Skill Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameState.availableSkills.map((skill, index) => (
                  <Button
                    key={index}
                    onClick={() => onSkillSelect(index)}
                    className="game-button h-auto p-6 flex flex-col space-y-3 hover:scale-105 transition-transform"
                    variant="outline"
                  >
                    <div className="text-xl font-bold text-primary">
                      {skill.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {skill.description}
                    </div>
                  </Button>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Click on a skill to continue
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Floating damage numbers and effects would go here */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Particle effects and floating text */}
      </div>
    </>
  );
};