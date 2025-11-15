import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import { View } from '../models/view.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { addView, getViewCount } from '../controllers/view.controller.js';

describe('View Controller', () => {
  let req, res, next, testUser, testBlog;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    testUser = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    testBlog = await Blog.create({
      title: 'Test Blog',
      slug: 'test-blog',
      blogContent: 'Test content',
      featuredImage: 'test-image.jpg',
      author: testUser._id,
    });

    req = { body: {}, params: {}, user: { _id: testUser._id }, query: {} };

    const jsonMock = function (data) { this._jsonData = data; return this; };
    const statusMock = function (code) { this._statusCode = code; return this; };

    res = { _statusCode: null, _jsonData: null, status: statusMock, json: jsonMock };
    next = (error) => { res._error = error; };
  });

  describe('addView', () => {
    it('should record a view successfully', async () => {
      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);

      const view = await View.findOne({ blogId: testBlog._id, userId: testUser._id });
      expect(view).toBeTruthy();
    });

    it('should increment blog view count', async () => {
      const initialViews = testBlog.views || 0;

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      const updatedBlog = await Blog.findById(testBlog._id);
      expect(updatedBlog.views).toBe(initialViews + 1);
    });

    it('returns 400 when blogId missing', async () => {
      req.body = {};

      await addView(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('blogId is required');
    });

    it('returns 401 when user not authenticated', async () => {
      req.body.blogId = testBlog._id.toString();
      req.user = {};

      await addView(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(401);
    });

    it('returns 404 when blog not found', async () => {
      const spyFind = jest.spyOn(Blog, 'findById').mockImplementationOnce(() => ({ select: () => Promise.resolve(null) }));

      req.body.blogId = new mongoose.Types.ObjectId().toString();

      await addView(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);

      spyFind.mockRestore();
    });

    it('should return alreadyCounted when updateOne does not upsert', async () => {
      const spyUpdate = jest.spyOn(View, 'updateOne').mockResolvedValueOnce({ upsertedCount: 0 });

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.alreadyCounted).toBe(true);

      spyUpdate.mockRestore();
    });

    it('rolls back and returns 500 when blog update fails', async () => {
      const spyUpdate = jest.spyOn(View, 'updateOne').mockResolvedValueOnce({ upsertedCount: 1 });
      const spyBlogUpdate = jest.spyOn(Blog, 'findByIdAndUpdate').mockResolvedValueOnce(null);
      const spyDelete = jest.spyOn(View, 'deleteOne').mockResolvedValueOnce({});

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Unable to update view count.');

      spyUpdate.mockRestore();
      spyBlogUpdate.mockRestore();
      spyDelete.mockRestore();
    });

    it('handles duplicate-key (11000) by returning fallback view count', async () => {
      const err = new Error('dup');
      err.code = 11000;
      const spyUpdate = jest.spyOn(View, 'updateOne').mockRejectedValueOnce(err);

      // set the blog to have 7 views in the real DB so fallback read returns it
      testBlog.views = 7;
      await testBlog.save();

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.alreadyCounted).toBe(true);
      expect(res._jsonData.viewCount).toBe(7);

      spyUpdate.mockRestore();
    });

    it('returns 0 viewCount when updatedBlog.views is falsy', async () => {
      const spyUpdate = jest.spyOn(View, 'updateOne').mockResolvedValueOnce({ upsertedCount: 1 });
      const spyBlogUpdate = jest.spyOn(Blog, 'findByIdAndUpdate').mockResolvedValueOnce({ views: 0 });

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.alreadyCounted).toBe(false);
      expect(res._jsonData.viewCount).toBe(0);

      spyUpdate.mockRestore();
      spyBlogUpdate.mockRestore();
    });

    it('duplicate-key fallback returns 0 when blog not found', async () => {
      const err = new Error('dup');
      err.code = 11000;
      const spyUpdate = jest.spyOn(View, 'updateOne').mockRejectedValueOnce(err);
      // first call: return the existing blog so code reaches View.updateOne;
      // second call (fallback) should return null to exercise fallback->0
      const spyFallback = jest.spyOn(Blog, 'findById')
        .mockImplementationOnce(() => ({ select: () => Promise.resolve(testBlog) }))
        .mockImplementationOnce(() => ({ select: () => Promise.resolve(null) }));

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.alreadyCounted).toBe(true);
      expect(res._jsonData.viewCount).toBe(0);

      spyUpdate.mockRestore();
      spyFallback.mockRestore();
    });

    it('propagates unexpected errors to next', async () => {
      const spy = jest.spyOn(Blog, 'findById').mockImplementationOnce(() => ({ select: () => Promise.reject(new Error('boom')) }));

      req.body.blogId = testBlog._id.toString();

      await addView(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('boom');

      spy.mockRestore();
    });

    // Note: cannot simulate missing req.body because the function destructures req.body at the
    // top of the try block; attempting to set req.body = undefined would throw before the
    // duplicate-key fallback is reached. The duplicate-key fallback is exercised by other
    // tests above where updateOne rejects with code 11000.
  });

  describe('getViewCount', () => {
    it('should get blog views count', async () => {
      await View.create({ blogId: testBlog._id, userId: testUser._id });

      req.params.blogId = testBlog._id.toString();

      await getViewCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.viewCount).toBeDefined();
      expect(res._jsonData.viewCount).toBeGreaterThanOrEqual(0);
    });

    it('returns 400 when blogId missing', async () => {
      req.params = {};

      await getViewCount(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('blogId is required');
    });


    it('returns 404 when blog not found', async () => {
      const spy = jest.spyOn(Blog, 'findById').mockImplementationOnce(() => ({ select: () => Promise.resolve(null) }));

      req.params.blogId = new mongoose.Types.ObjectId().toString();

      await getViewCount(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);

      spy.mockRestore();
    });

    it('propagates unexpected errors to next', async () => {
      const spy = jest.spyOn(Blog, 'findById').mockImplementationOnce(() => ({ select: () => Promise.reject(new Error('netfail')) }));

      req.params.blogId = testBlog._id.toString();

      await getViewCount(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('netfail');

      spy.mockRestore();
    });
  });
});
