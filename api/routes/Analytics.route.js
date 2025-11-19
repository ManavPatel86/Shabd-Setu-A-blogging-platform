import express from "express";
import mongoose from "mongoose";
import Blog from "../models/blog.model.js";
import BlogLike from "../models/bloglike.model.js";
import Comment from "../models/comment.model.js";
import { View } from "../models/view.model.js";
import Follow from "../models/follow.model.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// GET /api/analytics
// Returns overview, follower vs non-follower breakdown (for unique views/likes/comments),
// trends for the last 30 days and a small AI-style insight summary.
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`[/api/analytics] request by user: ${userId}`);

    const blogs = await Blog.find({ author: userId }).select("_id title slug views likes comments createdAt");
    console.log(`[/api/analytics] found ${blogs.length} blogs for user ${userId}`);
    const blogIds = blogs.map((b) => b._id);

    // If the user has no blogs, return a tidy empty analytics response early.
    if (!blogIds.length) {
      return res.json({
        overview: { views: 0, uniqueViews: 0, likes: 0, comments: 0, engagementRate: 0 },
        breakdown: {
          uniqueViews: { followers: 0, nonFollowers: 0 },
          likes: { followers: 0, nonFollowers: 0 },
          comments: { followers: 0, nonFollowers: 0 },
        },
        trends: [],
        aiInsight: 'No posts yet',
        topBlog: null,
      });
    }

    // Totals
    const totalLikes = await BlogLike.countDocuments({ blogid: { $in: blogIds } });
    const totalComments = await Comment.countDocuments({ blogid: { $in: blogIds } });
    const totalViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);

    // Unique views tracked in View collection
    const uniqueViews = await View.countDocuments({ blogId: { $in: blogIds } });

    // Followers list (users who follow this profile)
    const followers = await Follow.find({ following: userId }).select("follower");
    const followerIds = followers.map((f) => f.follower);

    // Breakdown: likes and comments by followers vs non-followers
    const followerLikes = followerIds.length
      ? await BlogLike.countDocuments({ blogid: { $in: blogIds }, user: { $in: followerIds } })
      : 0;

    const followerComments = followerIds.length
      ? await Comment.countDocuments({ blogid: { $in: blogIds }, user: { $in: followerIds } })
      : 0;

    const followerUniqueViews = followerIds.length
      ? await View.countDocuments({ blogId: { $in: blogIds }, userId: { $in: followerIds } })
      : 0;

    const nonFollowerUniqueViews = Math.max(0, uniqueViews - followerUniqueViews);

    // Trends for the last 30 days (based on createdAt of View, BlogLike and Comment)
    const days = 30;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const [viewsByDayRaw, likesByDayRaw, commentsByDayRaw] = await Promise.all([
      View.aggregate([
        { $match: { blogId: { $in: blogIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      BlogLike.aggregate([
        { $match: { blogid: { $in: blogIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { blogid: { $in: blogIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
    ]);

    // Build series for last 30 days
    const trends = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const viewsPoint = viewsByDayRaw.find((r) => r._id === key);
      const likesPoint = likesByDayRaw.find((r) => r._id === key);
      const commentsPoint = commentsByDayRaw.find((r) => r._id === key);
      trends.push({ date: key, views: viewsPoint ? viewsPoint.count : 0, likes: likesPoint ? likesPoint.count : 0, comments: commentsPoint ? commentsPoint.count : 0 });
    }

    // Top blog
    const topBlog = blogs.reduce((best, b) => {
      if (!best) return b;
      return (b.views || 0) > (best.views || 0) ? b : best;
    }, null);

    const engagementRate = totalViews ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2) : 0;

    const aiInsight = topBlog
      ? `Your blogs received ${totalLikes} likes and ${totalComments} comments so far. Engagement rate: ${engagementRate}%. Top performing post: "${topBlog.title}" with ${topBlog.views || 0} views.`
      : `Your blogs received ${totalLikes} likes and ${totalComments} comments so far. Engagement rate: ${engagementRate}%.`;

    res.json({
      overview: { views: totalViews, uniqueViews, likes: totalLikes, comments: totalComments, engagementRate },
      breakdown: {
        uniqueViews: { followers: followerUniqueViews, nonFollowers: nonFollowerUniqueViews },
        likes: { followers: followerLikes, nonFollowers: Math.max(0, totalLikes - followerLikes) },
        comments: { followers: followerComments, nonFollowers: Math.max(0, totalComments - followerComments) },
      },
      trends,
      aiInsight,
      topBlog: topBlog ? { _id: topBlog._id, title: topBlog.title, views: topBlog.views || 0, slug: topBlog.slug } : null,
    });
  } catch (err) {
    console.error("Error generating analytics:", err, err.stack);
    res.status(500).json({ message: "Error generating analytics", error: err?.message });
  }
});

export default router;
