import { handleError } from "../helpers/handleError.js";
import Blog from "../models/blog.model.js";

export const addView = async (req, res, next) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return next(handleError(400, "blogId is required"));

    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) return next(handleError(404, "Blog not found"));

    return res.status(200).json({ success: true, viewCount: blog.views });
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
