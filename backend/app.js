const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const errorHandler = require("./utils/errorHandler");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BlogSphere API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// frontend can be:
// 1. inside backend/frontend
// 2. outside backend as ../frontend
// 3. inside backend/public
const possibleFrontendPaths = [
  path.join(__dirname, "frontend"),
  path.join(__dirname, "../frontend"),
  path.join(__dirname, "public"),
  path.join(__dirname, "../public"),
];

const frontendPath = possibleFrontendPaths.find((dir) => fs.existsSync(dir));

if (frontendPath) {
  console.log("Serving frontend from:", frontendPath);

  app.use(express.static(frontendPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  console.log("No frontend folder found. Backend API only mode.");
}

app.use(errorHandler);

module.exports = app;