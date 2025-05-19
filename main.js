// --- Elements ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const mainMenu = document.getElementById("main-menu");
const loginMenu = document.getElementById("login-menu");
const registerMenu = document.getElementById("register-menu");
const gameUI = document.getElementById("game-ui");

const menuLoginBtn = document.getElementById("menu-login-btn");
const menuRegisterBtn = document.getElementById("menu-register-btn");
const toRegisterBtn = document.getElementById("to-register-btn");
const toLoginBtn = document.getElementById("to-login-btn");
const backToMain1 = document.getElementById("back-to-main-1");
const backToMain2 = document.getElementById("back-to-main-2");
const backToMain3 = document.getElementById("back-to-main-3");

const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const registerUsername = document.getElementById("register-username");
const registerPassword = document.getElementById("register-password");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

const greeting = document.getElementById("greeting");
const betInput = document.getElementById("bet-amount");
const dropXInput = document.getElementById("drop-x");
const dropBtn = document.getElementById("drop-btn");
const resultSpan = document.getElementById("result");

// --- State ---
let currentUser = null;
const USER_KEY = "ballbet_users";
const SESSION_KEY = "ballbet_session";

// --- UI Navigation ---
function showMenu() {
  hideAll();
  mainMenu.style.display = "";
}
function showLogin() {
  hideAll();
  loginMenu.style.display = "";
  loginUsername.value = "";
  loginPassword.value = "";
  loginError.textContent = "";
}
function showRegister() {
  hideAll();
  registerMenu.style.display = "";
  registerUsername.value = "";
  registerPassword.value = "";
  registerError.textContent = "";
}
function showGameUI() {
  hideAll();
  gameUI.style.display = "";
  greeting.textContent = `Hi, ${currentUser}!`;
  resultSpan.textContent = "";
  draw();
}
function hideAll() {
  mainMenu.style.display = "none";
  loginMenu.style.display = "none";
  registerMenu.style.display = "none";
  gameUI.style.display = "none";
}

// --- User Auth (Local Demo) ---
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

function saveSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getSessionUser() {
  return localStorage.getItem(SESSION_KEY) || null;
}

// --- Event Listeners (Navigation) ---
menuLoginBtn.onclick = showLogin;
menuRegisterBtn.onclick = showRegister;
toRegisterBtn.onclick = showRegister;
toLoginBtn.onclick = showLogin;
backToMain1.onclick = showMenu;
backToMain2.onclick = showMenu;
backToMain3.onclick = () => {
  ball = null;
  gameActive = false;
  showMenu();
};
logoutBtn.onclick = () => {
  currentUser = null;
  clearSession();
  showMenu();
};

// --- Register ---
registerBtn.onclick = () => {
  let username = registerUsername.value.trim();
  let password = registerPassword.value;
  if (username.length < 3) {
    registerError.textContent = "Username must be at least 3 characters.";
    return;
  }
  if (password.length < 4) {
    registerError.textContent = "Password must be at least 4 characters.";
    return;
  }
  let users = loadUsers();
  if (users[username]) {
    registerError.textContent = "Username already exists.";
    return;
  }
  users[username] = { password: password };
  saveUsers(users);
  registerError.textContent = "Registration successful! Please login.";
  setTimeout(showLogin, 1200);
};

// --- Login ---
loginBtn.onclick = () => {
  let username = loginUsername.value.trim();
  let password = loginPassword.value;
  let users = loadUsers();
  if (!users[username] || users[username].password !== password) {
    loginError.textContent = "Invalid username or password.";
    return;
  }
  currentUser = username;
  saveSession(username);
  showGameUI();
};

// --- Auto-login if session exists ---
window.onload = () => {
  currentUser = getSessionUser();
  if (currentUser) {
    showGameUI();
  } else {
    showMenu();
  }
};

// --- Game Logic ---
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
  resultSpan.textContent = `Ball dropped! Good luck, ${currentUser || "Player"}!`;
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
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Goal line
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GOAL_LINE);
  ctx.lineTo(canvas.width, GOAL_LINE);
  ctx.stroke();

  // Obstacles
  ctx.fillStyle = "#888";
  for (const ob of OBSTACLES) {
    ctx.save();
    ctx.shadowColor = "#222";
    ctx.shadowBlur = 10;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.restore();
  }

  // Ball
  if (ball) {
    ctx.save();
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// --- Game UI Events ---
dropBtn.onclick = () => {
  if (gameActive) {
    resultSpan.textContent = "Game in progress!";
    return;
  }
  startGame();
};

draw();
