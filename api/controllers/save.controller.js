import mongoose from "mongoose";
import { handleError } from "../helpers/handleError.js";
import Blog from "../models/blog.model.js";
import User from "../models/user.model.js";

export const normalizeSavedBlogs = (savedBlogs) =>
    Array.isArray(savedBlogs) ? savedBlogs : [];

export const toggleSaveBlog = async (req, res, next) => {
    try {
        const { blogId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return next(handleError(400, "Invalid blog id."));
        }

        const blog = await Blog.findById(blogId).select("_id");
        if (!blog) {
            return next(handleError(404, "Blog not found."));
        }

        const user = await User.findById(req.user._id).select("savedBlogs");
        if (!user) {
            return next(handleError(404, "User not found."));
        }

    user.savedBlogs = normalizeSavedBlogs(user.savedBlogs);

        const existingIndex = user.savedBlogs.findIndex(
            (savedId) => savedId.toString() === blogId
        );

        let message = "Blog saved.";
        let isSaved = true;

        if (existingIndex > -1) {
            user.savedBlogs.splice(existingIndex, 1);
            message = "Removed from saved.";
            isSaved = false;
        } else {
            user.savedBlogs.push(blogId);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message,
            isSaved,
            savedCount: user.savedBlogs.length,
        });
    } catch (error) {
        next(handleError(500, error.message));
    }
};

export const getSavedBlogs = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: "savedBlogs",
                populate: [
                    { path: "author", select: "name avatar role" },
                    { path: "categories", select: "name slug" },
                ],
                options: { sort: { createdAt: -1 } },
            })
            .select("savedBlogs");

        if (!user) {
            return next(handleError(404, "User not found."));
        }

    user.savedBlogs = normalizeSavedBlogs(user.savedBlogs);

    const savedBlogs = user.savedBlogs.filter(Boolean);

        res.status(200).json({
            success: true,
            savedBlogs,
        });
    } catch (error) {
        next(handleError(500, error.message));
    }
};

export const getSaveStatus = async (req, res, next) => {
    try {
        const { blogId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return next(handleError(400, "Invalid blog id."));
        }

        const user = await User.findById(req.user._id).select("savedBlogs");
        if (!user) {
            return next(handleError(404, "User not found."));
        }

    user.savedBlogs = normalizeSavedBlogs(user.savedBlogs);

        const isSaved = user.savedBlogs.some(
            (savedId) => savedId.toString() === blogId
        );

        res.status(200).json({
            success: true,
            isSaved,
        });
    } catch (error) {
        next(handleError(500, error.message));
    }
};
