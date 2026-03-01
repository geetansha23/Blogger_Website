const API = "http://localhost:5000";

window.addEventListener("load", () => {
  const curtain = document.getElementById("pageCurtain");
  if (!curtain) return;
  curtain.classList.add("opening");
  curtain.addEventListener("animationend", () => curtain.classList.remove("opening"), { once: true });
});

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

function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => t.className = "toast", 3200);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  const span = btn.querySelector("span") || btn;
  span.textContent = loading ? "Please wait..." : btn.dataset.label;
}

window.onload = () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  if (loginBtn) loginBtn.dataset.label = "Sign In";
  if (registerBtn) registerBtn.dataset.label = "Create Account";
  if (localStorage.getItem("token")) navigateTo("index.html");
};

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
    if (res.ok) { showToast("Account created! Redirecting...", "success"); setTimeout(() => navigateTo("login.html"), 1500); }
    else { showToast(data.message || "Registration failed", "error"); }
  } catch { showToast("Server error. Please try again.", "error"); }
  setLoading("registerBtn", false);
}

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
    } else { showToast(data.message || "Invalid credentials", "error"); }
  } catch { showToast("Server error. Please try again.", "error"); }
  setLoading("loginBtn", false);
}