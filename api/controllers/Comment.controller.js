import { handleError } from "../helpers/handleError.js";
import Comment from "../models/comment.model.js";
import Blog from "../models/blog.model.js";
import { notifyComment, notifyReply } from "../utils/notifyTriggers.js";
import mongoose from "mongoose";

export const addcomment = async (req, res, next) => {
  try {
    const { blogid, comment } = req.body;

    if (!blogid || !comment) {
      return next(handleError(400, "Blog ID and comment are required"));
    }

    if (!mongoose.Types.ObjectId.isValid(blogid)) {
      return next(handleError(400, "Invalid blog ID"));
    }

    const newComment = new Comment({
      user: req.user._id,
      blogid: blogid,
      comment: comment.trim(),
    });

    await newComment.save();
    await newComment.populate("user", "name avatar");

    // ✅ Increment Blog.comment counter
    await Blog.findByIdAndUpdate(blogid, { $inc: { comments: 1 } });

    if (blogid) {
      try {
        await notifyComment({ commenterId: req.user._id, blogId: blogid });
      } catch (notificationError) {
        console.error("Failed to enqueue comment notification", notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Comment submitted successfully.",
      comment: newComment,
    });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { blogid } = req.params;
    const comments = await Comment.find({ blogid })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.status(200).json({
      comments,
    });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

export const commentCount = async (req, res, next) => {
  try {
    const { blogid } = req.params;
    const commentCount = await Comment.countDocuments({ blogid });

    res.status(200).json({
      commentCount,
    });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

export const getAllComments = async (req, res, next) => {
  try {
    const user = req.user;
    let comments;

    if (user.role === "admin") {
      comments = await Comment.find()
        .populate({
          path: "blogid",
          select: "title slug categories",
          populate: { path: "categories", select: "name slug" },
        })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } else {
      comments = await Comment.find({ user: user._id })
        .populate({
          path: "blogid",
          select: "title slug categories",
          populate: { path: "categories", select: "name slug" },
        })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }

    res.status(200).json({ comments });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentid } = req.params;
    const deleted = await Comment.findByIdAndDelete(commentid);

    if (deleted) {
      // ✅ Decrement Blog.comment counter
      await Blog.findByIdAndUpdate(deleted.blogid, { $inc: { comments: -1 } });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

// ✅ keep your additional logic unchanged (addComment, replyToComment)
export const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const comment = await Comment.create({
      user: userId,
      blogid: blogId,
      comment: text,
    });

    await Blog.findByIdAndUpdate(blogId, { $inc: { comments: 1 } }); // ✅ Increment counter

    const blog = await Blog.findById(blogId).populate("author");
    if (blog && String(blog.author._id) !== String(userId)) {
      await notifyComment({ commenterId: userId, blogId });
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};
