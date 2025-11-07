import { handleError } from "../helpers/handleError.js"

import Comment from "../models/comment.model.js"
import Blog from "../models/blog.model.js";
import { notifyComment, notifyReply } from "../utils/notifyTriggers.js";

import mongoose from "mongoose"
export const addcomment = async (req, res, next) => {
    try {
        const { blogid, comment } = req.body
        
        if (!blogid || !comment) {
            return next(handleError(400, 'Blog ID and comment are required'))
        }

        if (!mongoose.Types.ObjectId.isValid(blogid)) {
            return next(handleError(400, 'Invalid blog ID'))
        }

        const newComment = new Comment({
            user: req.user._id, 
            blogid: blogid,
            comment: comment.trim()
        })

        await newComment.save()

    
        await newComment.populate('user', 'name avatar')

        if (blogid) {
            try {
                await notifyComment({ commenterId: req.user._id, blogId: blogid })
            } catch (notificationError) {
                console.error('Failed to enqueue comment notification', notificationError)
            }
        }

        res.status(200).json({
            success: true,
            message: 'Comment submitted successfully.',
            comment: newComment
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getComments = async (req, res, next) => {
    try {
        const { blogid } = req.params
        const comments = await Comment.find({ blogid }).populate('user', 'name avatar').sort({ createdAt: -1 }).lean().exec()

        res.status(200).json({
            comments
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}


export const commentCount = async (req, res, next) => {
    try {
        const { blogid } = req.params
        const commentCount = await Comment.countDocuments({ blogid })

        res.status(200).json({
            commentCount
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getAllComments = async (req, res, next) => {
    try {
        const user = req.user
        let comments
        if (user.role === 'admin') {
            comments = await Comment.find()
                .populate({
                    path: 'blogid',
                    select: 'title slug category',
                    populate: {
                        path: 'category',
                        select: 'name slug'
                    }
                })
                .populate('user', 'name avatar')
                .sort({ createdAt: -1 })
                .lean()
                .exec()
        } else {
            comments = await Comment.find({ user: user._id })
                .populate({
                    path: 'blogid',
                    select: 'title slug category',
                    populate: {
                        path: 'category',
                        select: 'name slug'
                    }
                })
                .populate('user', 'name avatar')
                .sort({ createdAt: -1 })
                .lean()
                .exec()
        }

        res.status(200).json({
            comments
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}


export const deleteComment = async (req, res, next) => {
    try {
        const { commentid } = req.params
        await Comment.findByIdAndDelete(commentid)

        res.status(200).json({
            success: true,
            message: 'Data deleted'
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const comment = await Comment.create({
      userId,
      blogId,
      text,
    });

    const blog = await Blog.findById(blogId).populate("author");
    if (blog && String(blog.author._id) !== String(userId)) {
      await notifyComment({
        commenterId: userId,
        postId: blogId,
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};


export const replyToComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) return res.status(404).json({ error: "Comment not found" });

    const reply = await Comment.create({
      userId,
      blogId,
      text,
      parentId: commentId,
    });


    if (String(parentComment.userId) !== String(userId)) {
      await notifyReply({
        replierId: userId,
        originalCommentUserId: parentComment.userId,
        postId: blogId,
      });
    }

    res.status(201).json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reply" });
  }
};