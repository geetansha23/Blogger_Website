const API = "http://localhost:5000";
const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName") || "User";

let allBlogs = [];
let currentCategory = "all";
let editingBlogId = null;
let currentUserId = null;
let featuredBlogId = null;

window.addEventListener("load", async () => {
  initPageTransition();
  initStarField("heroStars");
  initStarField("modalStars", 35);
  setupNavbar();
  setupFeatureSections();
  setupCreateSection();
  setupCharCounter();
  await loadBlogs();
  initScrollEffects();
  initProgressBar();
  initFilterElevation();
});

/* ───── PAGE TRANSITION ───── */
function initPageTransition() {
  const curtain = document.getElementById("pageCurtain");
  if (!curtain) return;
  curtain.classList.add("opening");
  curtain.addEventListener("animationend", () => curtain.classList.remove("opening"), { once: true });
}

function navigateTo(url) {
  const curtain = document.getElementById("pageCurtain");
  if (!curtain) { window.location.href = url; return; }
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

/* ───── STAR FIELD ───── */
function initStarField(canvasId, count = 60) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
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
    const r = Math.random() * 1.2 + 0.2;
    const opacity = Math.random() * 0.55 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.fill();
  }
}

/* ───── PROGRESS BAR ───── */
function initProgressBar() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;
  window.addEventListener("scroll", () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docH > 0 ? (window.scrollY / docH) * 100 : 0) + "%";
  }, { passive: true });
}

/* ───── SCROLL REVEAL ───── */
function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach(el => observer.observe(el));
}

/* ───── FILTER BAR ELEVATION ───── */
function initFilterElevation() {
  const bar = document.getElementById("filterBar");
  if (!bar) return;
  window.addEventListener("scroll", () => {
    bar.classList.toggle("elevated", window.scrollY > 200);
  }, { passive: true });
}

/* ───── FEATURE SECTIONS ───── */
function setupFeatureSections() {
  const sections = document.getElementById("featureSections");
  if (sections && token) sections.style.display = "none";
}

/* ───── NAVBAR ───── */
function setupNavbar() {
  const authNav = document.getElementById("authNav");
  const heroCta = document.getElementById("heroCta");

  window.addEventListener("scroll", () => {
    const nb = document.getElementById("navbar");
    if (nb) nb.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });

  if (!authNav) return;

  if (token) {
    const initial = userName.charAt(0).toUpperCase();
    authNav.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar" onclick="toggleDropdown()" title="${escapeHtml(userName)}">
          ${initial}
          <div class="nav-dropdown" id="navDropdown">
            <a href="#" style="pointer-events:none;opacity:0.45;font-size:0.78rem;cursor:default">${escapeHtml(userName)}</a>
            <a href="#" onclick="logout(); return false;" class="danger">Sign Out</a>
          </div>
        </div>
      </div>`;
    if (heroCta) heroCta.innerHTML = `
      <button class="btn-primary" onclick="document.getElementById('createSection').scrollIntoView({behavior:'smooth'})"><span>Write a Story</span></button>
      <button class="btn-outline" onclick="document.querySelector('.main-content').scrollIntoView({behavior:'smooth'})">Read Stories</button>`;
  } else {
    authNav.innerHTML = `
      <a href="login.html">Sign In</a>
      <a href="register.html" style="background:var(--ink);color:#fff;padding:9px 20px;border-radius:8px;font-size:0.83rem;font-weight:500;text-decoration:none;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Get Started</a>`;
    if (heroCta) heroCta.innerHTML = `
      <a href="register.html" class="btn-primary"><span>Start Writing Free</span></a>
      <button class="btn-outline" onclick="document.querySelector('.main-content').scrollIntoView({behavior:'smooth'})">Explore Stories</button>`;
  }
}

function toggleDropdown() { document.getElementById("navDropdown")?.classList.toggle("open"); }
document.addEventListener("click", (e) => { if (!e.target.closest(".nav-avatar")) document.getElementById("navDropdown")?.classList.remove("open"); });
function logout() { localStorage.removeItem("token"); localStorage.removeItem("userName"); window.location.reload(); }

function showSearch() {
  document.getElementById("searchBar").classList.add("open");
  setTimeout(() => document.getElementById("searchInput").focus(), 50);
}
function hideSearch() {
  document.getElementById("searchBar").classList.remove("open");
  document.getElementById("searchInput").value = "";
  renderBlogs(filterBlogs(allBlogs));
}
function searchBlogs() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  if (!q) { renderBlogs(filterBlogs(allBlogs)); return; }
  renderBlogs(allBlogs.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.content.toLowerCase().includes(q) ||
    (b.author?.name || "").toLowerCase().includes(q)
  ));
}

/* ───── CATEGORY FILTER ───── */
function filterByCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderBlogs(filterBlogs(allBlogs));
}
function filterBlogs(blogs) {
  return currentCategory === "all" ? blogs : blogs.filter(b => b.category === currentCategory);
}

