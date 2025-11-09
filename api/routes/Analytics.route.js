import express from "express";
import Blog from "../models/blog.model.js";
import BlogLike from "../models/bloglike.model.js";
import Comment from "../models/comment.model.js";
import View from "../models/view.model.js"; 

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user?._id; 

    
    const blogs = await Blog.find({ author: userId });

    const blogIds = blogs.map(b => b._id);

    const totalLikes = await BlogLike.countDocuments({ blogid: { $in: blogIds } });

    const totalComments = await Comment.countDocuments({ blogid: { $in: blogIds } });

    let totalViews = 0;
    try {
      totalViews = await View.countDocuments({ blogid: { $in: blogIds } });
    } catch (err) {
      console.log("No views collection found, skipping view count.");
    }

    const engagementRate = totalViews
      ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2)
      : 0;

    const trends = blogs.map((b) => ({
      date: b.createdAt.toISOString().split("T")[0],
      views: b.views || 0,
      likes: b.likes || 0,
      comments: b.comments || 0,
    }));


    const aiInsight = `Your blogs received ${totalLikes} likes and ${totalComments} comments so far. Engagement rate: ${engagementRate}%.`;

    res.json({
      overview: { views: totalViews, likes: totalLikes, comments: totalComments, engagementRate },
      trends,
      aiInsight,
    });
  } catch (err) {
    console.error("Error generating analytics:", err);
    res.status(500).json({ message: "Error generating analytics" });
  }
});

export default router;
