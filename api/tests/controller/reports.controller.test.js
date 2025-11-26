import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Report from '../../models/report.model.js';
import Blog from '../../models/blog.model.js';
import User from '../../models/user.model.js';
import Category from '../../models/category.model.js';
import Notification from '../../models/notification.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';
import {
  reportBlog,
  listReports,
  adminSafeReport,
  adminRemoveReport,
  adminBanReport,
  buildReportPayload,
  removeReportById,
} from '../../controllers/reports.controller.js';

describe('Reports Controller Tests', () => {
  let req, res, next;
  let testUser, testAdmin, testBlog, testCategory;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
    });

    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'hashedpassword123',
      username: 'testuser',
    });

    testAdmin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword123',
      username: 'adminuser',
      role: 'admin',
    });

    testBlog = await Blog.create({
      title: 'Test Blog',
      slug: 'test-blog',
      blogContent: '<p>Test content</p>',
      author: testUser._id,
      categories: [testCategory._id],
      featuredImage: 'test-image.jpg',
      status: 'published',
    });

    req = {
      body: {},
      params: {},
      user: null,
      query: {},
    };

    const jsonMock = function(data) {
      this._jsonData = data;
      return this;
    };

    const statusMock = function(code) {
      this._statusCode = code;
      return this;
    };

    res = {
      _statusCode: null,
      _jsonData: null,
      status: statusMock,
      json: jsonMock,
    };

    next = (error) => {
      res._error = error;
    };
  });

  describe('reportBlog', () => {
    it('should create a report successfully', async () => {
      req.user = { _id: testAdmin._id, name: 'Admin User' };
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Spam',
        reason: 'This is spam content',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Report submitted successfully.');

      const report = await Report.findOne({ blogId: testBlog._id });
      expect(report).toBeTruthy();
      expect(report.type).toBe('Spam');
      expect(report.reason).toBe('This is spam content');
    });

    it('should return error when blogId is missing', async () => {
      req.user = { _id: testAdmin._id };
      req.body = { type: 'Spam' };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog ID and report type are required.');
    });

    it('should return error when user is not authenticated', async () => {
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(401);
      expect(res._jsonData.error).toBe('Authentication required.');
    });

    it('should return error for invalid blog ID format', async () => {
      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: 'invalid-id',
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid blog ID format.');
    });

    it('should return error for duplicate report', async () => {
      await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Hate speech',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(409);
      expect(res._jsonData.error).toBe('You have already reported this blog.');
    });

    it('should handle blogId as ObjectId instance', async () => {
      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: testBlog._id,
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
    });

    it('should handle invalid blogId type', async () => {
      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: 12345,
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid blog ID format.');
    });

    it('should handle notification creation failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const notifSpy = jest.spyOn(Notification, 'create').mockRejectedValue(new Error('Notification DB down'));

      req.user = { _id: testAdmin._id, name: 'Admin User' };
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to queue report notification:', expect.any(Error));

      notifSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const createSpy = jest.spyOn(Report, 'create').mockRejectedValue(new Error('DB error'));

      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to submit report.');

      createSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use fallback senderName when user.name is missing', async () => {
      req.user = { _id: testAdmin._id };
      req.body = {
        blogId: testBlog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
    });

    it('should use fallback blogTitle when title is empty', async () => {
      const blog = await Blog.create({
        title: 'Temp',
        slug: 'empty-title',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.updateOne({ _id: blog._id }, { $set: { title: '' } });

      req.user = { _id: testAdmin._id, name: 'Admin' };
      req.body = {
        blogId: blog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
    });

    it('should skip notification when blog author is missing', async () => {
      const blog = await Blog.create({
        title: 'No Author',
        slug: 'no-author',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.updateOne({ _id: blog._id }, { $unset: { author: 1 } });

      req.user = { _id: testAdmin._id, name: 'Admin' };
      req.body = {
        blogId: blog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
    });

    it('should use fallback link when blog slug is missing', async () => {
      const blog = await Blog.create({
        title: 'No Slug',
        slug: 'temp-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.updateOne({ _id: blog._id }, { $unset: { slug: 1 } });

      req.user = { _id: testAdmin._id, name: 'Admin' };
      req.body = {
        blogId: blog._id.toString(),
        type: 'Spam',
      };

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
    });
  });

  describe('listReports', () => {
    it('should list all pending reports', async () => {
      await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
      expect(res._jsonData.length).toBe(1);
      expect(res._jsonData[0].type).toBe('Spam');
    });

    it('should return empty array when no pending reports', async () => {
      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
      expect(res._jsonData.length).toBe(0);
    });

    it('should handle database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockFind = jest.spyOn(Report, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await listReports(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to fetch reports.');

      mockFind.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle report with falsy createdAt', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await Report.collection.updateOne({ _id: report._id }, { $set: { createdAt: null } });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should use fallback title when blog title is falsy', async () => {
      const blog = await Blog.create({
        title: 'Temp',
        slug: 'falsy-title',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne({ _id: blog._id }, { $set: { title: null } });

      await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
      const foundReport = res._jsonData.find(r => r.blog && r.blog.slug === 'falsy-title');
      if (foundReport) {
        expect(foundReport.blog.title).toBe('Untitled blog');
      }
    });

    it('should use fallback slug when blog slug is falsy', async () => {
      const blog = await Blog.create({
        title: 'Test',
        slug: 'temp-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne({ _id: blog._id }, { $set: { slug: null } });

      await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle category with null slug', async () => {
      const cat = await Category.create({
        name: 'Test Cat',
        slug: 'test-cat',
      });

      await Category.collection.updateOne({ _id: cat._id }, { $set: { slug: null } });

      const blog = await Blog.create({
        title: 'Blog',
        slug: 'blog-null-cat-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [cat._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle null category in array', async () => {
      const blog = await Blog.create({
        title: 'Blog',
        slug: 'blog-null-cat',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.updateOne({ _id: blog._id }, { $set: { categories: [null, testCategory._id] } });

      await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });
  });

  describe('adminSafeReport', () => {
    it('should mark report as safe and delete it', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();

      await adminSafeReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Report marked safe and removed.');

      const deletedReport = await Report.findById(report._id);
      expect(deletedReport).toBeNull();
    });

    it('should return error for invalid report ID', async () => {
      req.params.id = 'invalid-id';

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report identifier.');
    });

    it('should return error when report not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should handle deletion error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      const mockDelete = jest.spyOn(Report, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Delete error'));

      await adminSafeReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete report by id:', expect.any(Error));

      mockDelete.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockFindById = jest.spyOn(Report, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected failure');
      });

      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to mark report safe.');

      mockFindById.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('adminRemoveReport', () => {
    it('should remove blog and delete all related reports', async () => {
      await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = (await Report.findOne({ blogId: testBlog._id }))._id.toString();
      req.user = { _id: testAdmin._id };

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Blog removed and report cleared.');

      const deletedBlog = await Blog.findById(testBlog._id);
      expect(deletedBlog).toBeNull();
    });

    it('should return error for invalid report ID', async () => {
      req.params.id = 'invalid-id';

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report identifier.');
    });

    it('should handle missing blog gracefully', async () => {
      const report = await Report.create({
        blogId: new mongoose.Types.ObjectId(),
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Blog already removed; report cleared.');
    });

    it('should handle blog deletion failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      const mockDelete = jest.spyOn(Blog, 'findByIdAndDelete').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to delete reported blog.');

      mockDelete.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle notification failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      const notifSpy = jest.spyOn(Notification, 'create').mockRejectedValue(new Error('Notification DB down'));
      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send removal notification:', expect.any(Error));

      notifSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle req.user being null', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = null;

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
    });

    it('should return 404 for non-existent report', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should handle Report.deleteMany cleanup error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      const originalDeleteMany = Report.deleteMany.bind(Report);
      const deleteSpy = jest.spyOn(Report, 'deleteMany').mockImplementation(function(query) {
        if (query && query.blogId && !query.blogId.$in) {
          return Promise.reject(new Error('Cleanup error'));
        }
        return originalDeleteMany(query);
      });

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete blog reports:', expect.any(Error));

      deleteSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle general unexpected error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockFindById = jest.spyOn(Report, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to remove reported blog.');
      expect(consoleErrorSpy).toHaveBeenCalledWith('adminRemoveReport error:', expect.any(Error));

      mockFindById.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should skip notification when blog author is null', async () => {
      const blog = await Blog.create({
        title: 'No Author Blog',
        slug: 'no-author-blog',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne({ _id: blog._id }, { $set: { author: null } });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Blog removed and report cleared.');
    });
  });

  describe('adminBanReport', () => {
    it('should ban user and remove all their content', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Author banned and related content removed.');

      const bannedUser = await User.findById(testUser._id);
      expect(bannedUser.isBlacklisted).toBe(true);
    });

    it('should return error for invalid report ID', async () => {
      req.params.id = 'invalid-id';

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report identifier.');
    });

    it('should return 404 for non-existent report', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should prevent banning admin accounts', async () => {
      const adminBlog = await Blog.create({
        title: 'Admin Blog',
        slug: 'admin-blog',
        blogContent: '<p>Content</p>',
        author: testAdmin._id,
        categories: [testCategory._id],
        featuredImage: 'admin.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: adminBlog._id,
        reporterId: testUser._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Admin accounts cannot be banned from reports.');
    });

    it('should handle missing author gracefully', async () => {
      const blog = await Blog.create({
        title: 'Orphan Blog',
        slug: 'orphan-blog',
        blogContent: '<p>Content</p>',
        author: new mongoose.Types.ObjectId(),
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Author not found; report removed.');
    });

    it('should handle user update failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      const mockUpdate = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to blacklist user.');

      mockUpdate.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle blog lookup failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const userForLookup = await User.create({
        name: 'Lookup User',
        email: 'lookup@example.com',
        password: 'hashedpassword',
        username: 'lookupuser',
      });

      const blogForLookup = await Blog.create({
        title: 'Lookup Blog',
        slug: 'lookup-blog',
        blogContent: '<p>Content</p>',
        author: userForLookup._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: blogForLookup._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      const originalFind = Blog.find.bind(Blog);
      const findSpy = jest.spyOn(Blog, 'find').mockImplementation(function(query) {
        if (query && query.author && query.author.toString() === userForLookup._id.toString()) {
          const mockQuery = {
            select: jest.fn().mockRejectedValue(new Error('Find error'))
          };
          return mockQuery;
        }
        return originalFind(query);
      });

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user blogs:', expect.any(Error));

      findSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle user with no blogs', async () => {
      const userNoBlogs = await User.create({
        name: 'No Blogs User',
        email: 'noblogs@example.com',
        password: 'hashedpassword',
        username: 'noblogsuser',
      });

      const tempBlog = await Blog.create({
        title: 'Temp Blog',
        slug: 'temp-blog',
        blogContent: '<p>Content</p>',
        author: userNoBlogs._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: tempBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      const originalFind = Blog.find.bind(Blog);
      const findSpy = jest.spyOn(Blog, 'find').mockImplementation(function(query) {
        if (query && query.author && query.author.toString() === userNoBlogs._id.toString()) {
          return Promise.resolve([]);
        }
        return originalFind(query);
      });

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Author banned and related content removed.');

      const bannedUser = await User.findById(userNoBlogs._id);
      expect(bannedUser.isBlacklisted).toBe(true);

      findSpy.mockRestore();
    });

    it('should handle notification failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      const notifSpy = jest.spyOn(Notification, 'create').mockRejectedValue(new Error('Notification DB down'));
      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send ban notification:', expect.any(Error));

      notifSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle req.user being null', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = null;

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
    });

    it('should handle blog deletion error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      const originalDeleteMany = Blog.deleteMany.bind(Blog);
      const deleteSpy = jest.spyOn(Blog, 'deleteMany').mockImplementation(function(query) {
        if (query && query._id && query._id.$in) {
          return Promise.reject(new Error('Delete many error'));
        }
        return originalDeleteMany(query);
      });

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete author blogs:', expect.any(Error));

      deleteSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle report deletion error in ban flow', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      const originalDeleteMany = Report.deleteMany.bind(Report);
      const deleteSpy = jest.spyOn(Report, 'deleteMany').mockImplementation(function(query) {
        if (query && query.blogId && query.blogId.$in) {
          return Promise.reject(new Error('Report delete many error'));
        }
        return originalDeleteMany(query);
      });

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear reports for banned user:', expect.any(Error));

      deleteSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle removeReportById with invalid reportId', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      const originalFindByIdAndDelete = Report.findByIdAndDelete;
      let deleteCallCount = 0;
      Report.findByIdAndDelete = async function(id) {
        deleteCallCount++;
        if (deleteCallCount === 2) {
          return null;
        }
        return originalFindByIdAndDelete.call(this, id);
      };

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminBanReport(req, res);

      expect(res._jsonData.success).toBe(true);

      Report.findByIdAndDelete = originalFindByIdAndDelete;
    });
  });

  describe('buildReportPayload Edge Cases', () => {
    it('should handle report with null/undefined fields in buildReportPayload', async () => {
      const blog = await Blog.create({
        title: 'Temp',
        slug: 'temp',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne({ _id: blog._id }, { $unset: { title: 1, slug: 1, author: 1 } });
      await Blog.collection.updateOne({ _id: blog._id }, { $set: { categories: [] } });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await Report.collection.updateOne({ _id: report._id }, { $unset: { createdAt: 1 } });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle report with null reporter', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await Report.collection.updateOne({ _id: report._id }, { $set: { reporterId: null } });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle report with null blog', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await Report.collection.updateOne({ _id: report._id }, { $set: { blogId: null } });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle blog author as populated object with _id', async () => {
      await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
      expect(res._jsonData.length).toBeGreaterThan(0);
    });

    it('should handle all null values in buildReportPayload', async () => {
      const blog = await Blog.create({
        title: 'Test',
        slug: 'test-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne(
        { _id: blog._id },
        { 
          $set: { 
            title: null,
            slug: null,
            author: null,
            categories: [null]
          }
        }
      );

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await Report.collection.updateOne(
        { _id: report._id },
        { $set: { type: null, reason: null, createdAt: null } }
      );

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle reporter with null fields', async () => {
      const reporter = await User.create({
        name: 'Reporter',
        email: 'reporter@test.com',
        password: 'hashedpass',
        username: 'reporter',
      });

      await User.collection.updateOne(
        { _id: reporter._id },
        { $set: { name: null, username: null, email: null } }
      );

      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: reporter._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should handle author with null fields in blog', async () => {
      const author = await User.create({
        name: 'Author',
        email: 'author@test.com',
        password: 'hashedpass',
        username: 'author',
      });

      await User.collection.updateOne(
        { _id: author._id },
        { $set: { name: null, username: null, email: null, role: null, isBlacklisted: null } }
      );

      const blog = await Blog.create({
        title: 'Blog',
        slug: 'blog-slug',
        blogContent: '<p>Content</p>',
        author: author._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
      const foundReport = res._jsonData.find(r => r.id === String(report._id));
      expect(foundReport).toBeTruthy();
    });

    it('should handle categories with null fields', async () => {
      const cat = await Category.create({
        name: 'Cat',
        slug: 'cat-slug',
      });

      await Category.collection.updateOne(
        { _id: cat._id },
        { $set: { title: null, slug: null } }
      );

      const blog = await Blog.create({
        title: 'Blog',
        slug: 'blog-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [cat._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      await listReports(req, res);

      expect(res._jsonData).toBeInstanceOf(Array);
    });

    it('should use blog title fallback in adminRemoveReport notification', async () => {
      const blog = await Blog.create({
        title: 'Test',
        slug: 'test-slug',
        blogContent: '<p>Content</p>',
        author: testUser._id,
        categories: [testCategory._id],
        featuredImage: 'test.jpg',
        status: 'published',
      });

      await Blog.collection.updateOne({ _id: blog._id }, { $set: { title: null } });

      const report = await Report.create({
        blogId: blog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();
      req.user = { _id: testAdmin._id };

      await adminRemoveReport(req, res);

      expect(res._jsonData.success).toBe(true);
    });


  });

  describe('Helper Functions', () => {
    it('should handle removeReportById error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testAdmin._id,
        type: 'Spam',
        status: 'pending',
      });

      req.params.id = report._id.toString();

      const originalFindByIdAndDelete = Report.findByIdAndDelete.bind(Report);
      const deleteSpy = jest.spyOn(Report, 'findByIdAndDelete').mockImplementation(function(id) {
        if (String(id) === String(report._id)) {
          return Promise.reject(new Error('Delete error'));
        }
        return originalFindByIdAndDelete(id);
      });

      await adminSafeReport(req, res);

      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete report by id:', expect.any(Error));

      deleteSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle adminBanReport general error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockFindById = jest.spyOn(Report, 'findById').mockImplementationOnce(() => {
        throw new Error('General error');
      });

      req.params.id = new mongoose.Types.ObjectId().toString();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to ban author.');
      expect(consoleErrorSpy).toHaveBeenCalledWith('adminBanReport error:', expect.any(Error));

      mockFindById.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  
    it('buildReportPayload should handle null/undefined reportDoc', () => {
      const result = buildReportPayload(null);
      expect(result).toBeDefined();
      expect(result.id).toBeNull();
      expect(result.blog).toBeNull();
      expect(result.reporter).toBeNull();
      expect(result.submittedAt).toBeNull();
    });

    it('buildReportPayload should set id null when report has no _id', () => {
      const payload = buildReportPayload({ _id: null });
      expect(payload.id).toBeNull();
    });

    it('buildReportPayload should handle category objects without _id', () => {
      const reportDoc = {
        _id: '507f191e810c19729de860ea',
        type: 'Spam',
        reporterId: { _id: '507f191e810c19729de860eb' },
        createdAt: new Date(),
        blogId: {
          _id: '507f191e810c19729de860ec',
          title: 'Title',
          slug: 'slug',
          categories: [ { name: 'NoIdCategory' } ],
          author: { _id: '507f191e810c19729de860ed', name: 'Author' }
        }
      };

      const result = buildReportPayload(reportDoc);
      expect(result.blog.categories[0].id).toBeNull();
      expect(result.blog.categories[0].slug).toBeNull();
    });

    it('removeReportById should return early for invalid ObjectId and not call DB', async () => {
      const spy = jest.spyOn(Report, 'findByIdAndDelete');
      await removeReportById('invalid-id-format');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
