import { handleError } from "../helpers/handleError.js"

import BlogLike from "../models/bloglike.model.js"
import Blog from "../models/blog.model.js";
import { notifyLike } from "../utils/notifyTriggers.js";

export const doLike = async (req, res, next) => {
    try {
        const { user, blogid } = req.body
        let like
        like = await BlogLike.findOne({ user, blogid })
        if (!like) {
            const saveLike = new BlogLike({
                user, blogid
            })
            like = await saveLike.save()
        } else {
            await BlogLike.findByIdAndDelete(like._id)
        }

        const likecount = await BlogLike.countDocuments({ blogid })

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
    } catch (error) {999999999
        next(handleError(500, error.message))
    }
}

export const likeBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;

    const existingLike = await BlogLike.findOne({ blogId, userId });

    if (existingLike) {
      await BlogLike.findByIdAndDelete(existingLike._id);
      return res.json({ liked: false });
    }

    const like = await BlogLike.create({ blogId, userId });

    const blog = await Blog.findById(blogId).populate("author");
    if (blog && String(blog.author._id) !== String(userId)) {
      await notifyLike({
        likerId: userId,
        postId: blogId, 
      });
    }

    res.status(201).json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to like blog" });
  }
};
