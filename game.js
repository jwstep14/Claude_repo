const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl  = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-msg');
const startBtn     = document.getElementById('start-btn');
const canvasWrap   = document.getElementById('canvas-wrap');

const COLS = 20;
const ROWS = 20;

// ── Responsive canvas size ────────────────────────────────────
function getCanvasSize() {
  const maxW = Math.min(window.innerWidth - 16, 420);
  // snap to a multiple of COLS so cells are whole pixels
  return Math.floor(maxW / COLS) * COLS;
}

function resizeCanvas() {
  const size = getCanvasSize();
  canvas.width  = size;
  canvas.height = size;
  canvasWrap.style.width  = size + 'px';
  canvasWrap.style.height = size + 'px';
  if (typeof draw === 'function' && snake) draw();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// CELL is dynamic — always derive from canvas.width
function CELL() { return canvas.width / COLS; }

let snake, dir, nextDir, food, score, best, gameLoop, state;
best = 0;

// ── Directions ────────────────────────────────────────────────
const UP    = { x: 0,  y: -1 };
const DOWN  = { x: 0,  y:  1 };
const LEFT  = { x: -1, y:  0 };
const RIGHT = { x: 1,  y:  0 };

function opposite(a, b) { return a.x === -b.x && a.y === -b.y; }

// ── Spawn food ────────────────────────────────────────────────
function spawnFood() {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occupied.has(`${pos.x},${pos.y}`));
  food = pos;
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  const midX = Math.floor(COLS / 2);
  const midY = Math.floor(ROWS / 2);
  snake = [
    { x: midX,     y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
  dir = RIGHT;
  nextDir = RIGHT;
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
}

// ── Tick ──────────────────────────────────────────────────────
function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return endGame();
  if (snake.some(s => s.x === head.x && s.y === head.y)) return endGame();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) { best = score; bestEl.textContent = best; }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

// ── Draw ──────────────────────────────────────────────────────
function draw() {
  const cell = CELL();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      ctx.strokeRect(c * cell, r * cell, cell, cell);

  // Food
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  snake.forEach((seg, i) => {
    const ratio = 1 - i / snake.length;
    ctx.fillStyle = i === 0 ? '#4ecca3' : `rgba(78,204,163,${0.3 + ratio * 0.6})`;
    const p = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(seg.x * cell + p, seg.y * cell + p, cell - p * 2, cell - p * 2, 3);
    ctx.fill();
  });
}

// ── End / Start / Pause ───────────────────────────────────────
function endGame() {
  clearInterval(gameLoop);
  state = 'over';
  overlay.style.display = 'flex';
  overlayTitle.textContent = 'GAME OVER';
  overlayMsg.textContent = `Score: ${score}`;
  startBtn.textContent = 'PLAY AGAIN';
}

function startGame() {
  overlay.style.display = 'none';
  state = 'running';
  init();
  draw();
  clearInterval(gameLoop);
  gameLoop = setInterval(tick, 130);
}

function togglePause() {
  if (state === 'running') {
    clearInterval(gameLoop);
    state = 'paused';
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'PAUSED';
    overlayMsg.textContent = 'Tap Resume to continue';
    startBtn.textContent = 'RESUME';
  } else if (state === 'paused') {
    overlay.style.display = 'none';
    state = 'running';
    gameLoop = setInterval(tick, 130);
  }
}

// ── Keyboard ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': if (!opposite(dir, UP))    nextDir = UP;    break;
    case 'ArrowDown':  case 's': case 'S': if (!opposite(dir, DOWN))  nextDir = DOWN;  break;
    case 'ArrowLeft':  case 'a': case 'A': if (!opposite(dir, LEFT))  nextDir = LEFT;  break;
    case 'ArrowRight': case 'd': case 'D': if (!opposite(dir, RIGHT)) nextDir = RIGHT; break;
    case 'p': case 'P': if (state === 'running' || state === 'paused') togglePause(); break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});

// ── D-pad buttons ─────────────────────────────────────────────
function dpadPress(d) {
  if (state !== 'running') return;
  if (!opposite(dir, d)) nextDir = d;
}

document.getElementById('btn-up').addEventListener('touchstart',    e => { e.preventDefault(); dpadPress(UP);    }, { passive: false });
document.getElementById('btn-down').addEventListener('touchstart',  e => { e.preventDefault(); dpadPress(DOWN);  }, { passive: false });
document.getElementById('btn-left').addEventListener('touchstart',  e => { e.preventDefault(); dpadPress(LEFT);  }, { passive: false });
document.getElementById('btn-right').addEventListener('touchstart', e => { e.preventDefault(); dpadPress(RIGHT); }, { passive: false });
document.getElementById('btn-pause').addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'running' || state === 'paused') togglePause();
}, { passive: false });

// Also support mouse clicks on D-pad for desktop testing
document.getElementById('btn-up').addEventListener('click',    () => dpadPress(UP));
document.getElementById('btn-down').addEventListener('click',  () => dpadPress(DOWN));
document.getElementById('btn-left').addEventListener('click',  () => dpadPress(LEFT));
document.getElementById('btn-right').addEventListener('click', () => dpadPress(RIGHT));
document.getElementById('btn-pause').addEventListener('click', () => {
  if (state === 'running' || state === 'paused') togglePause();
});

// ── Swipe detection on canvas ─────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (state !== 'running') return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // tap, ignore
  if (Math.abs(dx) > Math.abs(dy)) {
    dpadPress(dx > 0 ? RIGHT : LEFT);
  } else {
    dpadPress(dy > 0 ? DOWN : UP);
  }
}, { passive: false });

// ── Start button ──────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  if (state === 'paused') togglePause();
  else startGame();
});

// ── Boot ──────────────────────────────────────────────────────
init();
draw();
