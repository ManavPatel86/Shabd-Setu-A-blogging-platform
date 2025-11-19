// /api/controllers/reports.controller.js
// Rebuilt controller for handling user blog reports and admin moderation flow

import mongoose from 'mongoose';
import Report from '../models/report.model.js';
import Blog from '../models/blog.model.js';
import User from '../models/user.model.js';
import { createNotification } from '../utils/createNotification.js';

const { Types } = mongoose;

const normalizeObjectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim();
  if (Types.ObjectId.isValid(value)) return String(value);
  if (typeof value === 'object' && value._id) return normalizeObjectId(value._id);
  return null;
};

const buildReportPayload = (reportDoc) => {
  const report = reportDoc || {};
  const blog = report.blogId || {};
  const reporter = report.reporterId || {};
  const categories = Array.isArray(blog.categories) ? blog.categories : [];
  const author = blog.author || null;

  return {
    id: report._id ? String(report._id) : null,
    type: report.type || null,
    reason: report.reason || '',
    submittedAt: report.createdAt ? new Date(report.createdAt).toISOString() : null,
    blog: blog._id
      ? {
          id: String(blog._id),
          title: blog.title || 'Untitled blog',
          slug: blog.slug || null,
          categories: categories.map((cat) => ({
            id: cat && cat._id ? String(cat._id) : null,
            title: cat?.title || null,
            slug: cat?.slug || null,
          })),
          author: author && author._id
            ? {
                id: String(author._id),
                name: author.name || null,
                username: author.username || null,
                email: author.email || null,
                isBlacklisted: Boolean(author.isBlacklisted),
                role: author.role || 'user',
              }
            : null,
        }
      : null,
    reporter: reporter && reporter._id
      ? {
          id: String(reporter._id),
          name: reporter.name || null,
          username: reporter.username || null,
          email: reporter.email || null,
        }
      : null,
  };
};

const removeReportById = async (reportId) => {
  if (!Types.ObjectId.isValid(reportId)) return;
  try {
    await Report.findByIdAndDelete(reportId);
  } catch (error) {
    console.error('Failed to delete report by id:', error);
  }
};

export const reportBlog = async (req, res) => {
  try {
    const { blogId, type, reason } = req.body;
    const reporterId = req.user?._id;

    if (!blogId || !type) {
      return res.status(400).json({ error: 'Blog ID and report type are required.' });
    }

    if (!reporterId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const normalizedBlogId = normalizeObjectId(blogId);
    if (!normalizedBlogId || !Types.ObjectId.isValid(normalizedBlogId)) {
      return res.status(400).json({ error: 'Invalid blog ID format.' });
    }

    const duplicate = await Report.findOne({ blogId: normalizedBlogId, reporterId });
    if (duplicate) {
      return res.status(409).json({ error: 'You have already reported this blog.' });
    }

    await Report.create({
      blogId: normalizedBlogId,
      reporterId,
      type,
      reason: reason || '',
      status: 'pending',
    });

    try {
      const blog = await Blog.findById(normalizedBlogId)
        .populate({ path: 'author', select: 'name' })
        .lean();

      if (blog?.author?._id) {
        await createNotification({
          recipientId: blog.author._id,
          senderId: reporterId,
          type: 'report',
          link: blog.slug ? `/blog/${blog.slug}` : '/blog',
          extra: {
            senderName: (req.user && req.user.name) || 'Someone',
            blogTitle: blog.title || 'a blog',
          },
        });
      }
    } catch (notificationError) {
      console.error('Failed to queue report notification:', notificationError);
    }

    return res.status(201).json({ success: true, message: 'Report submitted successfully.' });
  } catch (error) {
    console.error('reportBlog error:', error);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
};

export const listReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'blogId',
        select: 'title slug categories author',
        populate: [
          { path: 'categories', select: 'title slug' },
          { path: 'author', select: 'name username email role isBlacklisted' },
        ],
      })
      .populate({ path: 'reporterId', select: 'name username email' })
      .lean();

    const formatted = reports.map(buildReportPayload).filter((report) => report.id);
    return res.json(formatted);
  } catch (error) {
    console.error('listReports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

export const adminSafeReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid report identifier.' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await removeReportById(id);
    return res.json({ success: true, message: 'Report marked safe and removed.' });
  } catch (error) {
    console.error('adminSafeReport error:', error);
    return res.status(500).json({ error: 'Failed to mark report safe.' });
  }
};

