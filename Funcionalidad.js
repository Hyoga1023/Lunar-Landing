let gameInstance;
// Mecánica de juego para Módulo Lunar (Versión para móviles)
class LunarLander {
  constructor(options = {}) {
    // Configuración del juego
    this.canvas = options.canvas || document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Hacer el canvas responsivo
    this.setupResponsiveCanvas();
    
    // Dimensiones iniciales
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Gravedad (valores bajos para simular la Luna, se incrementará con cada nivel)
    this.gravity = options.initialGravity || 0.007;
    this.initialGravity = this.gravity;

    this.planetColors = [
      '#777', // Gris (Luna)
      '#C1440E', // Rojo (Marte)
      '#E6BE8A', // Beige (Venus)
      '#8B4513', // Marrón (Titán)
      '#ADD8E6', // Azul claro (Europa)
      '#9ACD32', // Verde amarillento (Planeta alienígena)
      '#FFD700', // Dorado (Io)
      '#800080', // Púrpura (Planeta fantasía)
      '#FF6347'  // Rojo coral (Planeta lava)
    ];
    
    // Color actual del terreno basado en el nivel
    this.currentTerrainColor = this.planetColors[0];

    this.planetNames = [
      'Luna', 
      'Marte', 
      'Venus', 
      'Titán', 
      'Europa', 
      'Kepler-22b', 
      'Io', 
      'Nexus-6', 
      'Mustafar'
    ];
    
    // Factor de escala para adaptarse a diferentes tamaños de pantalla
    this.scaleFactor = 1;
    
    // Configuración del módulo lunar
    this.lander = {
      x: this.width / 2,
      y: 50,
      width: 40,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      thrust: 0.12,
      fuel: 1000,
      fuelConsumption: 0.9,
      rotation: 0, // En radianes
      thrusting: false,
      thrustingLeft: false,
      thrustingRight: false,
      rotationSpeed: 0.05
    };
      // Justo después de inicializar this.lander en el constructor
  this.landerImage = new Image();
  this.landerImage.src = 'img/Modulo_lunar.png';
  this.landerImage.onload = () => {
  console.log('Imagen del módulo lunar cargada correctamente');
  }; 
    // Configuración del terreno
    this.terrain = [];
    this.landingPads = [];
    this.generateTerrain();
    
    // Estado del juego
    this.gameState = 'playing'; // 'playing', 'landed', 'crashed'
    this.score = 0;
    this.level = 1;
    
    // Controles táctiles (botones virtuales)
    this.touchControls = {
      up: { x: this.width - 120, y: this.height - 160, radius: 40, pressed: false },
      left: { x: 80, y: this.height - 80, radius: 40, pressed: false },
      right: { x: 200, y: this.height - 80, radius: 40, pressed: false }
    };
    
    // Configurar eventos de entrada (teclado y táctil)
    this.setupControls();
    
    // Comenzar el bucle del juego
    this.lastTime = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
  }
  
  // Hacer el canvas responsivo
  setupResponsiveCanvas() {
      const updateCanvasSize = () => {
        // Para ocupar todo el alto disponible en móviles
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        
        // Usar toda la pantalla disponible
        let newWidth = maxWidth;
        let newHeight = maxHeight;
        
        // Aplicar el nuevo tamaño
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // Actualizar dimensiones internas
        this.width = newWidth;
        this.height = newHeight;
        
        // Actualizar posición de controles táctiles
        if (this.touchControls) {
          this.touchControls.up = { x: this.width - 120, y: this.height - 160, radius: 40, pressed: false };
          this.touchControls.left = { x: 80, y: this.height - 80, radius: 40, pressed: false };
          this.touchControls.right = { x: 200, y: this.height - 80, radius: 40, pressed: false };
        }
      };
      
      // Aplicar tamaño inicial
      updateCanvasSize();
    }
  
  // Manejar cambios de tamaño de ventana
  handleResize() {
    // Guardar posición relativa del módulo
    const relX = this.lander.x / this.width;
    const relY = this.lander.y / this.height;
    
    // Actualizar tamaño del canvas
    this.setupResponsiveCanvas();
    
    // Reposicionar el módulo
    this.lander.x = relX * this.width;
    this.lander.y = relY * this.height;
    
    // Recalcular el terreno
    this.generateTerrain();
    
    // Recalcular factor de escala para mantener la física consistente
    this.scaleFactor = this.width / 800; // Relativo a un ancho base de 800px
  }
  
