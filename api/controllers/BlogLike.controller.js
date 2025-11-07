import { handleError } from "../helpers/handleError.js"

import BlogLike from "../models/bloglike.model.js"
import Blog from "../models/blog.model.js";
import { notifyLike } from "../utils/notifyTriggers.js";

export const doLike = async (req, res, next) => {
    try {
        const { blogid } = req.body
        const authUserId = req.user?._id?.toString()
        const fallbackUserId = req.body.user
        const userId = authUserId || fallbackUserId

        if (!userId) {
            return next(handleError(400, 'Unable to identify user for like action'))
        }

        let like = await BlogLike.findOne({ user: userId, blogid })
        let createdNewLike = false

        if (!like) {
            like = await BlogLike.create({ user: userId, blogid })
            createdNewLike = true
        } else {
            await BlogLike.findByIdAndDelete(like._id)
        }

        const likecount = await BlogLike.countDocuments({ blogid })

        if (createdNewLike && blogid) {
            try {
                await notifyLike({ likerId: userId, blogId: blogid })
            } catch (notificationError) {
                console.error('Failed to enqueue like notification', notificationError)
            }
        }

        res.status(200).json({
            likecount
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const likeCount = async (req, res, next) => {
    try {
        const { blogid, userid } = req.params
        const likecount = await BlogLike.countDocuments({ blogid })

        let isUserliked = false
        if (userid) {
            const getuserlike = await BlogLike.countDocuments({ blogid, user: userid })
            if (getuserlike > 0) {
                isUserliked = true
            }
        }


        res.status(200).json({
            likecount,
            isUserliked
        })
        } catch (error) {
        next(handleError(500, error.message))
    }
}

export const likeBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const existingLike = await BlogLike.findOne({ blogid: blogId, user: userId });

    if (existingLike) {
      await BlogLike.findByIdAndDelete(existingLike._id);
      return res.json({ liked: false });
    }

        await BlogLike.create({ blogid: blogId, user: userId });

    const blog = await Blog.findById(blogId).populate("author");
    if (blog && String(blog.author._id) !== String(userId)) {
      await notifyLike({
        likerId: userId,
                blogId,
      });
    }

    res.status(201).json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to like blog" });
  }
};
