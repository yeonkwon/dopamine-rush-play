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
  
  // Visual effects
  private screenShake = 0;
  private screenShakeTimer = 0;
  private screenShakeOffsetX = 0;
  private screenShakeOffsetY = 0;

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
    this.updateScreenShake(deltaTime);
    
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

      // Update position
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      
      // Apply different physics based on particle type
      if (particle.type === 'death') {
        particle.velocityY += 0.1; // Light gravity for death particles
        particle.velocityX *= 0.98; // Air resistance
      } else if (particle.type === 'levelup') {
        particle.velocityY -= 0.05; // Float upward
        particle.velocityX *= 0.99; // Very light air resistance
      } else {
        particle.velocityY += 0.2; // Normal gravity for regular particles
      }
      
      // Update alpha with fade effect
      particle.alpha = particle.life / particle.maxLife;
      
      // Add some randomness to movement
      if (particle.type === 'death') {
        particle.velocityX += (Math.random() - 0.5) * 0.1;
        particle.velocityY += (Math.random() - 0.5) * 0.1;
      }
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
    
    // Create level up effect
    this.createLevelUpEffect();
    
    // Generate random skills (placeholder)
    this.gameState.availableSkills = [
      { name: 'Attack Speed', description: 'Increase attack speed by 25%' },
      { name: 'Health Boost', description: 'Increase max health by 20' },
      { name: 'Speed Boost', description: 'Increase movement speed by 20%' }
    ];
  }

  private createDeathParticles(x: number, y: number) {
    // Rainbow death particles
    const colors = ['#FF0080', '#FF8000', '#FFFF00', '#80FF00', '#00FF80', '#0080FF', '#8000FF'];
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 12,
        velocityY: (Math.random() - 0.5) * 12 - 3,
        life: 1500,
        maxLife: 1500,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        type: 'death',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    
    // Explosion effect
    this.createExplosionEffect(x, y);
  }

  private createHitParticles(x: number, y: number) {
    // Enhanced hit particles with multiple colors
    const hitColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: (Math.random() - 0.5) * 8 - 2,
        life: 800,
        maxLife: 800,
        alpha: 1,
        color: hitColors[Math.floor(Math.random() * hitColors.length)],
        size: Math.random() * 3 + 1,
        type: 'hit',
        rotation: 0,
        rotationSpeed: 0
      });
    }
    
    // Screen shake effect
    this.createScreenShake(3);
  }

  private createExplosionEffect(x: number, y: number) {
    // Create expanding ring effect
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.particles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * 6,
        velocityY: Math.sin(angle) * 6,
        life: 1000,
        maxLife: 1000,
        alpha: 1,
        color: '#FF4500',
        size: 4,
        type: 'explosion',
        rotation: 0,
        rotationSpeed: 0
      });
    }
  }

  private createScreenShake(intensity: number) {
    // Add screen shake effect
    this.screenShake = intensity;
    this.screenShakeTimer = 200;
  }

  private createLevelUpEffect() {
    // Create level up particles
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      this.particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        velocityX: -Math.cos(angle) * 3,
        velocityY: -Math.sin(angle) * 3,
        life: 2000,
        maxLife: 2000,
        alpha: 1,
        color: '#00FFFF',
        size: Math.random() * 5 + 3,
        type: 'levelup',
        rotation: 0,
        rotationSpeed: 0.1
      });
    }
  }

  private updateScreenShake(deltaTime: number) {
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= deltaTime;
      this.screenShakeOffsetX = (Math.random() - 0.5) * this.screenShake;
      this.screenShakeOffsetY = (Math.random() - 0.5) * this.screenShake;
      
      if (this.screenShakeTimer <= 0) {
        this.screenShake = 0;
        this.screenShakeOffsetX = 0;
        this.screenShakeOffsetY = 0;
      }
    }
  }

  private render() {
    // Apply screen shake
    this.ctx.save();
    this.ctx.translate(this.screenShakeOffsetX, this.screenShakeOffsetY);
    
    // Clear canvas with animated background
    const time = Date.now() * 0.001;
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, `hsl(${240 + Math.sin(time * 0.5) * 20}, 70%, 15%)`);
    gradient.addColorStop(1, `hsl(${280 + Math.cos(time * 0.3) * 30}, 80%, 20%)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render platforms with enhanced glow
    for (const platform of this.platforms) {
      // Platform glow
      this.ctx.shadowColor = platform.color;
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = platform.color;
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform highlight
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = this.lightenColor(platform.color, 0.3);
      this.ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height - 4);
    }

    // Render player with pulsing effect
    const playerPulse = 1 + Math.sin(time * 8) * 0.1;
    this.ctx.shadowColor = this.player.color;
    this.ctx.shadowBlur = 25;
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(
      this.player.x - (this.player.width * (playerPulse - 1)) / 2,
      this.player.y - (this.player.height * (playerPulse - 1)) / 2,
      this.player.width * playerPulse,
      this.player.height * playerPulse
    );
    this.ctx.shadowBlur = 0;

    // Render enemies with enhanced effects
    for (const enemy of this.enemies) {
      // Enemy glow
      this.ctx.shadowColor = enemy.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      this.ctx.shadowBlur = 0;

      // Enhanced health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      this.ctx.fillRect(enemy.x - 2, enemy.y - 12, enemy.width + 4, 6);
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 2);
    }

    // Render projectiles with trail effect
    for (const projectile of this.projectiles) {
      // Projectile trail
      this.ctx.shadowColor = projectile.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = projectile.color;
      this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
      
      // Trail particles
      for (let i = 1; i <= 3; i++) {
        this.ctx.globalAlpha = 0.3 / i;
        this.ctx.fillStyle = projectile.color;
        this.ctx.fillRect(
          projectile.x - projectile.velocityX * i * 0.1,
          projectile.y - projectile.velocityY * i * 0.1,
          projectile.width * 0.8,
          projectile.height * 0.8
        );
      }
      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 0;
    }

    // Render enhanced particles
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.save();
      this.ctx.translate(particle.x + particle.size / 2, particle.y + particle.size / 2);
      this.ctx.rotate(particle.rotation);
      
      if (particle.type === 'death') {
        // Rainbow death particles
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else if (particle.type === 'levelup') {
        // Level up star particles
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 15;
        this.drawStar(-particle.size / 2, -particle.size / 2, particle.size);
      } else {
        // Regular particles
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }
      
      this.ctx.shadowBlur = 0;
      this.ctx.restore();
      
      // Update particle rotation
      particle.rotation += particle.rotationSpeed;
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  private lightenColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private drawStar(x: number, y: number, size: number) {
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }
}
