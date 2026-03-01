const express = require("express");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog
} = require("../controllers/blogController");

const router = express.Router();

router.get("/", getBlogs);
router.post("/", auth, role("author", "admin"), createBlog);
router.put("/:id", auth, updateBlog);
router.delete("/:id", auth, deleteBlog);

module.exports = router;
