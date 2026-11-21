const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

// Load saved high score
let highScore = Number(localStorage.getItem('zeroG_best')) || 0;
bestEl.textContent = highScore;

// Game state
let state = 'START'; // START | PLAYING | GAMEOVER
let score = 0;
let gameSpeed = 3.2;
let distanceTicks = 0;
let spawnTimer = 0;
let isThrusting = false;
let lastTime = 0;

// Smooth, controllable physics tuning
const player = {
  x: 150,
  y: canvas.height / 2,
  radius: 13,
  vy: 0,
  gravity: 0.22,    // Gentler downward pull
  thrust: -0.42,    // Smoother upward acceleration
  maxVy: 5.8        // Caps top vertical speed so you don't rocket into walls
};

// Background stars, obstacles, and exhaust particles
const stars = Array.from({ length: 55 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 0.5,
  speed: Math.random() * 1.5 + 0.4
}));

let obstacles = [];
let particles = [];

function resetGame() {
  player.y = canvas.height / 2;
  player.vy = 0;
  obstacles = [];
  particles = [];
  score = 0;
  gameSpeed = 3.2;
  distanceTicks = 0;
  spawnTimer = 0;
  scoreEl.textContent = '0';
  state = 'PLAYING';
}

// Input handlers
function startThrust(e) {
  if (e.type === 'keydown' && e.code !== 'Space') return;
  if (e.type === 'keydown') e.preventDefault();

  if (state === 'START' || state === 'GAMEOVER') {
    resetGame();
  }
  isThrusting = true;
}

function stopThrust(e) {
  if (e.type === 'keyup' && e.code !== 'Space') return;
  isThrusting = false;
}

window.addEventListener('keydown', startThrust);
window.addEventListener('keyup', stopThrust);
canvas.addEventListener('mousedown', startThrust);
window.addEventListener('mouseup', stopThrust);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startThrust(e); }, { passive: false });
window.addEventListener('touchend', stopThrust);

function spawnObstacle() {
  const gapHeight = Math.max(130, 185 - score * 0.03); // Wider, forgiving gap
  const margin = 45;
  const gapY = margin + Math.random() * (canvas.height - gapHeight - margin * 2);

  obstacles.push({
    x: canvas.width + 30,
    width: 26,
    gapY,
    gapHeight,
    vy: score > 300 && Math.random() > 0.5 ? (Math.random() > 0.5 ? 0.9 : -0.9) : 0
  });
}

function spawnExhaust() {
  particles.push({
    x: player.x - player.radius,
    y: player.y + (Math.random() - 0.5) * 6,
    vx: -gameSpeed - Math.random() * 1.5,
    vy: (Math.random() - 0.5) * 2 + 1,
    life: 1,
    color: Math.random() > 0.4 ? '#38bdf8' : '#f97316'
  });
}

function spawnExplosion(x, y) {
  for (let i = 0; i < 32; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: i % 2 === 0 ? '#f43f5e' : '#fbbf24'
    });
  }
}

function update(dt) {
  // Animate starfield
  for (const s of stars) {
    s.x -= s.speed * (state === 'PLAYING' ? gameSpeed * 0.3 : 0.6) * dt;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= 0.035 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (state !== 'PLAYING') return;

  distanceTicks += dt;
  score = Math.floor(distanceTicks / 6);
  scoreEl.textContent = score;
  gameSpeed = Math.min(7.2, 3.2 + score * 0.0025);

  // Smooth thrust & gravity
  if (isThrusting) {
    player.vy += player.thrust * dt;
    if (Math.random() < 0.45 * dt) spawnExhaust();
  } else {
    player.vy += player.gravity * dt;
  }

  // Clamp vertical speed
  player.vy = Math.max(-player.maxVy, Math.min(player.maxVy, player.vy));
  player.y += player.vy * dt;

  // Ceiling and floor boundary collision
  if (player.y - player.radius <= 0 || player.y + player.radius >= canvas.height) {
    triggerGameOver();
    return;
  }

  // Spawn laser gates based on distance traveled
  spawnTimer += gameSpeed * dt;
  if (spawnTimer >= 360) {
    spawnObstacle();
    spawnTimer = 0;
  }

  // Update obstacles & check collision
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed * dt;

    if (obs.vy !== 0) {
      obs.gapY += obs.vy * dt;
      if (obs.gapY < 40 || obs.gapY + obs.gapHeight > canvas.height - 40) {
        obs.vy *= -1;
      }
    }

    const inXRange = player.x + player.radius > obs.x && player.x - player.radius < obs.x + obs.width;
    const hitTop = player.y - player.radius < obs.gapY;
    const hitBottom = player.y + player.radius > obs.gapY + obs.gapHeight;

    if (inXRange && (hitTop || hitBottom)) {
      triggerGameOver();
      return;
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

function triggerGameOver() {
  state = 'GAMEOVER';
  isThrusting = false;
  spawnExplosion(player.x, player.y);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('zeroG_best', highScore);
    bestEl.textContent = highScore;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#94a3b8';
  for (const s of stars) {
    ctx.globalAlpha = s.size / 2.5;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(0, 0, canvas.width, 4);
  ctx.fillRect(0, canvas.height - 4, canvas.width, 4);

  for (const obs of obstacles) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#e11d48';

    ctx.fillRect(obs.x, 0, obs.width, obs.gapY);
    ctx.fillRect(obs.x, obs.gapY + obs.gapHeight, obs.width, canvas.height - (obs.gapY + obs.gapHeight));

    ctx.fillStyle = '#fda4af';
    ctx.fillRect(obs.x + 8, 0, 10, obs.gapY);
    ctx.fillRect(obs.x + 8, obs.gapY + obs.gapHeight, 10, canvas.height - (obs.gapY + obs.gapHeight));
    ctx.shadowBlur = 0;
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5 * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (state !== 'GAMEOVER') {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.vy * 0.055);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#38bdf8';

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -11);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(3, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (state === 'START' || state === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(5, 8, 17, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = state === 'START' ? '#38bdf8' : '#f43f5e';
    ctx.font = 'bold 38px Segoe UI, sans-serif';
    ctx.fillText(
      state === 'START' ? 'ZERO-G THRUST RUNNER' : 'HULL BREACHED',
      canvas.width / 2,
      canvas.height / 2 - 20
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '18px Segoe UI, sans-serif';
    ctx.fillText(
      state === 'START'
        ? 'Tap or hold SPACE / CLICK to glide smoothly'
        : `Distance: ${score} m  •  Press SPACE or CLICK to retry`,
      canvas.width / 2,
      canvas.height / 2 + 22
    );
  }
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  // Normalize delta time to 60 FPS (16.67ms per frame)
  const dt = Math.min(2, (timestamp - lastTime) / 16.67);
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);