  // Configurar controles de teclado y táctil
  setupControls() {
    // Controles de teclado (para PC/portátiles)
    window.addEventListener('keydown', (e) => {
      if (this.gameState !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowUp':
          this.lander.thrusting = true;
          break;
        case 'ArrowLeft':
          this.lander.thrustingLeft = true;
          break;
        case 'ArrowRight':
          this.lander.thrustingRight = true;
          break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          this.lander.thrusting = false;
          break;
        case 'ArrowLeft':
          this.lander.thrustingLeft = false;
          break;
        case 'ArrowRight':
          this.lander.thrustingRight = false;
          break;
        case 'r':
          if (this.gameState !== 'playing') {
            this.reset();
          }
          break;
      }
    });
    
    // Controles táctiles (para móviles)
    // Detectar inicio de toque
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevenir scroll
      
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - this.canvas.offsetLeft;
        const y = touch.clientY - this.canvas.offsetTop;
        
        // Verificar si el toque está en algún botón virtual
        if (this.isPointInCircle(x, y, this.touchControls.up)) {
          this.touchControls.up.pressed = true;
          this.lander.thrusting = true;
        }
        if (this.isPointInCircle(x, y, this.touchControls.left)) {
          this.touchControls.left.pressed = true;
          this.lander.thrustingLeft = true;
        }
        if (this.isPointInCircle(x, y, this.touchControls.right)) {
          this.touchControls.right.pressed = true;
          this.lander.thrustingRight = true;
        }
        
        // Si el juego no está en modo "playing", reiniciar en cualquier toque
        if (this.gameState !== 'playing') {
          this.reset();
        }
      }
    });
    
    // Detectar movimiento de toque (para controles deslizantes)
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevenir scroll
      
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - this.canvas.offsetLeft;
        const y = touch.clientY - this.canvas.offsetTop;
        
        // Verificar si el toque entró o salió de botones
        this.touchControls.up.pressed = this.isPointInCircle(x, y, this.touchControls.up);
        this.lander.thrusting = this.touchControls.up.pressed;
        
        this.touchControls.left.pressed = this.isPointInCircle(x, y, this.touchControls.left);
        this.lander.thrustingLeft = this.touchControls.left.pressed;
        
        this.touchControls.right.pressed = this.isPointInCircle(x, y, this.touchControls.right);
        this.lander.thrustingRight = this.touchControls.right.pressed;
      }
    });
    
    // Detectar fin de toque
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevenir scroll
      
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - this.canvas.offsetLeft;
        const y = touch.clientY - this.canvas.offsetTop;
        
        // Verificar qué botones deben desactivarse
        if (this.touchControls.up.pressed && this.isPointInCircle(x, y, this.touchControls.up)) {
          this.touchControls.up.pressed = false;
          this.lander.thrusting = false;
        }
        if (this.touchControls.left.pressed && this.isPointInCircle(x, y, this.touchControls.left)) {
          this.touchControls.left.pressed = false;
          this.lander.thrustingLeft = false;
        }
        if (this.touchControls.right.pressed && this.isPointInCircle(x, y, this.touchControls.right)) {
          this.touchControls.right.pressed = false;
          this.lander.thrustingRight = false;
        }
      }
    });
    
    // Cancela todos los toques cuando salen del canvas
    this.canvas.addEventListener('touchcancel', () => {
      this.touchControls.up.pressed = false;
      this.touchControls.left.pressed = false;
      this.touchControls.right.pressed = false;
      this.lander.thrusting = false;
      this.lander.thrustingLeft = false;
      this.lander.thrustingRight = false;
    });
  }
  
  // Verificar si un punto está dentro de un círculo (para controles táctiles)
  isPointInCircle(x, y, circle) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
  }
  
  // Generar terreno aleatorio con plataformas de aterrizaje
  generateTerrain() {
    this.terrain = [];
    this.landingPads = [];
    
    const segments = 25;
    const segmentWidth = this.width / segments;
    
    // Definir la altura base del terreno (cerca del fondo)
    const baseHeight = this.height - 50;
    
    // Generar puntos de control para el terreno con más valles que montañas
    const noisePoints = [];
    for (let i = 0; i <= segments; i++) {
      // Valores más altos = terreno más irregular
      const roughness = 0.8;
      // Generar valor aleatorio, pero hacerlo negativo con mayor probabilidad
      // para favorecer valles (valores negativos) sobre montañas (valores positivos)
      let noiseValue = Math.random() * roughness;
      if (Math.random() < 0.7) { // 70% de probabilidad de que sea valle
        noiseValue = -noiseValue;
      }
      noisePoints.push(noiseValue);
    }
    
    // Suavizar los puntos (promedio simple)
    const smoothedPoints = [];
    for (let i = 0; i <= segments; i++) {
      let val = noisePoints[i];
      if (i > 0) val += noisePoints[i - 1];
      if (i < segments) val += noisePoints[i + 1];
      val /= (i > 0 && i < segments) ? 3 : 2;
      smoothedPoints.push(val);
    }
    
    // Número de plataformas de aterrizaje (más difícil con niveles más altos)
    const numLandingPads = Math.max(3 - Math.floor(this.level / 3), 1);
    const landingPadSegments = [];
    
    // Identificar los valles para colocar plataformas
    const valleys = [];
    for (let i = 1; i < segments - 1; i++) {
      // Un valle es un punto que es más bajo que sus vecinos
      if (smoothedPoints[i] < smoothedPoints[i-1] && smoothedPoints[i] < smoothedPoints[i+1]) {
        valleys.push(i);
      }
    }
    
    // Si no hay suficientes valles, crear algunos
    while (valleys.length < numLandingPads) {
      // Elegir un punto aleatorio que no sea un borde
      const randomPoint = Math.floor(Math.random() * (segments - 2)) + 1;
      if (!valleys.includes(randomPoint)) {
        valleys.push(randomPoint);
      }
    }
    
    // Seleccionar segmentos para plataformas de aterrizaje (en valles)
    for (let i = 0; i < numLandingPads; i++) {
      let valleyIndex;
      if (valleys.length > 0) {
        // Elegir un valle aleatorio
        const randomValleyIndex = Math.floor(Math.random() * valleys.length);
        valleyIndex = valleys[randomValleyIndex];
        // Eliminar este valle para no elegirlo de nuevo
        valleys.splice(randomValleyIndex, 1);
      } else {
        // Fallback si no hay suficientes valles
        do {
          valleyIndex = Math.floor(Math.random() * (segments - 4)) + 2;
        } while (landingPadSegments.includes(valleyIndex));
      }
      
      landingPadSegments.push(valleyIndex);
    }
    
    // Generar puntos del terreno
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      
      // Verificar si este punto debe ser parte de una plataforma de aterrizaje
      const isLandingPad = landingPadSegments.some(padStart => 
        i >= padStart && i <= padStart + 2);
      
      let y;
      if (isLandingPad) {
        // Las plataformas de aterrizaje son planas y más bajas (en los valles)
        y = baseHeight - 20 - (Math.random() * 60);
        
        // Registrar la plataforma de aterrizaje (solo para el primer punto)
        if (landingPadSegments.includes(i)) {
          this.landingPads.push({
            x: x,
            y: y,
            width: segmentWidth * 2
          });
        }
      } else {
        // Terreno variable, ajustado para tener más valles
        // Multiplicamos por 120 en lugar de 150 para reducir la variación total
        y = baseHeight - (smoothedPoints[i] * 120);
      }
      
      this.terrain.push({ x, y });
    }
  }
  
  // Actualizar estado del juego
  update(deltaTime) {
    if (this.gameState !== 'playing') return;
    
    // Aplicar gravedad (ajustada por factor de escala)
    this.lander.velocityY += this.gravity * this.scaleFactor;
    
    // Aplicar empuje si hay combustible
    if (this.lander.fuel > 0) {
      if (this.lander.thrusting) {
        this.lander.velocityY -= this.lander.thrust * this.scaleFactor;
        this.lander.fuel -= this.lander.fuelConsumption;
      }
      
      if (this.lander.thrustingLeft) {
        this.lander.rotation -= this.lander.rotationSpeed; // Usar la nueva propiedad
        this.lander.fuel -= this.lander.fuelConsumption * 0.4; // Reducido de 0.5 a 0.4
      }
      
      if (this.lander.thrustingRight) {
        this.lander.rotation += this.lander.rotationSpeed; // Usar la nueva propiedad
        this.lander.fuel -= this.lander.fuelConsumption * 0.4; // Reducido de 0.5 a 0.4
      }
    }
    
  // Componentes de velocidad basados en rotación con mejor respuesta
  const thrustX = Math.sin(this.lander.rotation) * this.lander.thrust * this.scaleFactor * 1.2; // Multiplicado por 1.2 para mejor respuesta lateral
  if (this.lander.thrusting && this.lander.fuel > 0) {
    this.lander.velocityX += thrustX;
  }
  
  // Añadir una pequeña resistencia para facilitar el control
  this.lander.velocityX *= 0.99;
  
  // Limitar la velocidad máxima para evitar comportamientos extraños
  const maxVelocity = 3 * this.scaleFactor; 
  this.lander.velocityX = Math.max(Math.min(this.lander.velocityX, maxVelocity), -maxVelocity);
  this.lander.velocityY = Math.max(Math.min(this.lander.velocityY, maxVelocity), -maxVelocity);
    
    // Actualizar posición
    this.lander.x += this.lander.velocityX;
    this.lander.y += this.lander.velocityY;
    
    // Comprobar colisiones con los bordes
    if (this.lander.x < 0) {
      this.lander.x = 0;
      this.lander.velocityX *= -0.5; // Rebote
    } else if (this.lander.x > this.width - this.lander.width) {
      this.lander.x = this.width - this.lander.width;
      this.lander.velocityX *= -0.5; // Rebote
    }
    
    // Comprobar colisión con el terreno
    this.checkTerrainCollision();
  }
  
  // Comprobar colisión con el terreno
  // Modificación de la función checkTerrainCollision
