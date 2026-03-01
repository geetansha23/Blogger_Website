const API = "http://localhost:5000";
const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName") || "User";

let allBlogs = [];
let currentCategory = "all";
let editingBlogId = null;
let currentUserId = null;

window.onload = async () => {
  initPageTransition();
  setupNavbar();
  setupFeatureSections();
  setupCreateSection();
  setupCharCounter();
  await loadBlogs();
  initScrollEffects();
  initParallax();
  initProgressBar();
  initFilterElevation();
};

// PAGE TRANSITION
function initPageTransition() {
  const curtain = document.getElementById("pageCurtain");
  curtain.classList.add("opening");
  curtain.addEventListener("animationend", () => curtain.classList.remove("opening"), { once: true });
}

function navigateTo(url) {
  const curtain = document.getElementById("pageCurtain");
  curtain.classList.add("closing");
  curtain.addEventListener("animationend", () => window.location.href = url, { once: true });
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("javascript")) return;
  e.preventDefault();
  navigateTo(href);
});

// PROGRESS BAR
function initProgressBar() {
  const bar = document.getElementById("progressBar");
  window.addEventListener("scroll", () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + "%";
  }, { passive: true });
}

// PARALLAX
function initParallax() {
  const bg = document.getElementById("parallaxBg");
  const hero = document.getElementById("hero");
  if (!bg || !hero) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY < hero.offsetHeight)
      bg.style.transform = `translateY(${window.scrollY * 0.35}px)`;
  }, { passive: true });
}

// SCROLL REVEAL
function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach(el => observer.observe(el));
}

// FILTER ELEVATION
function initFilterElevation() {
  const filterBar = document.getElementById("filterBar");
  if (!filterBar) return;
  window.addEventListener("scroll", () => {
    filterBar.classList.toggle("elevated", window.scrollY > 200);
  }, { passive: true });
}

// FEATURE SECTIONS — hide for logged in users
function setupFeatureSections() {
  const sections = document.getElementById("featureSections");
  if (!sections) return;
  if (token) sections.style.display = "none";
}

// NAVBAR
function setupNavbar() {
  const authNav = document.getElementById("authNav");
  const heroCta = document.getElementById("heroCta");
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });

  if (token) {
    const initial = userName.charAt(0).toUpperCase();
    authNav.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar" onclick="toggleDropdown()" title="${userName}">
          ${initial}
          <div class="nav-dropdown" id="navDropdown">
            <a href="#" style="pointer-events:none;opacity:0.45;font-size:0.78rem;cursor:default">${userName}</a>
            <a href="#" onclick="logout(); return false;" class="danger">Sign Out</a>
          </div>
        </div>
      </div>`;
    heroCta.innerHTML = `
      <button class="btn-primary" onclick="document.getElementById('createSection').scrollIntoView({behavior:'smooth'})"><span>Write a Story</span></button>
      <button class="btn-outline" onclick="document.querySelector('.main-content').scrollIntoView({behavior:'smooth'})">Read Stories</button>`;
  } else {
    authNav.innerHTML = `
      <a href="login.html">Sign In</a>
      <a href="register.html" style="background:var(--ink);color:white;padding:10px 22px;border-radius:8px;font-size:0.85rem;text-decoration:none;font-weight:600;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Get Started</a>`;
    heroCta.innerHTML = `
      <a href="register.html" class="btn-primary"><span>Start Writing Free</span></a>
      <button class="btn-outline" onclick="document.querySelector('.main-content').scrollIntoView({behavior:'smooth'})">Explore Stories</button>`;
  }
}

function toggleDropdown() { document.getElementById("navDropdown")?.classList.toggle("open"); }
document.addEventListener("click", (e) => { if (!e.target.closest(".nav-avatar")) document.getElementById("navDropdown")?.classList.remove("open"); });
function logout() { localStorage.removeItem("token"); localStorage.removeItem("userName"); window.location.reload(); }

function showSearch() { document.getElementById("searchBar").classList.add("open"); setTimeout(() => document.getElementById("searchInput").focus(), 50); }
function hideSearch() { document.getElementById("searchBar").classList.remove("open"); document.getElementById("searchInput").value = ""; renderBlogs(filterBlogs(allBlogs)); }
function searchBlogs() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  if (!q) { renderBlogs(filterBlogs(allBlogs)); return; }
  renderBlogs(allBlogs.filter(b => b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q) || (b.author?.name || "").toLowerCase().includes(q)));
}

function filterByCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderBlogs(filterBlogs(allBlogs));
}
function filterBlogs(blogs) { return currentCategory === "all" ? blogs : blogs.filter(b => b.category === currentCategory); }

function setupCreateSection() { if (token) document.getElementById("createSection").style.display = "block"; }
function setupCharCounter() {
  const content = document.getElementById("blogContent");
  const counter = document.getElementById("charCount");
  if (content && counter) content.addEventListener("input", () => { counter.textContent = `${content.value.length} characters`; });
}

async function loadBlogs() {
  try {
    const res = await fetch(`${API}/api/blogs`);
    allBlogs = await res.json();
    if (token) {
      try { const payload = JSON.parse(atob(token.split(".")[1])); currentUserId = payload.id; } catch {}
    }
    renderBlogs(filterBlogs(allBlogs));
  } catch {
    document.getElementById("blogsGrid").innerHTML = `<div class="loading"><p>Failed to load. Is the server running?</p></div>`;
  }
}

