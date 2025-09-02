interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  jumpPower: number;
  onGround: boolean;
  health: number;
  maxHealth: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  color: string;
  type: 'basic' | 'jumper';
  lastAttack: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  damage: number;
  color: string;
}

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

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime = 0;
  private keys: { [key: string]: boolean } = {};
  
  // Game objects
  private player: Player;
  private enemies: Enemy[] = [];
  private platforms: Platform[] = [];
  private projectiles: Projectile[] = [];
  private particles: any[] = [];
  
  // Game state
  private gameState: GameState = {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    isLevelingUp: false,
    availableSkills: [],
    score: 0
  };

  // Callbacks
  public onStateUpdate?: (state: GameState) => void;

  // Game settings
  private gravity = 0.8;
  private enemySpawnTimer = 0;
  private enemySpawnInterval = 2000; // 2 seconds

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Initialize player
    this.player = {
      x: 100,
      y: 400,
      width: 32,
      height: 32,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpPower: 15,
      onGround: false,
      health: 100,
      maxHealth: 100,
      color: '#8B5CF6' // Primary purple
    };

    // Initialize platforms
    this.createPlatforms();
  }

  private createPlatforms() {
    this.platforms = [
      // Ground platforms
      { x: 0, y: 550, width: 400, height: 50, color: '#6366F1' },
      { x: 500, y: 550, width: 400, height: 50, color: '#6366F1' },
      { x: 1000, y: 550, width: 200, height: 50, color: '#6366F1' },
      
      // Mid-level platforms
      { x: 200, y: 450, width: 150, height: 20, color: '#8B5CF6' },
      { x: 450, y: 400, width: 200, height: 20, color: '#8B5CF6' },
      { x: 750, y: 350, width: 150, height: 20, color: '#8B5CF6' },
      
      // High platforms
      { x: 100, y: 300, width: 100, height: 20, color: '#A855F7' },
      { x: 600, y: 250, width: 200, height: 20, color: '#A855F7' },
    ];
  }

  public handleKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
  }

  public handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  public selectSkill(skillIndex: number) {
    // Handle skill selection
    this.gameState.isLevelingUp = false;
    this.gameState.availableSkills = [];
  }

  public start() {
    this.gameLoop(0);
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop = (currentTime: number) => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number) {
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateParticles(deltaTime);
    this.checkCollisions();
    this.spawnEnemies(deltaTime);
    
    // Update game state
    this.gameState.health = this.player.health;
    this.gameState.maxHealth = this.player.maxHealth;
    
    if (this.onStateUpdate) {
      this.onStateUpdate({ ...this.gameState });
    }
  }

  private updatePlayer(deltaTime: number) {
    // Handle input
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.velocityX = -this.player.speed;
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.velocityX = this.player.speed;
    } else {
      this.player.velocityX *= 0.8; // Friction
    }

    if ((this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) && this.player.onGround) {
      this.player.velocityY = -this.player.jumpPower;
      this.player.onGround = false;
    }

    // Attack
    if (this.keys['Space']) {
      this.attack();
    }

    // Apply gravity
    this.player.velocityY += this.gravity;

    // Update position
    this.player.x += this.player.velocityX;
    this.player.y += this.player.velocityY;

    // Reset ground state
    this.player.onGround = false;

    // Platform collision
    for (const platform of this.platforms) {
      if (this.checkCollision(this.player, platform)) {
        if (this.player.velocityY > 0 && this.player.y < platform.y) {
          this.player.y = platform.y - this.player.height;
          this.player.velocityY = 0;
          this.player.onGround = true;
        }
      }
    }

    // Keep player in bounds
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > this.canvas.width - this.player.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
    if (this.player.y > this.canvas.height) {
      this.player.y = 400;
      this.player.health -= 10; // Fall damage
    }
  }

  private updateEnemies(deltaTime: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Simple AI - move towards player
      const dx = this.player.x - enemy.x;
      const distance = Math.abs(dx);
      
      if (distance > 5) {
        enemy.velocityX = dx > 0 ? 2 : -2;
      } else {
        enemy.velocityX = 0;
      }

      // Apply gravity
      enemy.velocityY += this.gravity;

      // Update position
      enemy.x += enemy.velocityX;
      enemy.y += enemy.velocityY;

      // Platform collision for enemies
      for (const platform of this.platforms) {
        if (this.checkCollision(enemy, platform)) {
          if (enemy.velocityY > 0 && enemy.y < platform.y) {
            enemy.y = platform.y - enemy.height;
            enemy.velocityY = 0;
          }
        }
      }

      // Remove dead enemies
      if (enemy.health <= 0) {
        this.addExperience(25);
        this.gameState.score += 100;
        this.createDeathParticles(enemy.x, enemy.y);
        this.enemies.splice(i, 1);
      }

      // Remove enemies that fall off screen
      if (enemy.y > this.canvas.height + 100) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateProjectiles(deltaTime: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      projectile.x += projectile.velocityX;
      projectile.y += projectile.velocityY;

      // Remove projectiles that are off screen
      if (projectile.x < 0 || projectile.x > this.canvas.width || 
          projectile.y < 0 || projectile.y > this.canvas.height) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (this.checkCollision(projectile, enemy)) {
          enemy.health -= projectile.damage;
          this.createHitParticles(projectile.x, projectile.y);
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  private updateParticles(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.2; // Gravity for particles
      particle.alpha = particle.life / particle.maxLife;
    }
  }

  private checkCollisions() {
    // Player-enemy collision
    for (const enemy of this.enemies) {
      if (this.checkCollision(this.player, enemy)) {
        if (Date.now() - enemy.lastAttack > 1000) { // 1 second cooldown
          this.player.health -= 10;
          enemy.lastAttack = Date.now();
          this.createHitParticles(this.player.x, this.player.y);
        }
      }
    }
  }

  private checkCollision(obj1: any, obj2: any): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  private attack() {
    // Create projectile
    const projectile: Projectile = {
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
      velocityX: this.player.velocityX > 0 ? 8 : this.player.velocityX < 0 ? -8 : 8,
      velocityY: 0,
      width: 8,
      height: 8,
      damage: 25,
      color: '#06D6A0'
    };
    
    this.projectiles.push(projectile);
  }

  private spawnEnemies(deltaTime: number) {
    this.enemySpawnTimer += deltaTime;
    
    if (this.enemySpawnTimer > this.enemySpawnInterval) {
      this.enemySpawnTimer = 0;
      
      const enemy: Enemy = {
        x: Math.random() * (this.canvas.width - 32),
        y: 100,
        width: 24,
        height: 24,
        velocityX: 0,
        velocityY: 0,
        health: 50,
        maxHealth: 50,
        color: '#EF4444',
        type: 'basic',
        lastAttack: 0
      };
      
      this.enemies.push(enemy);
    }
  }

  private addExperience(amount: number) {
    this.gameState.experience += amount;
    
    if (this.gameState.experience >= this.gameState.experienceToNext) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.gameState.level++;
    this.gameState.experience = 0;
    this.gameState.experienceToNext = Math.floor(this.gameState.experienceToNext * 1.5);
    this.gameState.isLevelingUp = true;
    
    // Generate random skills (placeholder)
    this.gameState.availableSkills = [
      { name: 'Attack Speed', description: 'Increase attack speed by 25%' },
      { name: 'Health Boost', description: 'Increase max health by 20' },
      { name: 'Speed Boost', description: 'Increase movement speed by 20%' }
    ];
  }

  private createDeathParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: (Math.random() - 0.5) * 8 - 2,
        life: 1000,
        maxLife: 1000,
        alpha: 1,
        color: '#06D6A0',
        size: 3
      });
    }
  }

  private createHitParticles(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4 - 1,
        life: 500,
        maxLife: 500,
        alpha: 1,
        color: '#F59E0B',
        size: 2
      });
    }
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render platforms
    for (const platform of this.platforms) {
      this.ctx.fillStyle = platform.color;
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add glow effect
      this.ctx.shadowColor = platform.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      this.ctx.shadowBlur = 0;
    }

    // Render player
    this.ctx.fillStyle = this.player.color;
    this.ctx.shadowColor = this.player.color;
    this.ctx.shadowBlur = 15;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    this.ctx.shadowBlur = 0;

    // Render enemies
    for (const enemy of this.enemies) {
      this.ctx.fillStyle = enemy.color;
      this.ctx.shadowColor = enemy.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      this.ctx.shadowBlur = 0;

      // Health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
    }

    // Render projectiles
    for (const projectile of this.projectiles) {
      this.ctx.fillStyle = projectile.color;
      this.ctx.shadowColor = projectile.color;
      this.ctx.shadowBlur = 5;
      this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
      this.ctx.shadowBlur = 0;
    }

    // Render particles
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    this.ctx.globalAlpha = 1;
  }
}
