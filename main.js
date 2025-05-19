const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const betInput = document.getElementById("bet-amount");
const dropXInput = document.getElementById("drop-x");
const dropBtn = document.getElementById("drop-btn");
const resultSpan = document.getElementById("result");
const startGameBtn = document.getElementById("start-game-btn");
const mainMenu = document.getElementById("main-menu");
const ui = document.getElementById("ui");
const backBtn = document.getElementById("back-btn");
const loginMenu = document.getElementById("login-menu");
const usernameInput = document.getElementById("username-input");
const loginBtn = document.getElementById("login-btn");

let username = null;

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

function showLogin() {
  loginMenu.style.display = "";
  mainMenu.style.display = "none";
  ui.style.display = "none";
  canvas.style.display = "none";
}

function showMenu() {
  loginMenu.style.display = "none";
  mainMenu.style.display = "";
  ui.style.display = "none";
  canvas.style.display = "none";
  resultSpan.textContent = "";
  draw(); // To clear the canvas
}

function showGameUI() {
  mainMenu.style.display = "none";
  ui.style.display = "";
  canvas.style.display = "";
  resultSpan.textContent = "";
  draw();
}

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
  resultSpan.textContent = `Ball dropped! Good luck, ${username || "Player"}!`;
  animate();
}

function animate() {
  if (!gameActive) return;
  update();
  draw();
  if (ball && ball.y + BALL_RADIUS < GOAL_LINE) {
    requestAnimationFrame(animate);
  } else if (ball) {
    gameActive = false;
    resultSpan.textContent = `Ball reached the goal! Winnings: ${parseInt(betInput.value) * 2}`;
  }
}

function update() {
  if (!ball) return;
  ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < BALL_RADIUS) {
    ball.x = BALL_RADIUS;
    ball.vx *= -0.7;
  } else if (ball.x > canvas.width - BALL_RADIUS) {
    ball.x = canvas.width - BALL_RADIUS;
    ball.vx *= -0.7;
  }

  for (const ob of OBSTACLES) {
    if (
      ball.y + BALL_RADIUS > ob.y &&
      ball.y - BALL_RADIUS < ob.y + ob.h &&
      ball.x + BALL_RADIUS > ob.x &&
      ball.x - BALL_RADIUS < ob.x + ob.w &&
      ball.vy > 0
    ) {
      ball.y = ob.y - BALL_RADIUS;
      ball.vy *= -0.65;
      ball.vx += (Math.random() - 0.5) * 6;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GOAL_LINE);
  ctx.lineTo(canvas.width, GOAL_LINE);
  ctx.stroke();

  ctx.fillStyle = "#888";
  for (const ob of OBSTACLES) {
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

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

function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`;
}

dropBtn.onclick = () => {
  if (gameActive) {
    resultSpan.textContent = "Game in progress!";
    return;
  }
  startGame();
};

backBtn.onclick = showMenu;

startGameBtn.onclick = () => {
  showGameUI();
  ball = null;
  gameActive = false;
  draw();
};

loginBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (username.length < 3) {
    alert("Username must be at least 3 characters.");
    return;
  }
  localStorage.setItem("ballbet_username", username);
  showMenu();
};

window.onload = () => {
  username = localStorage.getItem("ballbet_username");
  if (username) {
    showMenu();
  } else {
    showLogin();
  }
};

// Start with login or menu
draw();
