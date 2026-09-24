const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const lengthElement = document.querySelector('#length');
const maxLengthElement = document.querySelector('#max-length');
const statusElement = document.querySelector('#status');
const messageElement = document.querySelector('#message');
const pauseButton = document.querySelector('#pause-button');
const restartButton = document.querySelector('#restart-button');

const gridSize = 24;
const cellSize = canvas.width / gridSize;
const maxLength = 60;
const tickRate = 115;
const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 }
};

let snake;
let food;
let direction;
let queuedDirection;
let score;
let gameState;
let gameTimer;

function resetGame() {
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 }
  ];
  food = createFood();
  direction = null;
  queuedDirection = null;
  score = 0;
  gameState = 'ready';
  clearInterval(gameTimer);
  gameTimer = null;
  updateHud();
  showMessage('Your move', 'Press an arrow key to begin');
  draw();
}

function createFood() {
  const openCells = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!snake?.some(segment => segment.x === x && segment.y === y)) {
        openCells.push({ x, y });
      }
    }
  }
  return openCells[Math.floor(Math.random() * openCells.length)];
}

function startGame() {
  if (gameState === 'ready') {
    gameState = 'playing';
    gameTimer = setInterval(step, tickRate);
    updateHud();
    hideMessage();
  }
}

function step() {
  if (gameState !== 'playing') return;
  if (queuedDirection) {
    direction = queuedDirection;
    queuedDirection = null;
  }

  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
  const hitWall = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
  const willEat = nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = willEat ? snake : snake.slice(0, -1);
  const hitBody = bodyToCheck.some(segment => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitBody) {
    endGame('dead', 'Run ended', hitWall ? 'The wall caught you.' : 'You crossed your own path.');
    return;
  }

  snake.unshift(nextHead);
  if (willEat) {
    score += 10;
    if (snake.length >= maxLength) {
      endGame('won', 'Garden complete', 'You reached the maximum length.');
      return;
    }
    food = createFood();
  } else {
    snake.pop();
  }

  updateHud();
  draw();
}

function endGame(state, title, subtitle) {
  gameState = state;
  clearInterval(gameTimer);
  gameTimer = null;
  updateHud();
  showMessage(title, subtitle);
  draw();
}

function setDirection(nextDirection) {
  if (gameState === 'dead' || gameState === 'won') return;
  const isReverse = direction && nextDirection.x === -direction.x && nextDirection.y === -direction.y;
  if (isReverse) return;
  queuedDirection = nextDirection;
  startGame();
}

function updateHud() {
  scoreElement.textContent = score;
  lengthElement.textContent = snake.length;
  maxLengthElement.textContent = maxLength;
  const labels = { ready: 'Ready', playing: 'Playing', paused: 'Paused', dead: 'Game over', won: 'You won' };
  statusElement.textContent = labels[gameState];
  statusElement.dataset.state = gameState;
  pauseButton.textContent = gameState === 'paused' ? 'Resume' : 'Pause';
  pauseButton.disabled = gameState === 'ready' || gameState === 'dead' || gameState === 'won';
}

function showMessage(kicker, title) {
  messageElement.innerHTML = `<span class="message-kicker">${kicker}</span><strong>${title}</strong>`;
  messageElement.classList.remove('hidden');
}

function hideMessage() {
  messageElement.classList.add('hidden');
}

function draw() {
  context.fillStyle = '#173d34';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  snake.slice().reverse().forEach((segment, index) => drawSnakeSegment(segment, index === snake.length - 1));
}

function drawGrid() {
  context.strokeStyle = 'rgba(200, 225, 187, 0.08)';
  context.lineWidth = 1;
  for (let line = 1; line < gridSize; line += 1) {
    const position = line * cellSize;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawSnakeSegment(segment, isTail) {
  const padding = 2;
  const x = segment.x * cellSize + padding;
  const y = segment.y * cellSize + padding;
  context.fillStyle = isTail ? '#9ec84f' : '#d9f36a';
  context.fillRect(x, y, cellSize - padding * 2, cellSize - padding * 2);
  if (segment === snake[0]) {
    context.fillStyle = '#173d34';
    context.beginPath();
    context.arc(x + cellSize * 0.36, y + cellSize * 0.35, 2, 0, Math.PI * 2);
    context.arc(x + cellSize * 0.64, y + cellSize * 0.35, 2, 0, Math.PI * 2);
    context.fill();
  }
}

function drawFood() {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;
  context.fillStyle = '#f47d68';
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.31, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#ffd1a8';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX + 1, centerY - 6);
  context.quadraticCurveTo(centerX + 4, centerY - 12, centerX + 9, centerY - 10);
  context.stroke();
}

window.addEventListener('keydown', event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (directions[key]) {
    event.preventDefault();
    setDirection(directions[key]);
  }
  if (event.key === ' ' && gameState !== 'ready' && gameState !== 'dead' && gameState !== 'won') {
    event.preventDefault();
    togglePause();
  }
});

pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', resetGame);

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    clearInterval(gameTimer);
    gameTimer = null;
    showMessage('Paused', 'Press Pause or Space to continue');
  } else if (gameState === 'paused') {
    gameState = 'playing';
    gameTimer = setInterval(step, tickRate);
    hideMessage();
  }
  updateHud();
}

resetGame();
