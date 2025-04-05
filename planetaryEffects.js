// planetaryEffects.js - Efectos especiales para cada planeta en el juego Lunar Lander
class PlanetaryEffects {
  constructor(game) {
    if (!game || !game.canvas) {
      throw new Error("Se requiere una instancia válida del juego con canvas");
    }
    
    this.game = {
      width: game.width,
      height: game.height,
      ctx: game.ctx,
      terrain: game.terrain || [],
      level: game.level,
      canvas: game.canvas,
      player: game.player, // Asegurarnos de tener acceso al jugador
      getCurrentTime: game.getCurrentTime || (() => Date.now()) // Función para obtener el tiempo actual
    };
    
    this.initEffects();
    this.currentEffect = null;
  }
  initEffects() {
    this.effects = {
      // Luna (nivel 1) - Sin efectos especiales
      0: {
        init: () => {},
        update: () => {},
        draw: () => {}
      },
      
      // Marte (nivel 2) - Tormenta de polvo y meteoritos
      1: {
        meteors: [],
        dustParticles: [],
        
        init: function() {
          this.meteors = [];
          this.dustParticles = [];
          
          // Partículas de polvo
          for (let i = 0; i < 50; i++) {
            this.dustParticles.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 3 + 1,
              speed: Math.random() * 0.5 + 0.2
            });
          }
          
          // Meteoritos iniciales
          for (let i = 0; i < 3; i++) {
            this.addMeteor();
          }
        },
        
        addMeteor: function() {
          if (!this.meteors) this.meteors = [];
          
          const side = Math.floor(Math.random() * 3);
          const size = Math.random() * 10 + 5;
          const speed = Math.random() * 3 + 2;
          
          let x, y, speedX, speedY;
          
          if (side === 0) { // Desde arriba
            x = Math.random() * this.game.width;
            y = -20;
            speedX = (Math.random() - 0.5) * 2;
            speedY = speed;
          } else if (side === 1) { // Desde la derecha
            x = this.game.width + 20;
            y = Math.random() * this.game.height / 2;
            speedX = -speed;
            speedY = Math.random() * speed;
          } else { // Desde la izquierda
            x = -20;
            y = Math.random() * this.game.height / 2;
            speedX = speed;
            speedY = Math.random() * speed;
          }
          
          this.meteors.push({ x, y, speedX, speedY, size });
        },
        
        update: function(deltaTime) {
          if (!this.dustParticles) this.dustParticles = [];
          if (!this.meteors) this.meteors = [];
          
          // Actualizar polvo
          this.dustParticles.forEach(p => {
            p.x -= p.speed;
            if (p.x < 0) {
              p.x = this.game.width;
              p.y = Math.random() * this.game.height;
            }
          });
          
          // Actualizar meteoritos
          this.meteors.forEach(m => {
            m.x += m.speedX;
            m.y += m.speedY;
          });
          
          // Eliminar meteoritos fuera de pantalla
          this.meteors = this.meteors.filter(m => 
            m.x > -50 && m.x < this.game.width + 50 && 
            m.y > -50 && m.y < this.game.height + 50
          );
          
          // Añadir nuevos meteoritos
          if (Math.random() < 0.01 && this.meteors.length < 5) {
            this.addMeteor();
          }
        },
        
        draw: function(ctx) {
          if (!ctx) return;
          
          // Dibujar polvo
          ctx.fillStyle = 'rgba(193, 68, 14, 0.5)';
          this.dustParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          });
          
