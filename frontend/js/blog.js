const API = window.location.origin;
const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName") || "User";

let allBlogs = [];
let currentCategory = "all";
let currentUserId = null;
let featuredBlogId = null;
let editingBlogId = null;

const categoryImages = {
  Technology: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  Lifestyle: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
  Travel: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
  Health: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
  Business: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop",
  Culture: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
  Other: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop"
};

window.addEventListener("load", async () => {
  setupNavbar();
  setupCreateSection();
  setupCharCounter();
  await loadBlogs();
});

function setupNavbar() {
  const authNav = document.getElementById("authNav");
  if (!authNav) return;

  if (token) {
    const initial = userName.charAt(0).toUpperCase();

    authNav.innerHTML = `
      <div class="nav-user">
        <div class="nav-user-badge" onclick="toggleDropdown()">${initial}</div>
        <div class="nav-dropdown" id="navDropdown">
          <a href="#" style="pointer-events:none; opacity:0.75;">${escapeHtml(userName)}</a>
          <a href="#" onclick="logout(); return false;">Logout</a>
        </div>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <a class="btn btn-secondary" href="login.html">Login</a>
      <a class="btn btn-primary" href="register.html">Register</a>
    `;
  }
}

function toggleDropdown() {
  document.getElementById("navDropdown")?.classList.toggle("open");
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-user")) {
    document.getElementById("navDropdown")?.classList.remove("open");
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.reload();
}

function toggleMobileMenu() {
  document.getElementById("navLinks")?.classList.toggle("mobile-open");
}

function scrollToCreate() {
  const section = document.getElementById("createSection");

  if (section && token) {
    section.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = "login.html";
  }
}

function scrollToLatest() {
  document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
}

function setupCreateSection() {
  const createSection = document.getElementById("createSection");
  if (createSection && token) {
    createSection.style.display = "block";
  }
}

function setupCharCounter() {
  const blogContent = document.getElementById("blogContent");
  const charCount = document.getElementById("charCount");

  if (blogContent && charCount) {
    blogContent.addEventListener("input", () => {
      charCount.textContent = `${blogContent.value.length} characters`;
    });
  }
}

