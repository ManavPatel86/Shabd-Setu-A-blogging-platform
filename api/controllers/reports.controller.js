// /api/controllers/reports.controller.js
// Handles reporting and admin report management

import Report from '../models/report.model.js';
import Blog from '../models/blog.model.js';
import User from '../models/user.model.js';
import { createNotification } from '../utils/createNotification.js';

/**
 * POST /api/report/blog
 * User reports a blog
 * Expects: { blogId, type, reason }
 */
export const reportBlog = async (req, res) => {
  try {
    const { blogId, type, reason } = req.body;
    const reporterId = req.user._id;
    if (!blogId || !type) {
      return res.status(400).json({ error: 'Blog ID and report type are required.' });
    }
    
    // Convert blogId to string if it's an object
    const blogIdStr = typeof blogId === 'object' ? blogId._id || blogId : blogId;
    
    // Validate blogId is a valid MongoDB ObjectId
    if (!blogIdStr.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid blog ID format.' });
    }
    // Prevent duplicate reports by same user
    const exists = await Report.findOne({ blogId: blogIdStr, reporterId });
    if (exists) return res.status(409).json({ error: 'You have already reported this blog.' });
    const report = await Report.create({ 
      blogId: blogIdStr, 
      reporterId, 
      type, 
      reason: reason || '' // Make reason optional
    });

    // Notify blog author about the report (non-blocking)
    try {
      const blog = await Blog.findById(blogIdStr).populate('author', 'name');
      if (blog && blog.author) {
        const recipientId = blog.author._id ? blog.author._id : blog.author;
        await createNotification({
          recipientId,
          senderId: reporterId,
          type: 'report',
          link: `/blog/${blog.slug}`,
          extra: { senderName: (req.user && req.user.name) || 'Someone', blogTitle: blog.title }
        });
      }
    } catch (notifErr) {
      console.error('Failed to create report notification:', notifErr);
      // don't fail the request
    }

    res.status(201).json({ success: true, message: 'Report submitted successfully.' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: err.message || 'Failed to report blog.' });
  }
};

/**
 * GET /api/admin/reports
 * Admin: list all reports
 */
export const listReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('blogId reporterId').sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

/**
 * PATCH /api/admin/report/:id
 * Admin: update report status
 * Expects: { status }
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending','resolved','safe','removed','banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
};

/**
 * Admin action: mark report as SAFE
 * PATCH /api/report/admin/report/:id/safe
 */
export const adminSafeReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid report ID format.' });
    }
    
    const report = await Report.findByIdAndUpdate(id, { status: 'safe' }, { new: true }).populate('blogId reporterId');
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    return res.json(report);
  } catch (err) {
    console.error('adminSafeReport error:', err);
    return res.status(500).json({ error: 'Failed to mark report as safe.' });
  }
};

/**
 * Admin action: remove/delete the blog and mark report removed
 * PATCH /api/report/admin/report/:id/remove
 */