export const adminRemoveReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid report identifier.' });
    }

    const report = await Report.findById(id).populate({
      path: 'blogId',
      populate: { path: 'author', select: 'name username email role isBlacklisted' },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const blog = report.blogId;
    if (!blog || !blog._id) {
      await removeReportById(id);
      return res.json({ success: true, message: 'Blog already removed; report cleared.' });
    }

    const blogId = String(blog._id);
    const blogAuthorId = normalizeObjectId(blog.author);

    try {
      await Blog.findByIdAndDelete(blogId);
    } catch (deletionError) {
      console.error('Failed to delete blog:', deletionError);
      return res.status(500).json({ error: 'Failed to delete reported blog.' });
    }

    try {
      await Report.deleteMany({ blogId });
    } catch (cleanupError) {
      console.error('Failed to delete blog reports:', cleanupError);
    }

    await removeReportById(id);

    if (blogAuthorId) {
      try {
        await createNotification({
          recipientId: blogAuthorId,
          senderId: req.user?._id,
          type: 'report',
          link: '/dashboard/reports',
          extra: {
            senderName: 'Admin',
            blogTitle: blog.title || 'Your blog',
            message: 'Your blog has been removed after moderator review.',
          },
        });
      } catch (notificationError) {
        console.error('Failed to send removal notification:', notificationError);
      }
    }

    return res.json({ success: true, message: 'Blog removed and report cleared.' });
  } catch (error) {
    console.error('adminRemoveReport error:', error);
    return res.status(500).json({ error: 'Failed to remove reported blog.' });
  }
};

export const adminBanReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid report identifier.' });
    }

    const report = await Report.findById(id).populate({
      path: 'blogId',
      populate: { path: 'author', select: 'name username email role isBlacklisted status' },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const blog = report.blogId;
    const authorDoc = blog?.author;
    const authorId = normalizeObjectId(authorDoc);

    if (!authorId) {
      await removeReportById(id);
      return res.json({ success: true, message: 'Author not found; report removed.' });
    }

    if (authorDoc?.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be banned from reports.' });
    }

    try {
      await User.findByIdAndUpdate(
        authorId,
        { isBlacklisted: true, status: 'banned' },
        { new: true }
      );
    } catch (userError) {
      console.error('Failed to blacklist user:', userError);
      return res.status(500).json({ error: 'Failed to blacklist user.' });
    }

    let affectedBlogs = [];
    try {
      affectedBlogs = await Blog.find({ author: authorId }).select('_id');
    } catch (blogLookupError) {
      console.error('Failed to fetch user blogs:', blogLookupError);
    }

    if (affectedBlogs.length) {
      const blogIds = affectedBlogs.map((blogDoc) => String(blogDoc._id));
      try {
        await Blog.deleteMany({ _id: { $in: blogIds } });
      } catch (blogDeleteError) {
        console.error('Failed to delete author blogs:', blogDeleteError);
      }
      try {
        await Report.deleteMany({ blogId: { $in: blogIds } });
      } catch (reportDeleteError) {
        console.error('Failed to clear reports for banned user:', reportDeleteError);
      }
    }

    try {
      await createNotification({
        recipientId: authorId,
        senderId: req.user?._id,
        type: 'report',
        link: '/profile',
        extra: {
          senderName: 'Admin',
          message: 'Your account has been banned following repeated policy violations.',
        },
      });
    } catch (notificationError) {
      console.error('Failed to send ban notification:', notificationError);
    }

    await removeReportById(id);

    return res.json({ success: true, message: 'Author banned and related content removed.' });
  } catch (error) {
    console.error('adminBanReport error:', error);
    return res.status(500).json({ error: 'Failed to ban author.' });
  }
};

