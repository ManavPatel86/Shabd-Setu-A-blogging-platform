import { handleError } from "../helpers/handleError.js";
import Blog from "../models/blog.model.js";
import { View } from "../models/view.model.js";

export const addView = async (req, res, next) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return next(handleError(400, "blogId is required"));

    const userId = req.user?._id;
    if (!userId) {
      return next(handleError(401, "Authentication required to record a view."));
    }

    const blog = await Blog.findById(blogId).select("views");
    if (!blog) return next(handleError(404, "Blog not found"));

    const result = await View.updateOne(
      { blogId, userId },
      { $setOnInsert: { blogId, userId } },
      { upsert: true }
    );

    if (!result.upsertedCount) {
      return res.status(200).json({
        success: true,
        viewCount: blog.views || 0,
        alreadyCounted: true,
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedBlog) {
      // rollback inserted view if blog update fails unexpectedly
      await View.deleteOne({ blogId, userId }).catch(() => {});
      return next(handleError(500, "Unable to update view count."));
    }

    return res.status(200).json({
      success: true,
      viewCount: updatedBlog.views || 0,
      alreadyCounted: false,
    });

  } catch (error) {
    if (error?.code === 11000) {
      const { blogId } = req.body || {};
      const fallback = await Blog.findById(blogId).select("views");
      return res.status(200).json({
        success: true,
        viewCount: fallback?.views || 0,
        alreadyCounted: true,
      });
    }
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