export const adminRemoveReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid report ID format.' });
    }
    
    // Populate blogId and its author field
    const report = await Report.findById(id).populate({
      path: 'blogId',
      populate: { path: 'author' }
    });
    
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const blog = report.blogId;
    if (!blog) return res.status(400).json({ error: 'Blog not found for this report.' });

    const blogId = blog._id;
    
    // Extract authorId properly - handle both ObjectId and populated object
    let authorId = blog.author;
    if (authorId && typeof authorId === 'object' && authorId._id) {
      authorId = authorId._id;
    }
    
    // Convert to string for consistency
    authorId = String(authorId);
    
    // Validate authorId format
    if (!authorId || !authorId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid authorId format:', authorId);
      return res.status(400).json({ error: 'Blog author not found or invalid.' });
    }

    // Soft delete the blog (mark as removed instead of hard delete)
    try {
      await Blog.findByIdAndUpdate(blogId, {
        removed: true,
        removedAt: new Date(),
        removedBy: req.user._id // Admin who removed it
      }, { new: true });

      // Notify blog author about removal with warning
      try {
        await createNotification({
          recipientId: authorId,
          senderId: req.user._id,
          type: 'report', // Using 'report' type - the notification will use the custom message from extra
          link: `/blog/${blog.slug}`,
          extra: {
            senderName: 'Admin',
            blogTitle: blog.title,
            message: `Your blog "${blog.title}" has been removed due to violations. Please review our community guidelines.`
          }
        });
        console.log(`Removal notification sent to author: ${authorId}`);
      } catch (notifErr) {
        console.error('Failed to send removal notification:', notifErr);
        // Continue even if notification fails
      }

      // Resolve all other reports for this blog
      try {
        await Report.updateMany(
          { blogId: blogId, _id: { $ne: id }, status: { $ne: 'removed' } },
          { status: 'resolved' }
        );
      } catch (updateErr) {
        console.error('Failed to resolve other reports:', updateErr);
        // Continue even if this fails
      }
    } catch (delErr) {
      console.error('Failed to remove blog:', delErr);
      return res.status(500).json({ error: 'Failed to remove blog.' });
    }

    // Update this report status to removed
    report.status = 'removed';
    await report.save();
    
    // Populate with blog info (which still exists but marked as removed)
    const populated = await Report.findById(report._id).populate('blogId reporterId');
    return res.json(populated);
  } catch (err) {
    console.error('adminRemoveReport error:', err);
    return res.status(500).json({ error: 'Failed to remove blog for report.' });
  }
};

/**
 * Admin action: ban the blog author
 * PATCH /api/report/admin/report/:id/ban
 */
export const adminBanReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid report ID format.' });
    }
    
    const report = await Report.findById(id).populate('blogId');
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const blog = report.blogId;
    if (!blog) return res.status(400).json({ error: 'Blog not found for this report.' });
    
    // Extract authorId properly - handle both ObjectId and populated object
    let authorId = blog.author;
    if (authorId && typeof authorId === 'object' && authorId._id) {
      authorId = authorId._id;
    }
    
    // Convert to string for consistency
    authorId = String(authorId);
    
    // Validate authorId format
    if (!authorId || !authorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Blog author not found or invalid.' });
    }

    // Get the user to check if they're an admin
    const targetUser = await User.findById(authorId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent banning admins
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be blacklisted.' });
    }

    // Blacklist the user (set isBlacklisted to true)
    try {
      await User.findByIdAndUpdate(
        authorId,
        {
          isBlacklisted: true,
          status: 'banned' // Also update status for consistency
        },
        { new: true }
      );

      // Notify the banned user
      try {
        await createNotification({
          recipientId: authorId,
          senderId: req.user._id,
          type: 'report',
          link: '/profile',
          extra: {
            senderName: 'Admin',
            message: 'Your account has been blacklisted due to policy violations. Please contact support if you believe this is an error.'
          }
        });
      } catch (notifErr) {
        console.error('Failed to send ban notification:', notifErr);
        // Continue even if notification fails
      }
    } catch (userErr) {
      console.error('Failed to blacklist user:', userErr);
      return res.status(500).json({ error: 'Failed to blacklist user.' });
    }

    // Update report status
    report.status = 'banned';
    await report.save();
    
    const populated = await Report.findById(report._id).populate('blogId reporterId');
    return res.json(populated);
  } catch (err) {
    console.error('adminBanReport error:', err);
    return res.status(500).json({ error: 'Failed to ban user for report.' });
  }
};

/**
 * Admin action: resolve report without action
 * PATCH /api/report/admin/report/:id/resolve
 */
export const adminResolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid report ID format.' });
    }
    
    const report = await Report.findByIdAndUpdate(id, { status: 'resolved' }, { new: true }).populate('blogId reporterId');
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    return res.json(report);
  } catch (err) {
    console.error('adminResolveReport error:', err);
    return res.status(500).json({ error: 'Failed to resolve report.' });
  }
};