checkTerrainCollision() {
const landerBottom = this.lander.y + this.lander.height;
const landerCenterX = this.lander.x + this.lander.width / 2;
const landerLeft = this.lander.x;
const landerRight = this.lander.x + this.lander.width;

// Primero verificar si está sobre una plataforma de aterrizaje
let onLandingPad = false;
let landingPadY = 0;

for (const pad of this.landingPads) {
  // Verificar si el centro del módulo está sobre la plataforma
  if (landerCenterX >= pad.x && landerCenterX <= pad.x + pad.width) {
    onLandingPad = true;
    landingPadY = pad.y;
    
    // Si el módulo ha tocado la plataforma
    if (landerBottom >= landingPadY) {
      // Comprobar condiciones de aterrizaje seguro
      const isLevelEnough = Math.abs(this.lander.rotation) < 0.25; // Aprox. 15 grados
      const isSlow = Math.abs(this.lander.velocityY) < 1.5 * this.scaleFactor && 
                     Math.abs(this.lander.velocityX) < 1 * this.scaleFactor;
      
      if (isLevelEnough && isSlow) {
        // Aterrizaje exitoso
        this.lander.y = landingPadY - this.lander.height;
        this.lander.velocityX = 0;
        this.lander.velocityY = 0;
        this.gameState = 'landed';
        
        // Aumentar puntuación basada en combustible restante y nivel
        const fuelBonus = Math.floor(this.lander.fuel / 10);
        this.score += 1000 + fuelBonus + (this.level * 500);
        
        // Preparar para el siguiente nivel con mayor gravedad
        this.level++;
        this.gravity = this.initialGravity + (this.level * 0.007);
        
        console.log(`¡Aterrizaje exitoso! Puntuación: ${this.score}, Nivel: ${this.level}`);
      } else {
        // Colisión - módulo estrellado en plataforma pero con mal ángulo o velocidad
        this.gameState = 'crashed';
        console.log('Módulo estrellado en plataforma: velocidad o ángulo incorrecto');
      }
      
      return; // Terminar la verificación aquí
    }
  }
}

// Si no está sobre una plataforma o no ha tocado la plataforma aún,
// verificar colisión con el terreno irregular
for (let i = 0; i < this.terrain.length - 1; i++) {
  const t1 = this.terrain[i];
  const t2 = this.terrain[i + 1];
  
  // Verificar si alguna parte del módulo está sobre este segmento de terreno
  if (landerRight >= t1.x && landerLeft <= t2.x) {
    // Calcular el punto exacto de intersección con el terreno
    // Para cada punto de la base del módulo
    const checkPoints = [
      landerLeft + this.lander.width * 0.2,  // 20% desde la izquierda
      landerCenterX,                         // Centro
      landerLeft + this.lander.width * 0.8   // 80% desde la izquierda
    ];
    
    for (const pointX of checkPoints) {
      // Si el punto está dentro de este segmento de terreno
      if (pointX >= t1.x && pointX <= t2.x) {
        // Interpolar la altura del terreno en esta posición x
        const terrainRatio = (pointX - t1.x) / (t2.x - t1.x);
        const terrainHeight = t1.y + terrainRatio * (t2.y - t1.y);
        
        // Verificar si el módulo ha tocado el terreno en este punto
        if (landerBottom >= terrainHeight) {
          // Colisión con terreno irregular = módulo estrellado
          this.gameState = 'crashed';
          console.log('Módulo estrellado en terreno irregular');
          return;
        }
      }
    }
  }
}
}
  
  // Dibujar el juego
  draw() {
    // Limpiar el canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Dibujar fondo (espacio)
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Dibujar estrellas
    this.ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      const x = (i * 7919) % this.width; // Números primos para distribución pseudoaleatoria
      const y = (i * 6997) % this.height;
      const size = ((i * 769) % 3) + 1;
      this.ctx.fillRect(x, y, size, size);
    }
    
    // Dibujar terreno
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    this.ctx.lineTo(this.terrain[0].x, this.terrain[0].y);
    
    for (let i = 1; i < this.terrain.length; i++) {
      this.ctx.lineTo(this.terrain[i].x, this.terrain[i].y);
    }
    
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    
    // Color del terreno (gris para la luna)
    this.ctx.fillStyle = this.currentTerrainColor;
    this.ctx.fill();
    
    // Dibujar plataformas de aterrizaje
    this.ctx.fillStyle = '#55ff55';
    for (const pad of this.landingPads) {
      this.ctx.fillRect(pad.x, pad.y - 3, pad.width, 3);
    }
    
    // Dibujar el módulo lunar
    this.ctx.save();
    
    // Transformar para dibujar el módulo con rotación
    this.ctx.translate(this.lander.x + this.lander.width / 2, this.lander.y + this.lander.height / 2);
    this.ctx.rotate(this.lander.rotation);
    
          // Dibujar la imagen del módulo lunar
      if (this.landerImage.complete) {
          this.ctx.drawImage(
          this.landerImage, 
          -this.lander.width / 2, 
          -this.lander.height / 2, 
          this.lander.width, 
          this.lander.height
          );
      } else {
          // Fallback si la imagen no está cargada
          this.ctx.fillStyle = '#DDD';
          this.ctx.fillRect(-this.lander.width / 2, -this.lander.height / 2, this.lander.width, this.lander.height);
      }
    
    // Dibujar fuego de propulsión si se está propulsando
    if (this.lander.thrusting && this.lander.fuel > 0) {
      // Fuego principal
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.lander.height / 2);
      
      // Animación de llama aleatoria
      const flameHeight = 20 + Math.random() * 10;
      const flameWidth = 8 + Math.random() * 4;
      
      this.ctx.lineTo(-flameWidth, this.lander.height / 2 + flameHeight / 2);
      this.ctx.lineTo(0, this.lander.height / 2 + flameHeight);
      this.ctx.lineTo(flameWidth, this.lander.height / 2 + flameHeight / 2);
      this.ctx.closePath();
      
      // Gradiente para el fuego
      const gradient = this.ctx.createLinearGradient(
        0, this.lander.height / 2,
        0, this.lander.height / 2 + flameHeight
      );
      gradient.addColorStop(0, 'yellow');
      gradient.addColorStop(0.5, 'orange');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    // Dibujar fuego de propulsión lateral
    if (this.lander.thrustingLeft && this.lander.fuel > 0) {
      // Fuego propulsor derecho (para moverse a la izquierda)
      this.ctx.beginPath();
      this.ctx.moveTo(this.lander.width / 2, 0);
      
      const flameHeight = 10 + Math.random() * 5;
      this.ctx.lineTo(this.lander.width / 2 + flameHeight, -5);
      this.ctx.lineTo(this.lander.width / 2 + flameHeight, 5);
      this.ctx.closePath();
      
      this.ctx.fillStyle = 'orange';
      this.ctx.fill();
    }
    
    if (this.lander.thrustingRight && this.lander.fuel > 0) {
      // Fuego propulsor izquierdo (para moverse a la derecha)
      this.ctx.beginPath();
      this.ctx.moveTo(-this.lander.width / 2, 0);
      
      const flameHeight = 10 + Math.random() * 5;
      this.ctx.lineTo(-this.lander.width / 2 - flameHeight, -5);
      this.ctx.lineTo(-this.lander.width / 2 - flameHeight, 5);
      this.ctx.closePath();
      
      this.ctx.fillStyle = 'orange';
      this.ctx.fill();
    }
    
    this.ctx.restore();
    
    // Dibujar botones de control táctil
    this.drawTouchControls();
    
    // Interfaz del juego
    this.drawUI();
    
    // Mostrar mensaje según el estado del juego
    if (this.gameState === 'landed') {
      this.showMessage('¡ATERRIZAJE EXITOSO!', 'Toca la pantalla para el siguiente nivel - Si estas en un computador presiona R para continuar');
    } else if (this.gameState === 'crashed') {
      this.showMessage('MÓDULO ESTRELLADO', 'Toca la pantalla para reintentar- Si estas en un computador presiona R para continuar');
    }
  }
  
  // Dibujar botones de control táctil
  drawTouchControls() {
    // Solo mostrar en dispositivos táctiles
    if (!('ontouchstart' in window)) return;
    
    // Dibujar botón de propulsión principal (arriba)
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = this.touchControls.up.pressed ? '#ff5500' : '#555';
    this.ctx.beginPath();
    this.ctx.arc(this.touchControls.up.x, this.touchControls.up.y, 
                this.touchControls.up.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Dibujar flecha arriba
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.moveTo(this.touchControls.up.x, this.touchControls.up.y - 15);
    this.ctx.lineTo(this.touchControls.up.x - 10, this.touchControls.up.y + 5);
    this.ctx.lineTo(this.touchControls.up.x + 10, this.touchControls.up.y + 5);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Dibujar botón izquierda
    this.ctx.fillStyle = this.touchControls.left.pressed ? '#ff5500' : '#555';
    this.ctx.beginPath();
    this.ctx.arc(this.touchControls.left.x, this.touchControls.left.y, 
                this.touchControls.left.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Dibujar flecha izquierda
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.moveTo(this.touchControls.left.x - 15, this.touchControls.left.y);
    this.ctx.lineTo(this.touchControls.left.x + 5, this.touchControls.left.y - 10);
    this.ctx.lineTo(this.touchControls.left.x + 5, this.touchControls.left.y + 10);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Dibujar botón derecha
    this.ctx.fillStyle = this.touchControls.right.pressed ? '#ff5500' : '#555';
    this.ctx.beginPath();
    this.ctx.arc(this.touchControls.right.x, this.touchControls.right.y, 
                this.touchControls.right.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
        // Dibujar flecha derecha
  this.ctx.fillStyle = 'white';
  this.ctx.beginPath();
  this.ctx.moveTo(this.touchControls.right.x + 15, this.touchControls.right.y);
  this.ctx.lineTo(this.touchControls.right.x - 5, this.touchControls.right.y - 10);
  this.ctx.lineTo(this.touchControls.right.x - 5, this.touchControls.right.y + 10);
  this.ctx.closePath();
  this.ctx.fill();
  
  this.ctx.globalAlpha = 1.0;
}

// Dibujar interfaz de usuario (combustible, puntuación, etc.)
drawUI() {
  // Dibujar barra de combustible
  const fuelBarWidth = 200;
  const fuelBarHeight = 20;
  const fuelBarX = 20;
  const fuelBarY = 20;
  
  // Fondo de la barra
  this.ctx.fillStyle = '#333';
  this.ctx.fillRect(fuelBarX, fuelBarY, fuelBarWidth, fuelBarHeight);
  
  // Barra de combustible (verde a rojo según se agota)
  const fuelPercent = this.lander.fuel / 1000;
  const fuelWidth = fuelBarWidth * fuelPercent;
  
  const gradient = this.ctx.createLinearGradient(fuelBarX, fuelBarY, fuelBarX + fuelBarWidth, fuelBarY);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#ffff00');
  gradient.addColorStop(1, '#00ff00');
  
  this.ctx.fillStyle = gradient;
  this.ctx.fillRect(fuelBarX, fuelBarY, fuelWidth, fuelBarHeight);
  
  // Borde de la barra
  this.ctx.strokeStyle = '#fff';
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(fuelBarX, fuelBarY, fuelBarWidth, fuelBarHeight);
  
  // Texto de combustible
  this.ctx.fillStyle = 'white';
  this.ctx.font = '16px Arial';
  this.ctx.fillText(`Combustible: ${Math.floor(this.lander.fuel)}`, fuelBarX, fuelBarY - 5);
  
  // Mostrar puntuación y nivel
  this.ctx.fillStyle = 'white';
  this.ctx.font = '16px Arial';
  this.ctx.textAlign = 'right';
  this.ctx.fillText(`Puntuación: ${this.score}`, this.width - 20, 30);
  this.ctx.fillText(`Nivel: ${this.level}`, this.width - 20, 60);
  this.ctx.fillText(`Planeta: ${this.planetNames[(this.level - 1) % this.planetNames.length]}`, this.width - 20, 90);
  
  // Mostrar velocidad y altitud
  this.ctx.textAlign = 'left';
  this.ctx.fillText(`Velocidad X: ${this.lander.velocityX.toFixed(1)}`, 20, this.height - 40);
  this.ctx.fillText(`Velocidad Y: ${this.lander.velocityY.toFixed(1)}`, 20, this.height - 20);
  
  // Mostrar ángulo de rotación
  const angleDeg = (this.lander.rotation * 180 / Math.PI).toFixed(1);
  this.ctx.fillText(`Ángulo: ${angleDeg}°`, this.width / 2, this.height - 20);
}

// Mostrar mensaje en pantalla
showMessage(title, subtitle) {
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 80, 400, 160);
  
  this.ctx.strokeStyle = 'white';
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(this.width / 2 - 200, this.height / 2 - 80, 400, 160);
  
  this.ctx.fillStyle = 'white';
  this.ctx.font = '24px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText(title, this.width / 2, this.height / 2 - 30);
  
  this.ctx.font = '16px Arial';
  this.ctx.fillText(subtitle, this.width / 2, this.height / 2 + 20);
}

// Reiniciar el juego
reset() {
  // Reposicionar el módulo
  this.lander.x = this.width / 2;
  this.lander.y = 50;
  this.lander.velocityX = 0;
  this.lander.velocityY = 0;
  this.lander.rotation = 0;
  this.lander.fuel = 1000;
  
  // Si estaba estrellado, mantener el nivel actual
  if (this.gameState === 'landed') {
    // Si aterrizó con éxito, ya se incrementó el nivel
  } else {
    // Si se estrelló, mantener el nivel actual pero resetear la gravedad
    this.gravity = this.initialGravity + (this.level * 0.007);
  }
  
  // Regenerar terreno para el nuevo nivel
  this.generateTerrain();
  
  // Actualizar el color del terreno según el nivel (ciclo a través de los colores)
this.currentTerrainColor = this.planetColors[(this.level - 1) % this.planetColors.length];

  // Volver al estado de juego
  this.gameState = 'playing';
}

// Bucle principal del juego
animate(timestamp) {
  // Calcular deltaTime para una física consistente en diferentes FPS
  const deltaTime = timestamp - this.lastTime;
  this.lastTime = timestamp;
  
  // Actualizar y dibujar el juego
  this.update(deltaTime);
  this.draw();
  
  // Continuar el bucle
  requestAnimationFrame(this.animate);
}
}
// Inicialización del juego Lunar Lander con efectos planetarios
window.addEventListener('load', () => {
  const game = new LunarLander({
    canvas: document.getElementById('gameCanvas'),
    initialGravity: 0.007
  });

  // Inicialización retardada de efectos
  setTimeout(() => {
    if (typeof PlanetaryEffects !== 'undefined') {
      try {
        const planetaryEffects = new PlanetaryEffects(game);
        
        // Guardar métodos originales
        const originalDraw = game.draw.bind(game);
        const originalUpdate = game.update.bind(game);
        const originalReset = game.reset.bind(game);
        
        // Extender métodos
        game.draw = function() {
          originalDraw();
          planetaryEffects.draw();
        };
        
        game.update = function(deltaTime) {
          originalUpdate(deltaTime);
          planetaryEffects.update(deltaTime);
        };
        
        game.reset = function() {
          originalReset();
          planetaryEffects.setLevel(game.level);
        };
        
        // Iniciar con nivel 1
        planetaryEffects.setLevel(1);
        
      } catch (error) {
        console.error('Error en efectos:', error);
      }
    }
  }, 100); // Pequeño retardo para asegurar inicialización
});