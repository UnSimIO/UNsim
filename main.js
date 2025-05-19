const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const betInput = document.getElementById("bet-amount");
const dropXInput = document.getElementById("drop-x");
const dropBtn = document.getElementById("drop-btn");
const resultSpan = document.getElementById("result");

// Game constants
const GRAVITY = 0.32;
const BALL_RADIUS = 16;
const OBSTACLES = [
  { x: 200, y: 250, w: 120, h: 24 },
  { x: 350, y: 550, w: 120, h: 24 }
];
const GOAL_LINE = 760;

let ball = null;
let gameActive = false;

function startGame() {
  const dropX = parseInt(dropXInput.value);
  ball = {
    x: dropX,
    y: BALL_RADIUS + 5,
    vx: 0,
    vy: 0,
    color: getRandomColor()
  };
  gameActive = true;
  resultSpan.textContent = "Ball dropped! Good luck!";
  animate();
}

function animate() {
  if (!gameActive) return;
  update();
  draw();
  if (ball && ball.y + BALL_RADIUS < GOAL_LINE) {
    requestAnimationFrame(animate);
  } else if (ball) {
    // Ball reached the bottom
    gameActive = false;
    resultSpan.textContent = `Ball reached the goal! Winnings: ${parseInt(betInput.value) * 2}`;
  }
}

function update() {
  if (!ball) return;
  // Physics
  ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Collision with canvas sides
  if (ball.x < BALL_RADIUS) {
    ball.x = BALL_RADIUS;
    ball.vx *= -0.7;
  } else if (ball.x > canvas.width - BALL_RADIUS) {
    ball.x = canvas.width - BALL_RADIUS;
    ball.vx *= -0.7;
  }

  // Collision with obstacles
  for (const ob of OBSTACLES) {
    if (
      ball.y + BALL_RADIUS > ob.y &&
      ball.y - BALL_RADIUS < ob.y + ob.h &&
      ball.x + BALL_RADIUS > ob.x &&
      ball.x - BALL_RADIUS < ob.x + ob.w &&
      ball.vy > 0
    ) {
      // Simple bounce
      ball.y = ob.y - BALL_RADIUS;
      ball.vy *= -0.65;
      // Add a little horizontal randomness
      ball.vx += (Math.random() - 0.5) * 6;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw goal line
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GOAL_LINE);
  ctx.lineTo(canvas.width, GOAL_LINE);
  ctx.stroke();

  // Draw obstacles
  ctx.fillStyle = "#888";
  for (const ob of OBSTACLES) {
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // Draw ball
  if (ball) {
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Helpers
function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`;
}

// UI events
dropBtn.onclick = () => {
  if (gameActive) {
    resultSpan.textContent = "Game in progress!";
    return;
  }
  startGame();
};

// Initial draw
draw();
