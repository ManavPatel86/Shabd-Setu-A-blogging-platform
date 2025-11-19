import { handleError } from "../helpers/handleError.js";
import Blog from "../models/blog.model.js";
import View from "../models/view.model.js";

export const addView = async (req, res, next) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return next(handleError(400, "blogId is required"));

    // If a user is authenticated, create a View document to track unique views.
    // View schema enforces uniqueness on (blogId, userId). If the view is new,
    // increment the Blog.views counter. For anonymous viewers (no user),
    // just increment Blog.views as before.
    const authUserId = req.user?._id;

    if (authUserId) {
      try {
        // Try to create a unique View doc; if it fails with a duplicate key,
        // it means this user already viewed the blog.
        await View.create({ blogId, userId: authUserId });

        // Successfully recorded a unique view — increment blog counter.
        const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } }, { new: true });
        if (!blog) return next(handleError(404, "Blog not found"));
        return res.status(200).json({ success: true, viewCount: blog.views, unique: true });
      } catch (err) {
        // Duplicate key error -> already viewed; return current count without incrementing.
        if (err.code === 11000) {
          const blog = await Blog.findById(blogId).select('views');
          if (!blog) return next(handleError(404, "Blog not found"));
          return res.status(200).json({ success: true, viewCount: blog.views, unique: false });
        }
        // Other errors bubble up
        throw err;
      }
    }

    // Anonymous viewer path — increment blog.views like before
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) return next(handleError(404, "Blog not found"));

    return res.status(200).json({ success: true, viewCount: blog.views, unique: false });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

export const getViewCount = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    if (!blogId) return next(handleError(400, "blogId is required"));

    const blog = await Blog.findById(blogId).select("views");
    if (!blog) return next(handleError(404, "Blog not found"));

    return res.status(200).json({ success: true, viewCount: blog.views || 0 });
  } catch (error) {
    next(handleError(500, error.message));
  }
};