/* ───── CREATE SECTION ───── */
function setupCreateSection() {
  const cs = document.getElementById("createSection");
  if (cs && token) cs.style.display = "block";
}
function setupCharCounter() {
  const content = document.getElementById("blogContent");
  const counter = document.getElementById("charCount");
  if (content && counter) content.addEventListener("input", () => { counter.textContent = `${content.value.length} characters`; });
}

/* ───── CATEGORY → SCENE CLASS ───── */
function sceneClass(category) {
  const map = {
    "Technology": "scene-tech",
    "Travel": "scene-travel",
    "Culture": "scene-culture",
    "Health": "scene-health",
    "Business": "scene-business",
    "Lifestyle": "scene-lifestyle",
    "Food": "scene-lifestyle",
    "Other": "scene-other",
  };
  return map[category] || "scene-default";
}

const cardImages = {
  "Technology": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=75",
  "Travel":     "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=75",
  "Culture":    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&auto=format&fit=crop&q=75",
  "Health":     "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=75",
  "Business":   "https://images.unsplash.com/photo-1444653389962-8149286c578a?w=600&auto=format&fit=crop&q=75",
  "Lifestyle":  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=75",
  "Food":       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=75",
  "Other":      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=75",
};
const defaultCardImage = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=75";

/* ───── LOAD & RENDER ───── */
async function loadBlogs() {
  try {
    const res = await fetch(`${API}/api/blogs`);
    allBlogs = await res.json();
    if (token) {
      try { const payload = JSON.parse(atob(token.split(".")[1])); currentUserId = payload.id; } catch {}
    }
    updateFeaturedPanel();
    renderBlogs(filterBlogs(allBlogs));
  } catch {
    const g = document.getElementById("blogsGrid");
    if (g) g.innerHTML = `<div class="loading"><p>Failed to load. Is the server running?</p></div>`;
  }
}

function updateFeaturedPanel() {
  if (!allBlogs.length) return;
  const featured = allBlogs[0];
  featuredBlogId = featured._id;
  const author = featured.author?.name || "Anonymous";
  const readTime = Math.max(1, Math.ceil(featured.content.split(" ").length / 200));

  const titleEl = document.getElementById("featuredTitle");
  const avEl = document.getElementById("featuredAv");
  const authorEl = document.getElementById("featuredAuthor");
  const timeEl = document.getElementById("featuredTime");

  if (titleEl) titleEl.textContent = featured.title;
  if (avEl) avEl.textContent = author.charAt(0).toUpperCase();
  if (authorEl) authorEl.textContent = author;
  if (timeEl) timeEl.textContent = `· ${readTime} min read`;
}

function openFeatured() {
  if (featuredBlogId) openBlog(featuredBlogId);
}

