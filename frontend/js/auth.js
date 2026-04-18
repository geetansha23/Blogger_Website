const API = window.location.origin;

window.addEventListener("load", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (loginBtn) loginBtn.dataset.label = loginBtn.textContent.trim();
  if (registerBtn) registerBtn.dataset.label = registerBtn.textContent.trim();

  if (localStorage.getItem("token")) {
    window.location.href = "index.html";
  }
});

function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`.trim();

  setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

function setLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.disabled = loading;
  button.style.opacity = loading ? "0.75" : "1";
  button.textContent = loading ? "Please wait..." : button.dataset.label || button.textContent;
}

async function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  setLoading("registerBtn", true);

  try {
    const response = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.name || name);
      }

      showToast("Account created successfully", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 900);
    } else {
      showToast(data.message || "Registration failed", "error");
    }
  } catch (error) {
    showToast("Server error. Please try again.", "error");
  } finally {
    setLoading("registerBtn", false);
  }
}

async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  setLoading("loginBtn", true);

  try {
    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name || email.split("@")[0]);

      showToast("Login successful", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } else {
      showToast(data.message || "Invalid credentials", "error");
    }
  } catch (error) {
    showToast("Server error. Please try again.", "error");
  } finally {
    setLoading("loginBtn", false);
  }
}