          // Dibujar meteoritos
          this.meteors.forEach(m => {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(Math.atan2(m.speedY, m.speedX));
            
            // Cuerpo del meteorito
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-m.size * 2, -m.size);
            ctx.lineTo(-m.size * 2, m.size);
            ctx.closePath();
            ctx.fill();
            
            // Cola del meteorito
            const gradient = ctx.createLinearGradient(0, 0, -m.size * 3, 0);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-m.size * 3, -m.size / 2);
            ctx.lineTo(-m.size * 3, m.size / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          });
        }
      },
      
      // Venus (nivel 3) - Nubes ácidas y lluvia corrosiva
      2: {
        clouds: [],
        rainDrops: [],
        init() {
          // Crear nubes
          for (let i = 0; i < 5; i++) {
            this.clouds.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height / 3,
              width: Math.random() * 100 + 50,
              speed: Math.random() * 0.5 + 0.3
            });
          }
        },
        update() {
          // Mover nubes
          for (let c of this.clouds) {
            c.x += c.speed;
            if (c.x > this.game.width + c.width) {
              c.x = -c.width;
              c.y = Math.random() * this.game.height / 3;
            }
            
            // Ocasionalmente generar lluvia
            if (Math.random() < 0.02) {
              for (let i = 0; i < 5; i++) {
                this.rainDrops.push({
                  x: c.x + Math.random() * c.width,
                  y: c.y + 20,
                  speed: Math.random() * 3 + 2
                });
              }
            }
          }
          
          // Mover gotas de lluvia
          for (let r of this.rainDrops) {
            r.y += r.speed;
            
            // Eliminar gotas que salen de la pantalla
            if (r.y > this.game.height) {
              const index = this.rainDrops.indexOf(r);
              if (index > -1) this.rainDrops.splice(index, 1);
            }
          }
        },
        draw() {
          const ctx = this.game.ctx;
          
          // Dibujar nubes
          for (let c of this.clouds) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, c.width / 2, 20, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Dibujar lluvia
          for (let r of this.rainDrops) {
            ctx.strokeStyle = 'rgba(200, 200, 0, 0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 5, r.y + 10);
            ctx.stroke();
          }
        }
      },
      
      // Titán (nivel 4) - Niebla espesa y lluvia de metano
      3: {
        fog: [],
        methaneBubbles: [],
        init() {
          // Crear niebla
          for (let i = 0; i < 30; i++) {
            this.fog.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 50 + 20,
              opacity: Math.random() * 0.3 + 0.1
            });
          }
          
          // Crear burbujas de metano
          for (let i = 0; i < 10; i++) {
            this.methaneBubbles.push({
              x: Math.random() * this.game.width,
              y: this.game.height + Math.random() * 50,
              size: Math.random() * 15 + 5,
              speed: Math.random() * 1 + 0.5,
              wobble: Math.random() * 0.1
            });
          }
        },
        update() {
          // Mover burbujas de metano
          for (let b of this.methaneBubbles) {
            b.y -= b.speed;
            b.x += Math.sin(b.y * 0.1) * b.wobble;
            
            // Reiniciar burbujas que salen por arriba
            if (b.y < -20) {
              b.y = this.game.height + Math.random() * 50;
              b.x = Math.random() * this.game.width;
            }
          }
        },
        draw() {
          const ctx = this.game.ctx;
          
          // Dibujar niebla
          for (let f of this.fog) {
            ctx.fillStyle = `rgba(139, 69, 19, ${f.opacity})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Dibujar burbujas de metano
          for (let b of this.methaneBubbles) {
            // Burbuja
            ctx.fillStyle = 'rgba(100, 200, 100, 0.6)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Reflejo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(b.x - b.size/3, b.y - b.size/3, b.size/3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      
      // Europa (nivel 5) - Tormenta de nieve y géiseres
      4: {
        snowflakes: [],
        geysers: [],
        lastGeyserTime: 0,
        init() {
          // Crear copos de nieve
          for (let i = 0; i < 100; i++) {
            this.snowflakes.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 3 + 1,
              speed: Math.random() * 1 + 0.5,
              sway: Math.random() * 0.5
            });
          }
          
          // Crear posiciones de géiseres
          for (let i = 0; i < 5; i++) {
            this.geysers.push({
              x: Math.random() * this.game.width,
              y: this.game.height - 50,
              active: false,
              particles: [],
              nextActivation: Math.random() * 3000 + 2000 // 2-5 segundos
            });
          }
        },
        update(timestamp) {
          // Mover copos de nieve
          for (let s of this.snowflakes) {
            s.y += s.speed;
            s.x += Math.sin(s.y * 0.05) * s.sway;
            
            if (s.y > this.game.height) {
              s.y = 0;
              s.x = Math.random() * this.game.width;
            }
          }
          
          // Actualizar géiseres
          for (let g of this.geysers) {
            if (!g.active && timestamp > g.nextActivation) {
              g.active = true;
              g.particles = [];
              
              // Crear partículas para el géiser
              for (let i = 0; i < 30; i++) {
                g.particles.push({
                  x: g.x + (Math.random() - 0.5) * 20,
                  y: g.y,
                  speedX: (Math.random() - 0.5) * 0.5,
                  speedY: -(Math.random() * 5 + 3),
                  size: Math.random() * 3 + 2,
                  life: Math.random() * 1000 + 500 // 0.5-1.5 segundos
                });
              }
            }
            
            if (g.active) {
              // Actualizar partículas del géiser
              for (let p of g.particles) {
                p.x += p.speedX;
                p.y += p.speedY;
                p.speedY += 0.05; // Gravedad
                p.life -= 16; // Asumiendo ~60fps
              }
              
              // Eliminar partículas muertas
              g.particles = g.particles.filter(p => p.life > 0);
              
              // Si no quedan partículas, desactivar el géiser
              if (g.particles.length === 0) {
                g.active = false;
                g.nextActivation = timestamp + Math.random() * 3000 + 2000;
              }
            }
          }
        },
        draw() {
          const ctx = this.game.ctx;
          
          // Dibujar copos de nieve
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (let s of this.snowflakes) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Dibujar géiseres
          for (let g of this.geysers) {
            if (g.active) {
              for (let p of g.particles) {
                const opacity = p.life / 1500; // Fade out
                ctx.fillStyle = `rgba(173, 216, 230, ${opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
      },
      
      // Kepler-22b (nivel 6) - Vegetación alienígena y esporas flotantes
      5: {
        plants: [],
        spores: [],
        init() {
          // Crear plantas alienígenas en el terreno
          for (let i = 0; i < 20; i++) {
            const segment = Math.floor(Math.random() * (this.game.terrain.length - 1));
            const t1 = this.game.terrain[segment];
            const t2 = this.game.terrain[segment + 1];
            const x = t1.x + Math.random() * (t2.x - t1.x);
            const y = t1.y + Math.random() * (t2.y - t1.y);
            
            this.plants.push({
              x,
              y,
              height: Math.random() * 30 + 10,
              sway: Math.random() * 0.1
            });
          }
          
          // Crear esporas flotantes
          for (let i = 0; i < 30; i++) {
            this.spores.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 5 + 2,
              speed: Math.random() * 0.3 + 0.1,
              sway: Math.random() * 0.05,
              angle: Math.random() * Math.PI * 2
            });
          }
        },
        update() {
          // Mover esporas
          for (let s of this.spores) {
            s.y -= s.speed;
            s.x += Math.sin(s.angle) * s.sway;
            s.angle += 0.02;
            
            if (s.y < -10) {
              s.y = this.game.height + 10;
              s.x = Math.random() * this.game.width;
            }
          }
        },
        draw() {
          const ctx = this.game.ctx;
          
          // Dibujar plantas alienígenas
          for (let p of this.plants) {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            // Tallo
            ctx.strokeStyle = '#7CFC00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
              5 * Math.sin(Date.now() * 0.001 * p.sway), 
              -p.height / 2,
              0, 
              -p.height
            );
            ctx.stroke();
            
            // Cabeza de la planta
            ctx.fillStyle = '#9ACD32';
            ctx.beginPath();
            ctx.arc(0, -p.height, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
          }
          
          // Dibujar esporas
          for (let s of this.spores) {
            ctx.fillStyle = 'rgba(154, 205, 50, 0.7)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Patrón interior
            ctx.fillStyle = 'rgba(124, 252, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      
      // Io (nivel 7) - Tormenta eléctrica con rayos aleatorios
     // Io (nivel 7) - Tormenta eléctrica con rayos aleatorios - VERSIÓN CORREGIDA
// Io (nivel 7) - Tormenta eléctrica con rayos centrados
6: {
  lastLightningTime: 0,
  lightningCooldown: 2500, // 2.5 segundos iniciales
  flashDuration: 1500, // 1.5 segundos de ceguera
  isFlashing: false,
  flashStartTime: 0,
  lightningPosition: { x: 0, y: 0 },
  lightningActive: false,
  lightningActiveTime: 0,
  
  init: function() {
    this.lastLightningTime = this.game.getCurrentTime();
    this.isFlashing = false;
    this.lightningCooldown = Math.random() * 3000 + 1000; // 1-4 segundos
    this.lightningActive = false;
  },
  
  update: function() {
    const currentTime = this.game.getCurrentTime();
    
    // Verificar si es tiempo de un nuevo rayo
    if (!this.isFlashing && currentTime - this.lastLightningTime > this.lightningCooldown) {
      this.triggerLightning(currentTime);
    }
    
    // Controlar el tiempo que el rayo es visible (solo 200ms)
    if (this.lightningActive && currentTime - this.lightningActiveTime > 200) {
      this.lightningActive = false;
    }
    
    // Verificar si termina el efecto de flash
    if (this.isFlashing && currentTime - this.flashStartTime > this.flashDuration) {
      this.isFlashing = false;
      // Establecer un nuevo tiempo de espera aleatorio
      this.lightningCooldown = Math.random() * 5000 + 3000; // 3-8 segundos
      this.lastLightningTime = currentTime;
    }
  },
  
  triggerLightning: function(currentTime) {
    this.isFlashing = true;
    this.flashStartTime = currentTime;
    this.lightningActive = true;
    this.lightningActiveTime = currentTime;
    
    // Posición centrada con variación aleatoria controlada
    const centerX = this.game.width / 2;
    const centerY = this.game.height * 0.2; // 20% desde arriba
    
    // Variación aleatoria (30% del ancho/alto del mapa)
    const variationX = (Math.random() - 0.5) * this.game.width * 0.3;
    const variationY = Math.random() * this.game.height * 0.1;
    
    this.lightningPosition = {
      x: centerX + variationX,
      y: centerY + variationY
    };
    
    // Aplicar efecto de ceguera al jugador
    if (this.game.player) {
      this.game.player.isBlinded = true;
      setTimeout(() => {
        if (this.game.player) {
          this.game.player.isBlinded = false;
        }
      }, this.flashDuration);
    }
  },
  
  draw: function(ctx) {
    if (!ctx) return;
    
    const currentTime = this.game.getCurrentTime();
    const elapsed = currentTime - this.flashStartTime;
    
    // 1. Dibujar el rayo primero (si está activo)
    if (this.lightningActive) {
      this.drawLightning(ctx, this.lightningPosition.x, this.lightningPosition.y);
    }
    
    // 2. Dibujar el efecto de flash (solo si está activo)
    if (this.isFlashing) {
      const progress = Math.min(elapsed / this.flashDuration, 1);
      const flashIntensity = 1 - progress;
      
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.7})`;
      ctx.fillRect(0, 0, this.game.width, this.game.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  },
  
  drawLightning: function(ctx, x, y) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Dibujar el rayo principal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    
    const segments = 12;
    const height = this.game.height - y;
    const segmentHeight = height / segments;
    
    let currentX = x;
    let currentY = y;
    
    // Camino principal del rayo
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    
    for (let i = 1; i <= segments; i++) {
      const nextY = currentY + segmentHeight;
      // Menor variación en X para rayos más verticales
      const nextX = currentX + (Math.random() - 0.5) * 20;
      
      ctx.lineTo(nextX, nextY);
      currentX = nextX;
      currentY = nextY;
    }
    
    ctx.stroke();
    
    // Dibujar ramificaciones (menos numerosas pero más largas)
    for (let i = 1; i < segments; i += 2) { // Cada 2 segmentos
      if (Math.random() > 0.6) { // 40% de probabilidad de ramificación
        const branchY = y + i * segmentHeight;
        const branchX = currentX + (Math.random() - 0.5) * 30;
        const branchLength = Math.random() * 60 + 30;
        
        ctx.beginPath();
        ctx.moveTo(branchX, branchY);
        
        const branchSegments = 3;
        for (let j = 1; j <= branchSegments; j++) {
          const nextBranchY = branchY + j * (branchLength / branchSegments);
          const nextBranchX = branchX + (Math.random() - 0.5) * 40;
          ctx.lineTo(nextBranchX, nextBranchY);
        }
        
        ctx.stroke();
      }
    }
    
    // Aura más intensa en la parte superior
    const gradient = ctx.createRadialGradient(
      x, y, 5,
      x, y, 120
    );
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 120, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
},
      // Nexus-6 (nivel 8) - Niebla tecnológica y distorsión
      7: {
        fogParticles: [],
        distortion: {
          time: 0,
          intensity: 0.5
        },
        init() {
          // Crear partículas de niebla tecnológica
          for (let i = 0; i < 50; i++) {
            this.fogParticles.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 10 + 5,
              speed: Math.random() * 0.3 + 0.1,
              angle: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.02
            });
          }
        },
        update() {
          this.distortion.time += 0.01;
          
          // Mover partículas de niebla
          for (let p of this.fogParticles) {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.angle += p.rotationSpeed;
            
            // Mantener las partículas dentro de la pantalla
            if (p.x < -p.size) p.x = this.game.width + p.size;
            if (p.x > this.game.width + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = this.game.height + p.size;
            if (p.y > this.game.height + p.size) p.y = -p.size;
          }
        },
        draw() {
          const ctx = this.game.ctx;
          
          // Dibujar distorsión de fondo
          ctx.save();
          
          // Aplicar efecto de onda a todo el canvas
          const waveIntensity = Math.sin(this.distortion.time) * this.distortion.intensity;
          for (let y = 0; y < this.game.height; y += 10) {
            const offsetX = Math.sin(y * 0.05 + this.distortion.time) * waveIntensity * 10;
            ctx.drawImage(
              this.game.canvas,
              0, y, this.game.width, 10,
              offsetX, y, this.game.width, 10
            );
          }
          
          ctx.restore();
          
          // Dibujar partículas de niebla tecnológica
          for (let p of this.fogParticles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            
            // Forma hexagonal para efecto tecnológico
            ctx.fillStyle = 'rgba(128, 0, 128, 0.3)';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI * 2 / 6) + Math.PI / 2;
              const x = Math.cos(angle) * p.size;
              const y = Math.sin(angle) * p.size;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
        }
      },
      
      // Mustafar (nivel 9) - Ríos de lava y ceniza
      8: {
        meteors: [],
        fogParticles: [],
          
        init: function() {
          // Meteoritos (8 al inicio)
          this.meteors = [];
          for (let i = 0; i < 8; i++) {
            this.addMeteor();
          }
            
          // Vapor atmosférico (50 partículas)
          this.fogParticles = [];
          for (let i = 0; i < 50; i++) {
            this.fogParticles.push({
              x: Math.random() * this.game.width,
              y: Math.random() * this.game.height,
              size: Math.random() * 15 + 10,
              speed: Math.random() * 0.5 + 0.3,
              opacity: Math.random() * 0.4 + 0.2
            });
          }
        },
          
        addMeteor: function() {
          const size = Math.random() * 12 + 8;
          const speed = Math.random() * 3 + 2;
            
          let x, y, speedX, speedY;
            
          const direction = Math.floor(Math.random() * 3);
            
          if (direction === 0) { // Desde arriba
            x = Math.random() * this.game.width;
            y = -20;
            speedX = (Math.random() - 0.5) * 1.5;
            speedY = speed;
          } else if (direction === 1) { // Desde derecha
            x = this.game.width + 20;
            y = Math.random() * this.game.height / 2;
            speedX = -speed;
            speedY = (Math.random() * speed * 0.5);
          } else { // Desde izquierda
            x = -20;
            y = Math.random() * this.game.height / 2;
            speedX = speed;
            speedY = (Math.random() * speed * 0.5);
          }
            
          this.meteors.push({ x, y, speedX, speedY, size });
        },
          
        update: function(deltaTime) {
          // Actualizar meteoritos
          this.meteors.forEach((m, index) => {
            m.x += m.speedX;
            m.y += m.speedY;
              
            if (m.y > this.game.height + 50 || 
                m.x < -50 || m.x > this.game.width + 50) {
              this.meteors.splice(index, 1);
              this.addMeteor();
            }
          });
            
          // Actualizar vapor
          this.fogParticles.forEach(p => {
            p.x -= p.speed;
            p.y += Math.sin(p.x * 0.01) * 0.3;
              
            if (p.x < -50) {
              p.x = this.game.width + Math.random() * 50;
              p.y = Math.random() * this.game.height;
            }
          });
        },
          
        draw: function(ctx) {
          // Dibujar vapor
          this.fogParticles.forEach(p => {
            ctx.fillStyle = `rgba(255, 100, 80, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
              
            ctx.fillStyle = `rgba(255, 180, 100, ${p.opacity * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x - p.size/3, p.y - p.size/3, p.size/2, 0, Math.PI * 2);
            ctx.fill();
          });
            
          // Dibujar meteoritos
          this.meteors.forEach(m => {
            // Cola
            const tailLength = m.size * 3;
            const gradient = ctx.createLinearGradient(
              m.x, m.y, 
              m.x - m.speedX * tailLength, m.y - m.speedY * tailLength
            );
            gradient.addColorStop(0, 'rgba(255, 150, 50, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
              
            ctx.strokeStyle = gradient;
            ctx.lineWidth = m.size / 2;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.speedX * tailLength, m.y - m.speedY * tailLength);
            ctx.stroke();
              
            // Cuerpo
            ctx.fillStyle = '#FF5500';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size/2, 0, Math.PI * 2);
            ctx.fill();
              
            // Núcleo
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size/4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      } 
    }; 
  }
  
  setLevel(level) {
    const effectIndex = (level - 1) % Object.keys(this.effects).length;
    this.currentEffect = this.effects[effectIndex];
    
    // Vincular contexto
    this.currentEffect.game = this.game;
    
    if (this.currentEffect.init) {
      this.currentEffect.init();
    }
  }

  update(deltaTime) {
    if (this.currentEffect?.update) {
      this.currentEffect.update(deltaTime);
    }
  }

  draw() {
    if (this.currentEffect?.draw && this.game.ctx) {
      this.currentEffect.draw(this.game.ctx);
    }
  }
}