function renderBlogs(blogs) {
  const grid = document.getElementById("blogsGrid");
  const noBlogs = document.getElementById("noBlogs");
  const count = document.getElementById("sectionCount");

  if (count) count.textContent = blogs.length ? `${blogs.length} stor${blogs.length !== 1 ? "ies" : "y"}` : "";
  if (!blogs.length) { grid.innerHTML = ""; if (noBlogs) noBlogs.style.display = "block"; return; }
  if (noBlogs) noBlogs.style.display = "none";

  grid.innerHTML = blogs.map((blog, i) => {
    const author = blog.author?.name || "Anonymous";
    const initial = author.charAt(0).toUpperCase();
    const date = new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const isOwner = currentUserId && blog.author?._id === currentUserId;
    const likes = blog.likes || 0;
    const readTime = Math.max(1, Math.ceil(blog.content.split(" ").length / 200));
    const scene = sceneClass(blog.category);
    const mountainsSvg = scene === "scene-travel" ? `
      <svg class="mountains" width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
        <polygon points="0,60 60,18 120,38 190,5 260,28 330,12 400,32 400,60" fill="rgba(255,255,255,0.055)"/>
        <polygon points="0,60 40,32 100,46 160,22 230,40 300,20 370,36 400,50 400,60" fill="rgba(255,255,255,0.035)"/>
      </svg>` : "";

    return `
      <article class="blog-card reveal reveal-delay-${(i % 5) + 1}" onclick="openBlog('${blog._id}')">
        <div class="card-scene ${scene}">
          <div class="card-scene-bg" style="background-image:url('${cardImages[blog.category] || defaultCardImage}');background-size:cover;background-position:center;"></div>
          ${mountainsSvg}
          <div class="card-scene-label">${blog.category || "Story"}</div>
        </div>
        <div class="card-header">
          ${blog.category ? `<span class="card-category">${escapeHtml(blog.category)}</span>` : ""}
          <h3 class="card-title">${escapeHtml(blog.title)}</h3>
          <p class="card-excerpt">${escapeHtml(blog.content)}</p>
        </div>
        <div class="card-footer">
          <div class="card-author">
            <div class="author-avatar">${initial}</div>
            <div class="author-info">
              <div class="name">${escapeHtml(author)}</div>
              <div class="date">${date} &middot; ${readTime} min read</div>
            </div>
          </div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="like-btn" onclick="likeBlog('${blog._id}', this)">&#9829; ${likes}</button>
            ${isOwner ? `
              <button class="edit-btn" onclick="openEditModal('${blog._id}')" title="Edit">&#9998;&#65039;</button>
              <button class="delete-btn" onclick="deleteBlog('${blog._id}')" title="Delete">&#128465;&#65039;</button>` : ""}
          </div>
        </div>
      </article>`;
  }).join("");

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
  document.querySelectorAll(".blog-card.reveal:not(.visible)").forEach(el => obs.observe(el));
}

/* ───── OPEN BLOG MODAL ───── */
const categoryImages = {
  "Technology": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
  "Travel":     "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=80",
  "Culture":    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=900&auto=format&fit=crop&q=80",
  "Health":     "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&auto=format&fit=crop&q=80",
  "Business":   "https://images.unsplash.com/photo-1444653389962-8149286c578a?w=900&auto=format&fit=crop&q=80",
  "Lifestyle":  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=80",
  "Food":       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=80",
  "Other":      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&auto=format&fit=crop&q=80",
};
const defaultModalImage = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&auto=format&fit=crop&q=80";

function openBlog(id) {
  const blog = allBlogs.find(b => b._id === id);
  if (!blog) return;
  const author = blog.author?.name || "Anonymous";
  const date = new Date(blog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const readTime = Math.max(1, Math.ceil(blog.content.split(" ").length / 200));

  // Set modal image dynamically based on category
  const modalImgBg = document.querySelector(".modal-img-bg");
  if (modalImgBg) {
    const imgUrl = categoryImages[blog.category] || defaultModalImage;
    modalImgBg.style.backgroundImage = `url('${imgUrl}')`;
    modalImgBg.style.backgroundSize = "cover";
    modalImgBg.style.backgroundPosition = "center";
  }

  // Update modal image tag
  const tagText = document.getElementById("modalImgTagText");
  if (tagText) tagText.textContent = `${blog.category || "Story"} · ${readTime} min read`;

  document.getElementById("modalBody").innerHTML = `
    ${blog.category ? `<div class="modal-category">${escapeHtml(blog.category)}</div>` : ""}
    <h2 class="modal-title">${escapeHtml(blog.title)}</h2>
    <div class="modal-meta">
      <div class="author-avatar">${author.charAt(0).toUpperCase()}</div>
      <div class="author-info">
        <div class="name">${escapeHtml(author)}</div>
        <div class="date">${date} &middot; ${readTime} min read</div>
      </div>
      <div class="modal-divider"></div>
      <div class="modal-readtime">${readTime} min read</div>
    </div>
    <div class="modal-body">${escapeHtml(blog.content)}</div>
    <div class="modal-actions">
      <div class="act-like">&#9829; Like</div>
      <div class="act-share">&#8599; Share</div>
      <div class="act-bookmark">&#10010; Save</div>
    </div>`;

  // Re-draw star field for modal
  setTimeout(() => initStarField("modalStars", 35), 50);

  document.getElementById("blogModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(e) { if (e.target === e.currentTarget) closeBlogModal(); }
function closeBlogModal() { document.getElementById("blogModal").classList.remove("open"); document.body.style.overflow = ""; }

/* ───── CREATE BLOG ───── */
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

/* ───── LIKE ───── */
function likeBlog(id, btn) {
  if (!token) { showToast("Sign in to like stories", "error"); return; }
  btn.classList.toggle("liked");
  const count = parseInt(btn.textContent.replace("♥ ", "")) || 0;
  btn.textContent = `♥ ${btn.classList.contains("liked") ? count + 1 : Math.max(0, count - 1)}`;
}

/* ───── EDIT MODAL ───── */
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

/* ───── DELETE ───── */
async function deleteBlog(id) {
  if (!confirm("Delete this story? This cannot be undone.")) return;
  try {
    const res = await fetch(`${API}/api/blogs/${id}`, { method: "DELETE", headers: { "Authorization": "Bearer " + token } });
    if (res.ok) { showToast("Story deleted", ""); await loadBlogs(); }
    else showToast("Failed to delete", "error");
  } catch { showToast("Server error", "error"); }
}

/* ───── HELPERS ───── */
function toggleMenu() { document.getElementById("navLinks").classList.toggle("open"); }
function escapeHtml(str) { const d = document.createElement("div"); d.appendChild(document.createTextNode(str || "")); return d.innerHTML; }
function showToast(msg, type = "") { const t = document.getElementById("toast"); t.textContent = msg; t.className = "toast show " + type; setTimeout(() => t.className = "toast", 3200); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeBlogModal(); closeEditModal(); } });
