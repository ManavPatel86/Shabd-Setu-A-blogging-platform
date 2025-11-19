import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import Blog from '../../models/blog.model.js';
import Report from '../../models/report.model.js';
import Category from '../../models/category.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';

// Mock createNotification before importing controller
jest.unstable_mockModule('../../utils/createNotification.js', () => ({
  createNotification: jest.fn().mockResolvedValue({})
}));

const {
  reportBlog,
  listReports,
  adminSafeReport,
  adminRemoveReport,
  adminBanReport
} = await import('../../controllers/reports.controller.js');

const { createNotification } = await import('../../utils/createNotification.js');

const buildRes = () => {
  const res = {};
  res.status = function status(code) {
    this._statusCode = code;
    return this;
  };
  res.json = function json(payload) {
    this._jsonData = payload;
    return this;
  };
  return res;
};

describe('Reports Controller', () => {
  let testUser, testAdmin, testBlog, testReporter, testCategory;
  let mockSpies = [];

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Clear all mocks
    jest.restoreAllMocks();
    jest.clearAllMocks();
    createNotification.mockClear();
    createNotification.mockResolvedValue({});

    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user'
    });

    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'password123',
      role: 'admin'
    });

    testReporter = await User.create({
      name: 'Test Reporter',
      email: 'testreporter@example.com',
      password: 'password123',
      role: 'user'
    });

    // Create test category
    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology'
    });

    // Create test blog
    testBlog = await Blog.create({
      title: 'Test Blog',
      slug: 'test-blog',
      blogContent: 'Test content',
      featuredImage: 'test-image.jpg',
      author: testUser._id,
      categories: [testCategory._id]
    });
  });

  afterEach(() => {
    // Restore all spies
    mockSpies.forEach(spy => spy.mockRestore && spy.mockRestore());
    mockSpies = [];
    jest.restoreAllMocks();
  });

  describe('reportBlog', () => {
    it('should successfully report a blog with all required fields', async () => {
      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam',
          reason: 'This is spam content'
        }, 
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Report submitted successfully.');

      const report = await Report.findOne({ 
        blogId: testBlog._id, 
        reporterId: testReporter._id 
      });
      expect(report).toBeTruthy();
      expect(report.type).toBe('Spam');
      expect(report.reason).toBe('This is spam content');
      expect(report.status).toBe('pending');
    });

    it('should report blog without reason (optional)', async () => {
      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Hate speech'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);

      const report = await Report.findOne({ 
        blogId: testBlog._id, 
        reporterId: testReporter._id 
      });
      expect(report).toBeTruthy();
      expect(report.reason).toBe('');
    });

    it('should handle blogId as object and convert to string', async () => {
      const req = { 
        body: {
          blogId: { _id: testBlog._id.toString() },
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
    });

    it('should return 400 when blogId is missing', async () => {
      const req = { 
        body: {
          type: 'Spam',
          reason: 'Test reason'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog ID and report type are required.');
    });

    it('should return 400 when type is missing', async () => {
      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          reason: 'Test reason'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog ID and report type are required.');
    });

    it('should return 400 for invalid blogId format', async () => {
      const req = { 
        body: {
          blogId: 'invalid-id',
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid blog ID format.');
    });

    it('should return 409 when user already reported the blog', async () => {
      // Create existing report
      await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(409);
      expect(res._jsonData.error).toBe('You have already reported this blog.');
    });

    it('should create notification for blog author', async () => {
      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(createNotification).toHaveBeenCalledWith({
        recipientId: testUser._id,
        senderId: testReporter._id,
        type: 'report',
        link: `/blog/${testBlog.slug}`,
        extra: { 
          senderName: testReporter.name, 
          blogTitle: testBlog.title 
        }
      });
    });

    it('should handle notification error without failing the request', async () => {
      createNotification.mockRejectedValueOnce(new Error('Notification failed'));

      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle missing user name in notification', async () => {
      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id } // No name
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({
            senderName: 'Someone'
          })
        })
      );
    });

    it('should handle general errors with 500 status', async () => {
      const spy = jest.spyOn(Report, 'findOne').mockRejectedValue(new Error('Database error'));
      mockSpies.push(spy);

      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      await reportBlog(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Database error');
    });

    it('should handle blogId object without _id property', async () => {
      // Pass an actual object without _id that contains the valid ID string
      const blogIdObject = {
        value: testBlog._id.toString(),
        toString: function() { return this.value; },
        match: function(regex) { return this.value.match(regex); }
      };
      
      const req = { 
        body: {
          blogId: blogIdObject, // Object without _id property - will use blogId itself in fallback
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.success).toBe(true);
    });

    it('should handle blog author without _id property', async () => {
      const blogWithPlainAuthor = await Blog.create({
        title: 'Test Blog Plain Author',
        slug: 'test-blog-plain-author',
        blogContent: 'Test content',
        featuredImage: 'test-image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      // Mock to return author as string (no _id property) to trigger the else branch
      const spy = jest.spyOn(Blog, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: blogWithPlainAuthor._id,
          title: blogWithPlainAuthor.title,
          slug: blogWithPlainAuthor.slug,
          author: testUser._id.toString() // Plain string - author._id will be undefined
        })
      });
      mockSpies.push(spy);

      const req = { 
        body: {
          blogId: blogWithPlainAuthor._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(createNotification).toHaveBeenCalled();
      // Verify recipientId was the string itself (else branch)
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: testUser._id.toString()
        })
      );
    });

    it('should handle error without message property', async () => {
      const errorWithoutMessage = { code: 'UNKNOWN' };
      const spy = jest.spyOn(Report, 'findOne').mockRejectedValue(errorWithoutMessage);
      mockSpies.push(spy);

      const req = { 
        body: {
          blogId: testBlog._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      await reportBlog(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to report blog.');
    });

    it('should handle blog without author (no notification sent)', async () => {
      const blogNoAuthor = await Blog.create({
        title: 'Test Blog No Author',
        slug: 'test-blog-no-author',
        blogContent: 'Test content',
        featuredImage: 'test-image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      // Mock to return blog without author to cover blog && !blog.author branch
      const spy = jest.spyOn(Blog, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: blogNoAuthor._id,
          title: blogNoAuthor.title,
          slug: blogNoAuthor.slug,
          author: null // No author - blog exists but author is falsy
        })
      });
      mockSpies.push(spy);

      const req = { 
        body: {
          blogId: blogNoAuthor._id.toString(),
          type: 'Spam'
        },
        user: { _id: testReporter._id, name: testReporter.name }
      };
      const res = buildRes();

      await reportBlog(req, res);

      expect(res._statusCode).toBe(201);
      // Notification should not be created when author is missing
      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  describe('listReports', () => {
    it('should return empty array when no reports exist', async () => {
      const req = {};
      const res = buildRes();

      await listReports(req, res);

      expect(res._jsonData).toBeTruthy();
      expect(Array.isArray(res._jsonData)).toBe(true);
      expect(res._jsonData.length).toBe(0);
    });

    it('should list all reports with populated fields', async () => {
      await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam',
        reason: 'Test reason'
      });

      const req = {};
      const res = buildRes();

      await listReports(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData).toBeTruthy();
      expect(Array.isArray(res._jsonData)).toBe(true);
      expect(res._jsonData.length).toBe(1);
      expect(res._jsonData[0].blogId).toBeTruthy();
      expect(res._jsonData[0].reporterId).toBeTruthy();
    });

    it('should sort reports by createdAt descending', async () => {
      const blog2 = await Blog.create({
        title: 'Test Blog 2',
        slug: 'test-blog-2',
        blogContent: 'Test content 2',
        featuredImage: 'test-image-2.jpg',
        author: testUser._id,
      });

      const report1 = await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });
      report1.createdAt = new Date('2024-01-01');
      await report1.save();

      const report2 = await Report.create({
        blogId: blog2._id,
        reporterId: testReporter._id,
        type: 'Hate speech'
      });
      report2.createdAt = new Date('2024-01-02');
      await report2.save();

      const req = {};
      const res = buildRes();

      await listReports(req, res);

      expect(res._jsonData.length).toBe(2);
      const firstDate = new Date(res._jsonData[0].createdAt);
      const secondDate = new Date(res._jsonData[1].createdAt);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    });

    it('should use fallback to fetch blog when title is missing', async () => {
      // Create a blog with empty title (falsy) so fallback condition triggers
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      await Report.create({
        blogId: emptyTitleBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      // Spy on Blog.findById to simulate successful fallback fetch returning recovered data
      const fallbackSpy = jest.spyOn(Blog, 'findById').mockReturnValue({
        select: () => Promise.resolve({ _id: emptyTitleBlog._id, title: 'Recovered Title', slug: 'recovered-title' })
      });
      mockSpies.push(fallbackSpy);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      expect(res._jsonData).toBeTruthy();
      expect(res._jsonData.length).toBe(1);
      expect(res._jsonData[0].blogId.title).toBe('Recovered Title');
      expect(fallbackSpy).toHaveBeenCalled();
    });

    it('should log error when fallback blog fetch fails', async () => {
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      await Report.create({
        blogId: emptyTitleBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      // Force fallback fetch to fail
      const failSpy = jest.spyOn(Blog, 'findById').mockReturnValue({
        select: () => Promise.reject(new Error('Fetch fail'))
      });
      mockSpies.push(failSpy);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      expect(res._jsonData).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch blog for report fallback:',
        expect.any(String)
      );
    });

    it('should log error when fallback blog fetch fails with no message property', async () => {
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      await Report.create({
        blogId: emptyTitleBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      // Force fallback fetch to reject with an object that has no message property
      const failObj = { code: 'NO_MESSAGE' };
      const failSpy = jest.spyOn(Blog, 'findById').mockReturnValue({
        select: () => Promise.reject(failObj)
      });
      mockSpies.push(failSpy);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      expect(res._jsonData).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch blog for report fallback:',
        expect.objectContaining({ code: 'NO_MESSAGE' })
      );
    });

    it('should log error when fallback blog fetch throws synchronously', async () => {
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      await Report.create({
        blogId: emptyTitleBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      // Have Blog.findById throw synchronously
      const throwSpy = jest.spyOn(Blog, 'findById').mockImplementation(() => { throw new Error('Sync fail'); });
      mockSpies.push(throwSpy);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch blog for report fallback:', expect.any(String));
    });

    it('should handle fallback when blog is not found (returns null)', async () => {
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      const report = await Report.create({
        blogId: emptyTitleBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      // Delete the blog so fallback genuinely returns null
      await Blog.findByIdAndDelete(emptyTitleBlog._id);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      expect(res._jsonData).toBeTruthy();
      expect(Array.isArray(res._jsonData)).toBe(true);
      // When blog is deleted, fallback returns null and if (blog) false branch is covered
      // The report still exists even though the blog was deleted
    });

    it('should explicitly exercise fallback false branch when Blog.findById returns null', async () => {
      // Create a blog with empty title to trigger fallback condition
      const emptyTitleBlog = await Blog.create({
        title: '',
        slug: '',
        status: 'draft',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: testUser._id,
        categories: [testCategory._id]
      });

      // Build a fake report array to force the controller into the fallback path
      const fakeReportId = new mongoose.Types.ObjectId();
      const reportsArray = [
        {
          _id: fakeReportId,
          blogId: emptyTitleBlog._id,
          reporterId: testReporter._id,
          createdAt: new Date()
        }
      ];

      // Mock the Report.find().sort().populate(...).populate(...) chain
      const finalPopulate = jest.fn().mockResolvedValue(reportsArray);
      const firstPopulate = jest.fn().mockReturnValue({ populate: finalPopulate });
      const sortObj = { populate: firstPopulate };
      const findSpy = jest.spyOn(Report, 'find').mockReturnValue({ sort: () => sortObj });
      mockSpies.push(findSpy);

      // Make Blog.findById(...).select(...) resolve to null to trigger the `if (blog)` false branch
      const nullSpy = jest.spyOn(Blog, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      mockSpies.push(nullSpy);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      // Verify fallback behavior and mocks were called
      expect(finalPopulate).toHaveBeenCalled();
      expect(nullSpy).toHaveBeenCalled();
      expect(Array.isArray(res._jsonData)).toBe(true);
      expect(res._jsonData.length).toBeGreaterThanOrEqual(1);
    });

    it('should exercise fallback when report.blogId is null and ensure fallback path is handled', async () => {
      // Prepare a fake report where blogId is null
      const fakeReportId = new mongoose.Types.ObjectId();
      const reportsArray = [
        {
          _id: fakeReportId,
          blogId: null,
          reporterId: testReporter._id,
          createdAt: new Date()
        }
      ];

      // Mock the Report.find().sort().populate(...).populate(...) chain
      const finalPopulate = jest.fn().mockResolvedValue(reportsArray);
      const firstPopulate = jest.fn().mockReturnValue({ populate: finalPopulate });
      const sortObj = { populate: firstPopulate };
      const findSpy = jest.spyOn(Report, 'find').mockReturnValue({ sort: () => sortObj });
      mockSpies.push(findSpy);

      // Mock Blog.findById to return null (for null blogId)
      const nullSpy2 = jest.spyOn(Blog, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      mockSpies.push(nullSpy2);

      const req = {};
      const res = buildRes();
      await listReports(req, res);

      // Ensure the populate was used and the fallback was attempted
      expect(finalPopulate).toHaveBeenCalled();
      expect(nullSpy2).toHaveBeenCalled();
      expect(Array.isArray(res._jsonData)).toBe(true);
    });

    it('should return 500 when Report.find throws an error', async () => {
      const spy = jest.spyOn(Report, 'find').mockImplementation(() => {
        throw new Error('DB fail');
      });
      mockSpies.push(spy);

      const req = {};
      const res = buildRes();

      await listReports(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData).toEqual({ error: 'Failed to fetch reports.' });
    });

  });

  describe('adminSafeReport', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });
    });

    it('should successfully mark report as safe', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('safe');

      const updatedReport = await Report.findById(testReport._id);
      expect(updatedReport.status).toBe('safe');
    });

    it('should return populated report with blogId and reporterId', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._jsonData.blogId).toBeTruthy();
      expect(res._jsonData.reporterId).toBeTruthy();
    });

    it('should return 400 for invalid report ID format', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report ID format.');
    });

    it('should return 400 for missing report ID', async () => {
      const req = {
        params: { id: '' },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report ID format.');
    });

    it('should return 404 when report not found', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should return 500 on database error', async () => {
      const spy = jest.spyOn(Report, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      mockSpies.push(spy);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminSafeReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to mark report as safe.');
    });
  });

  describe('adminRemoveReport', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });
    });

    it('should successfully remove blog and update report status', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('removed');

      const deletedBlog = await Blog.findById(testBlog._id);
      expect(deletedBlog).toBeNull();
    });

    it('should return 500 on unexpected error (top-level catch)', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const id = report._id.toString();
      const findSpy = jest.spyOn(Report, 'findById').mockImplementation(() => { throw new Error('Unexpected'); });
      mockSpies.push(findSpy);
      const req = { params: { id }, user: testAdmin };
      const res = buildRes();
      await adminRemoveReport(req, res);
      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to remove blog for report.');
    });

    it('should send notification to blog author', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockSpies.push(consoleLogSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(createNotification).toHaveBeenCalledWith({
        recipientId: testUser._id.toString(),
        senderId: testAdmin._id,
        type: 'report',
        link: `/blog/${testBlog.slug}`,
        extra: {
          senderName: 'Admin',
          blogTitle: testBlog.title,
          message: expect.stringContaining('removed due to violations')
        }
      });
    });

    it('should resolve other reports for the same blog', async () => {
      const anotherReporter = await User.create({
        name: 'Another Reporter',
        email: 'anotherreporter@example.com',
        password: 'password123'
      });

      const anotherReport = await Report.create({
        blogId: testBlog._id,
        reporterId: anotherReporter._id,
        type: 'Hate speech'
      });

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      const resolvedReport = await Report.findById(anotherReport._id);
      expect(resolvedReport.status).toBe('resolved');
    });

    it('should return 400 for invalid report ID format', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report ID format.');
    });

    it('should return 404 when report not found', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should return 400 when blog not found', async () => {
      testReport.blogId = new mongoose.Types.ObjectId();
      await testReport.save();

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog not found for this report.');
    });

    it('should handle blog with populated author object', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('removed');
    });

    it('should return 400 for invalid author ID format', async () => {
      const spy = jest.spyOn(Report, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: testReport._id,
          blogId: {
            _id: testBlog._id,
            author: 'invalid-author-id',
            title: testBlog.title,
            slug: testBlog.slug
          },
          status: 'pending',
          save: jest.fn()
        })
      });
      mockSpies.push(spy);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog author not found or invalid.');
    });

    it('should handle notification error without failing', async () => {
      createNotification.mockRejectedValueOnce(new Error('Notification failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('removed');
    });

    it('should handle error when resolving other reports', async () => {
      const updateManySpy = jest.spyOn(Report, 'updateMany').mockRejectedValue(new Error('Update failed'));
      mockSpies.push(updateManySpy);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('removed');
    });

    it('should return 500 when blog removal fails', async () => {
      const blogSpy = jest.spyOn(Blog, 'findByIdAndDelete').mockRejectedValue(new Error('Blog delete failed'));
      mockSpies.push(blogSpy);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminRemoveReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to remove blog.');
    });

  });

  describe('adminBanReport', () => {
    let testReport;

    beforeEach(async () => {
      if (!jest.isMockFunction(Report.create)) {
        testReport = await Report.create({
          blogId: testBlog._id,
          reporterId: testReporter._id,
          type: 'Spam'
        });
      }
    });

    it('should successfully ban user and update report status', async () => {
      if (!testReport) {
        testReport = await Report.create({
          blogId: testBlog._id,
          reporterId: testReporter._id,
          type: 'Spam'
        });
      }

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('banned');

      const bannedUser = await User.findById(testUser._id);
      expect(bannedUser.isBlacklisted).toBe(true);
      expect(bannedUser.status).toBe('banned');
    });

    it('should return 500 on unexpected error (top-level catch)', async () => {
      const report = await Report.create({
        blogId: testBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });
      const id = report._id.toString();
      const findSpy = jest.spyOn(Report, 'findById').mockImplementation(() => { throw new Error('Unexpected'); });
      mockSpies.push(findSpy);
      const req = { params: { id }, user: testAdmin };
      const res = buildRes();
      await adminBanReport(req, res);
      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to ban user for report.');
    });

    it('should send notification to banned user', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(createNotification).toHaveBeenCalledWith({
        recipientId: testUser._id.toString(),
        senderId: testAdmin._id,
        type: 'report',
        link: '/profile',
        extra: {
          senderName: 'Admin',
          message: expect.stringContaining('blacklisted due to policy violations')
        }
      });
    });

    it('should return 400 for invalid report ID format', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Invalid report ID format.');
    });

    it('should return 404 when report not found', async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Report not found.');
    });

    it('should return 400 when blog not found', async () => {
      testReport.blogId = new mongoose.Types.ObjectId();
      await testReport.save();

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog not found for this report.');
    });

    it('should handle blog author as object with _id', async () => {
      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('banned');
    });

    it('should return 400 for invalid author ID format', async () => {
      const spy = jest.spyOn(Report, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: testReport._id,
          blogId: {
            _id: testBlog._id,
            author: 'invalid-author-id'
          },
          status: 'pending',
          save: jest.fn()
        })
      });
      mockSpies.push(spy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Blog author not found or invalid.');
    });

    it('should return 404 when user not found', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      testBlog.author = nonExistentUserId;
      await testBlog.save();

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('User not found.');
    });

    it('should return 400 when trying to ban an admin', async () => {
      const adminBlog = await Blog.create({
        title: 'Admin Blog',
        slug: 'admin-blog',
        blogContent: 'Admin content',
        featuredImage: 'admin-image.jpg',
        author: testAdmin._id,
      });

      const adminReport = await Report.create({
        blogId: adminBlog._id,
        reporterId: testReporter._id,
        type: 'Spam'
      });

      const req = {
        params: { id: adminReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(400);
      expect(res._jsonData.error).toBe('Admin accounts cannot be blacklisted.');
    });

    it('should handle notification error without failing', async () => {
      createNotification.mockRejectedValueOnce(new Error('Notification failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBeUndefined();
      expect(res._jsonData.status).toBe('banned');
    });

    it('should return 500 when user blacklist fails', async () => {
      const userSpy = jest.spyOn(User, 'findByIdAndUpdate').mockRejectedValue(new Error('User update failed'));
      mockSpies.push(userSpy);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSpies.push(consoleErrorSpy);

      const req = {
        params: { id: testReport._id.toString() },
        user: { _id: testAdmin._id }
      };
      const res = buildRes();

      await adminBanReport(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to blacklist user.');
    });
  });

});
