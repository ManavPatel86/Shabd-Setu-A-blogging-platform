import express from "express";
import Blog from "../models/blog.model.js";
import BlogLike from "../models/bloglike.model.js";
import Comment from "../models/comment.model.js";
import View from "../models/view.model.js"; 
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const blogs = await Blog.find({ author: userId });
    const blogIds = blogs.map((b) => b._id);

    const totalLikes = await BlogLike.countDocuments({ blogid: { $in: blogIds } });
    const totalComments = await Comment.countDocuments({ blogid: { $in: blogIds } });
    // The app increments `Blog.views` when a view is recorded (see view.controller.addView)
    // but we don't create a View document there. Counting View documents will return 0
    // if views weren't stored in the `views` collection. Use the Blog.documents' `views`
    // field instead to compute total views.
    const totalViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);
    // Count unique views tracked in the `views` collection (one per user per blog).
    // If you don't want unique view counts, clients can still rely on `totalViews`.
    const uniqueViews = await View.countDocuments({ blogId: { $in: blogIds } });

    const engagementRate = totalViews
      ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2)
      : 0;

    const trends = blogs.map((b) => ({
      date: b.createdAt.toISOString().split("T")[0],
      views: b.views,
      likes: b.likes,
      comments: b.comments,
    }));

    // Pick top blog by views for a simple insight
    const topBlog = blogs.reduce((best, b) => {
      if (!best) return b;
      return (b.views || 0) > (best.views || 0) ? b : best;
    }, null);

    const aiInsight = topBlog
      ? `Your blogs received ${totalLikes} likes and ${totalComments} comments so far. Engagement rate: ${engagementRate}%. Top performing post: "${topBlog.title}" with ${topBlog.views || 0} views.`
      : `Your blogs received ${totalLikes} likes and ${totalComments} comments so far. Engagement rate: ${engagementRate}%.`;

    // Provide a small `topBlog` summary to help frontend show a highlighted post
    const topBlogSummary = topBlog
      ? { _id: topBlog._id, title: topBlog.title, views: topBlog.views || 0, slug: topBlog.slug }
      : null;

    res.json({
      overview: { views: totalViews, uniqueViews, likes: totalLikes, comments: totalComments, engagementRate },
      trends,
      aiInsight,
      topBlog: topBlogSummary,
    });
  } catch (err) {
    console.error("Error generating analytics:", err);
    res.status(500).json({ message: "Error generating analytics" });
  }
});
export default router; 