async function loadBlogs() {
  try {
    const response = await fetch(`${API}/api/blogs`);
    const data = await response.json();

    allBlogs = Array.isArray(data) ? data : [];
    document.getElementById("heroCount").textContent = allBlogs.length;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = payload.id;
      } catch {
        currentUserId = null;
      }
    }

    updateFeatured();
    renderBlogs(filterBlogs(allBlogs));
  } catch (error) {
    const grid = document.getElementById("blogsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Could not load stories</h3>
          <p>Please check if backend is running properly.</p>
        </div>
      `;
    }
  }
}

function updateFeatured() {
  if (!allBlogs.length) return;

  const featured = allBlogs[0];
  featuredBlogId = featured._id;

  const author = featured.author?.name || "Anonymous";
  const date = formatDate(featured.createdAt);

  document.getElementById("featuredTitle").textContent = featured.title;
  document.getElementById("featuredExcerpt").textContent = shortenText(featured.content, 120);
  document.getElementById("featuredAuthor").textContent = author;
  document.getElementById("featuredDate").textContent = date;
  document.getElementById("featuredAvatar").textContent = author.charAt(0).toUpperCase();
}

function openFeatured() {
  if (featuredBlogId) {
    openBlog(featuredBlogId);
  }
}

function filterByCategory(category, button) {
  currentCategory = category;

  document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");

  renderBlogs(filterBlogs(allBlogs));
}

function filterBlogs(blogs) {
  if (currentCategory === "all") return blogs;
  return blogs.filter((blog) => (blog.category || "Other") === currentCategory);
}

function renderBlogs(blogs) {
  const grid = document.getElementById("blogsGrid");
  const noBlogs = document.getElementById("noBlogs");
  const count = document.getElementById("sectionCount");

  if (!grid) return;

  count.textContent = `${blogs.length} stor${blogs.length === 1 ? "y" : "ies"}`;

  if (!blogs.length) {
    grid.innerHTML = "";
    noBlogs.style.display = "block";
    return;
  }

  noBlogs.style.display = "none";

  grid.innerHTML = blogs.map((blog) => {
    const author = blog.author?.name || "Anonymous";
    const authorId = blog.author?._id || blog.author?.id;
    const isOwner = currentUserId && authorId === currentUserId;
    const category = blog.category || "Other";

    return `
      <article class="blog-card" onclick="openBlog('${blog._id}')">
        <div class="blog-card-image">
          <img src="${getCategoryImage(category)}" alt="${escapeHtml(category)}" />
          <span class="pill-label">${escapeHtml(category)}</span>
        </div>

        <div class="blog-card-content">
          <h3>${escapeHtml(blog.title)}</h3>
          <p>${escapeHtml(shortenText(blog.content, 110))}</p>

          <div class="blog-card-footer">
            <div class="blog-author">
              <div class="author-avatar">${author.charAt(0).toUpperCase()}</div>
              <div>
                <strong>${escapeHtml(author)}</strong>
                <small>${formatDate(blog.createdAt)} · ${getReadTime(blog.content)} min read</small>
              </div>
            </div>

            <div class="blog-actions" onclick="event.stopPropagation()">
              <button class="icon-action" onclick="likeBlog(this)">♥ 0</button>
              ${isOwner ? `
                <button class="icon-action" onclick="openEditModal('${blog._id}')">✎</button>
                <button class="icon-action" onclick="deleteBlog('${blog._id}')">🗑</button>
              ` : ""}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function openBlog(id) {
  const blog = allBlogs.find((item) => item._id === id);
  if (!blog) return;

  const author = blog.author?.name || "Anonymous";
  const category = blog.category || "Other";

  const modalBody = document.getElementById("modalBody");
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="modal-cover">
      <img src="${getCategoryImage(category)}" alt="${escapeHtml(category)}" />
    </div>

    <span class="section-tag">${escapeHtml(category)}</span>
    <h1 class="modal-title">${escapeHtml(blog.title)}</h1>

    <div class="modal-meta">
      <div class="author-avatar" style="background: var(--dark); color: white;">${author.charAt(0).toUpperCase()}</div>
      <div>
        <strong>${escapeHtml(author)}</strong>
        <div class="stories-count">${formatDate(blog.createdAt)}</div>
      </div>
      <div class="modal-divider"></div>
      <div class="stories-count">${getReadTime(blog.content)} min read</div>
    </div>

    <div class="modal-content-text">${escapeHtml(blog.content)}</div>
  `;

  document.getElementById("blogModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(event) {
  if (event.target === event.currentTarget) {
    closeBlogModal();
  }
}

function closeBlogModal() {
  document.getElementById("blogModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

function openEditModal(id) {
  const blog = allBlogs.find((item) => item._id === id);
  if (!blog) return;

  editingBlogId = id;

  document.getElementById("editTitle").value = blog.title;
  document.getElementById("editCategory").value = blog.category || "Other";
  document.getElementById("editContent").value = blog.content;

  document.getElementById("editModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  document.getElementById("editModal")?.classList.remove("open");
  document.body.style.overflow = "";
  editingBlogId = null;
}

function closeEditModalOverlay(event) {
  if (event.target === event.currentTarget) {
    closeEditModal();
  }
}

async function createBlog() {
  const title = document.getElementById("blogTitle")?.value.trim();
  const category = document.getElementById("blogCategory")?.value || "Other";
  const content = document.getElementById("blogContent")?.value.trim();

  if (!token) {
    showToast("Please login first", "error");
    return;
  }

  if (!title || !content) {
    showToast("Please add title and content", "error");
    return;
  }

  try {
    const response = await fetch(`${API}/api/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, category, content })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("blogTitle").value = "";
      document.getElementById("blogCategory").value = "";
      document.getElementById("blogContent").value = "";
      document.getElementById("charCount").textContent = "0 characters";

      showToast("Story published successfully", "success");
      await loadBlogs();
      scrollToLatest();
    } else {
      showToast(data.message || "Failed to create story", "error");
    }
  } catch (error) {
    showToast("Server error", "error");
  }
}

async function submitEdit() {
  const title = document.getElementById("editTitle")?.value.trim();
  const category = document.getElementById("editCategory")?.value || "Other";
  const content = document.getElementById("editContent")?.value.trim();

  if (!title || !content) {
    showToast("Please fill all fields", "error");
    return;
  }

  try {
    const response = await fetch(`${API}/api/blogs/${editingBlogId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, category, content })
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Story updated", "success");
      closeEditModal();
      await loadBlogs();
    } else {
      showToast(data.message || "Failed to update", "error");
    }
  } catch (error) {
    showToast("Server error", "error");
  }
}

async function deleteBlog(id) {
  const ok = confirm("Do you want to delete this story?");
  if (!ok) return;

  try {
    const response = await fetch(`${API}/api/blogs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      showToast("Story deleted", "success");
      await loadBlogs();
    } else {
      const data = await response.json();
      showToast(data.message || "Failed to delete", "error");
    }
  } catch (error) {
    showToast("Server error", "error");
  }
}

function likeBlog(button) {
  button.classList.toggle("liked");
  const current = parseInt(button.textContent.replace("♥", "").trim()) || 0;
  button.textContent = button.classList.contains("liked") ? `♥ ${current + 1}` : `♥ ${Math.max(0, current - 1)}`;
}

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

function getCategoryImage(category) {
  return categoryImages[category] || categoryImages.Other;
}

function shortenText(text = "", limit = 120) {
  return text.length > limit ? text.slice(0, limit).trim() + "..." : text;
}

function getReadTime(content = "") {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 180));
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text || ""));
  return div.innerHTML;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBlogModal();
    closeEditModal();
  }
});