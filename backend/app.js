const express = require("express");
const path = require("path");
const cors = require("cors");
const errorHandler = require("./utils/errorHandler");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use(errorHandler);

module.exports = app;