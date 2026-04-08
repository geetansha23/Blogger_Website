const API = "http://localhost:5000";

/* ───── INIT ───── */
window.addEventListener("load", () => {
  // Page curtain
  const curtain = document.getElementById("pageCurtain");
  if (curtain) {
    curtain.classList.add("opening");
    curtain.addEventListener("animationend", () => curtain.classList.remove("opening"), { once: true });
  }

  // Button label storage
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  if (loginBtn) loginBtn.dataset.label = "Sign In →";
  if (registerBtn) registerBtn.dataset.label = "Create Account →";

  // Redirect if already logged in
  if (localStorage.getItem("token")) navigateTo("index.html");

  // Draw star field on left panel
  initStarField("authStars", 55);
});

/* ───── STAR FIELD ───── */
function initStarField(canvasId, count = 55) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const resize = () => {
    canvas.width = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 800;
    drawStars(canvas, count);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });
}

function drawStars(canvas, count) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 1.1 + 0.2;
    const opacity = Math.random() * 0.5 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.fill();
  }
}

/* ───── PAGE NAVIGATION ───── */
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("javascript")) return;
  e.preventDefault();
  navigateTo(href);
});

function navigateTo(url) {
  const curtain = document.getElementById("pageCurtain");
  if (!curtain) { window.location.href = url; return; }
  curtain.classList.add("closing");
  curtain.addEventListener("animationend", () => window.location.href = url, { once: true });
}

/* ───── TOAST ───── */
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => t.className = "toast", 3200);
}

/* ───── LOADING STATE ───── */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  const span = btn.querySelector("span") || btn;
  span.textContent = loading ? "Please wait..." : (btn.dataset.label || span.textContent);
}

/* ───── REGISTER ───── */
async function register() {
  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!name || !email || !password) { showToast("Please fill in all fields", "error"); return; }
  if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }

  setLoading("registerBtn", true);
  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Account created! Redirecting...", "success");
      setTimeout(() => navigateTo("login.html"), 1500);
    } else {
      showToast(data.message || "Registration failed", "error");
    }
  } catch {
    showToast("Server error. Please try again.", "error");
  }
  setLoading("registerBtn", false);
}

/* ───── LOGIN ───── */
async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) { showToast("Please fill in all fields", "error"); return; }

  setLoading("loginBtn", true);
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name || email.split("@")[0]);
      showToast("Welcome back!", "success");
      setTimeout(() => navigateTo("index.html"), 1000);
    } else {
      showToast(data.message || "Invalid credentials", "error");
    }
  } catch {
    showToast("Server error. Please try again.", "error");
  }
  setLoading("loginBtn", false);
}