function renderBlogs(blogs) {
  const grid = document.getElementById("blogsGrid");
  const noBlogs = document.getElementById("noBlogs");
  const count = document.getElementById("sectionCount");
  if (count) count.textContent = blogs.length ? `${blogs.length} stor${blogs.length !== 1 ? "ies" : "y"}` : "";
  if (!blogs.length) { grid.innerHTML = ""; noBlogs.style.display = "block"; return; }
  noBlogs.style.display = "none";
  grid.innerHTML = blogs.map((blog, i) => {
    const author = blog.author?.name || "Anonymous";
    const initial = author.charAt(0).toUpperCase();
    const date = new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const isOwner = currentUserId && blog.author?._id === currentUserId;
    const likes = blog.likes || 0;
    const readTime = Math.max(1, Math.ceil(blog.content.split(" ").length / 200));
    return `
      <article class="blog-card reveal reveal-delay-${(i % 5) + 1}" onclick="openBlog('${blog._id}')">
        <div class="card-header">
          ${blog.category ? `<span class="card-category">${blog.category}</span>` : ""}
          <h3 class="card-title">${escapeHtml(blog.title)}</h3>
          <p class="card-excerpt">${escapeHtml(blog.content)}</p>
        </div>
        <div class="card-footer">
          <div class="card-author">
            <div class="author-avatar">${initial}</div>
            <div class="author-info">
              <div class="name">${escapeHtml(author)}</div>
              <div class="date">${date} · ${readTime} min read</div>
            </div>
          </div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="like-btn" onclick="likeBlog('${blog._id}', this)">♥ ${likes}</button>
            ${isOwner ? `
              <button class="edit-btn" onclick="openEditModal('${blog._id}')" title="Edit">✏️</button>
              <button class="delete-btn" onclick="deleteBlog('${blog._id}')" title="Delete">🗑️</button>` : ""}
          </div>
        </div>
      </article>`;
  }).join("");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  document.querySelectorAll(".blog-card.reveal:not(.visible)").forEach(el => obs.observe(el));
}

function openBlog(id) {
  const blog = allBlogs.find(b => b._id === id);
  if (!blog) return;
  const author = blog.author?.name || "Anonymous";
  const date = new Date(blog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const readTime = Math.max(1, Math.ceil(blog.content.split(" ").length / 200));
  document.getElementById("modalBody").innerHTML = `
    ${blog.category ? `<div class="modal-category">${blog.category}</div>` : ""}
    <h2 class="modal-title">${escapeHtml(blog.title)}</h2>
    <div class="modal-meta">
      <div class="author-avatar">${author.charAt(0).toUpperCase()}</div>
      <div class="author-info"><div class="name">${escapeHtml(author)}</div><div class="date">${date} · ${readTime} min read</div></div>
    </div>
    <div class="modal-body">${escapeHtml(blog.content)}</div>`;
  document.getElementById("blogModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(e) { if (e.target === e.currentTarget) closeBlogModal(); }
function closeBlogModal() { document.getElementById("blogModal").classList.remove("open"); document.body.style.overflow = ""; }

async function createBlog() {
  const title = document.getElementById("blogTitle").value.trim();
  const content = document.getElementById("blogContent").value.trim();
  const category = document.getElementById("blogCategory").value;
  if (!title || !content) { showToast("Please add a title and content", "error"); return; }
  try {
    const res = await fetch(`${API}/api/blogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ title, content, category })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("blogTitle").value = "";
      document.getElementById("blogContent").value = "";
      document.getElementById("blogCategory").value = "";
      document.getElementById("charCount").textContent = "0 characters";
      showToast("Story published!", "success");
      await loadBlogs();
    } else showToast(data.message || "Failed to publish", "error");
  } catch { showToast("Server error", "error"); }
}

function likeBlog(id, btn) {
  if (!token) { showToast("Sign in to like stories", "error"); return; }
  btn.classList.toggle("liked");
  const count = parseInt(btn.textContent.replace("♥ ", "")) || 0;
  btn.textContent = `♥ ${btn.classList.contains("liked") ? count + 1 : count - 1}`;
}

function openEditModal(id) {
  const blog = allBlogs.find(b => b._id === id);
  if (!blog) return;
  editingBlogId = id;
  document.getElementById("editTitle").value = blog.title;
  document.getElementById("editContent").value = blog.content;
  document.getElementById("editCategory").value = blog.category || "";
  document.getElementById("editModal").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeEditModal() { document.getElementById("editModal").classList.remove("open"); document.body.style.overflow = ""; editingBlogId = null; }
function closeEditModalOverlay(e) { if (e.target === e.currentTarget) closeEditModal(); }

async function submitEdit() {
  const title = document.getElementById("editTitle").value.trim();
  const content = document.getElementById("editContent").value.trim();
  const category = document.getElementById("editCategory").value;
  if (!title || !content) { showToast("Title and content required", "error"); return; }
  try {
    const res = await fetch(`${API}/api/blogs/${editingBlogId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ title, content, category })
    });
    if (res.ok) { showToast("Story updated!", "success"); closeEditModal(); await loadBlogs(); }
    else { const data = await res.json(); showToast(data.message || "Failed to update", "error"); }
  } catch { showToast("Server error", "error"); }
}

async function deleteBlog(id) {
  if (!confirm("Delete this story? This cannot be undone.")) return;
  try {
    const res = await fetch(`${API}/api/blogs/${id}`, { method: "DELETE", headers: { "Authorization": "Bearer " + token } });
    if (res.ok) { showToast("Story deleted", ""); await loadBlogs(); }
    else showToast("Failed to delete", "error");
  } catch { showToast("Server error", "error"); }
}

function toggleMenu() { document.getElementById("navLinks").classList.toggle("open"); }
function escapeHtml(str) { const d = document.createElement("div"); d.appendChild(document.createTextNode(str || "")); return d.innerHTML; }
function showToast(msg, type = "") { const t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show " + type; setTimeout(() => t.className = "toast", 3200); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeBlogModal(); closeEditModal(); } });