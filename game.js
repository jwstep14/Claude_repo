const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('start-btn');

const COLS = 20;
const ROWS = 20;
const CELL = canvas.width / COLS;

let snake, dir, nextDir, food, score, best, gameLoop, state;

best = 0;

// ── Directions ───────────────────────────────────────────────
const UP    = { x: 0,  y: -1 };
const DOWN  = { x: 0,  y:  1 };
const LEFT  = { x: -1, y:  0 };
const RIGHT = { x: 1,  y:  0 };

function opposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

// ── Spawn food at a random empty cell ────────────────────────
function spawnFood() {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occupied.has(`${pos.x},${pos.y}`));
  food = pos;
}

// ── Initialise / restart ─────────────────────────────────────
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

// ── Game tick ─────────────────────────────────────────────────
function tick() {
  dir = nextDir;

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame();
  }

  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
    }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

// ── Drawing ───────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
    }
  }

  // Food
  ctx.fillStyle = '#e94560';
  const padding = 3;
  ctx.beginPath();
  ctx.arc(
    food.x * CELL + CELL / 2,
    food.y * CELL + CELL / 2,
    CELL / 2 - padding,
    0, Math.PI * 2
  );
  ctx.fill();

  // Snake body
  snake.forEach((seg, i) => {
    const ratio = 1 - i / snake.length;
    ctx.fillStyle = i === 0
      ? '#4ecca3'
      : `rgba(78, 204, 163, ${0.3 + ratio * 0.6})`;
    const p = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(seg.x * CELL + p, seg.y * CELL + p, CELL - p * 2, CELL - p * 2, 3);
    ctx.fill();
  });
}

// ── End game ──────────────────────────────────────────────────
function endGame() {
  clearInterval(gameLoop);
  state = 'over';
  overlay.style.display = 'flex';
  overlayTitle.textContent = 'GAME OVER';
  overlayMsg.textContent = `Score: ${score}`;
  startBtn.textContent = 'PLAY AGAIN';
}

// ── Start / restart ───────────────────────────────────────────
function startGame() {
  overlay.style.display = 'none';
  state = 'running';
  init();
  draw();
  clearInterval(gameLoop);
  gameLoop = setInterval(tick, 130);
}

// ── Pause ─────────────────────────────────────────────────────
function togglePause() {
  if (state === 'running') {
    clearInterval(gameLoop);
    state = 'paused';
    overlay.style.display = 'flex';
    overlayTitle.textContent = 'PAUSED';
    overlayMsg.textContent = 'Press P to resume';
    startBtn.textContent = 'RESUME';
  } else if (state === 'paused') {
    overlay.style.display = 'none';
    state = 'running';
    gameLoop = setInterval(tick, 130);
  }
}

// ── Input ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W':
      if (!opposite(dir, UP))    nextDir = UP;    break;
    case 'ArrowDown':  case 's': case 'S':
      if (!opposite(dir, DOWN))  nextDir = DOWN;  break;
    case 'ArrowLeft':  case 'a': case 'A':
      if (!opposite(dir, LEFT))  nextDir = LEFT;  break;
    case 'ArrowRight': case 'd': case 'D':
      if (!opposite(dir, RIGHT)) nextDir = RIGHT; break;
    case 'p': case 'P':
      if (state === 'running' || state === 'paused') togglePause(); break;
  }

  // Prevent page scroll on arrow keys
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

startBtn.addEventListener('click', () => {
  if (state === 'paused') togglePause();
  else startGame();
});

// ── Initial draw ──────────────────────────────────────────────
init();
draw();
