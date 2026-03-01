const Blog = require("../models/Blog");

exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create({ title: req.body.title, content: req.body.content, category: req.body.category || "", author: req.user.id });
    res.status(201).json(blog);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "name").sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    blog.title = req.body.title;
    blog.content = req.body.content;
    blog.category = req.body.category || blog.category;
    await blog.save();
    res.json(blog);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    await blog.deleteOne();
    res.json({ message: "Blog deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};