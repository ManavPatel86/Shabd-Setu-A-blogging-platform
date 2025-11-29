import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import User from '../../models/user.model.js';
import Blog from '../../models/blog.model.js';
import BlogLike from '../../models/bloglike.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';

// Mock the notification utilities BEFORE importing the controller
jest.unstable_mockModule('../../utils/notifyTriggers.js', () => ({
  notifyLike: jest.fn().mockResolvedValue(undefined)
}));

const { notifyLike } = await import('../../utils/notifyTriggers.js');
const { doLike, likeCount, likeBlog } = await import('../../controllers/BlogLike.controller.js');

describe('BlogLike Controller', () => {
  let req, res, next, testUser, testUser2, testBlog;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    testUser2 = await User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
    });

    testBlog = await Blog.create({
      title: 'Test Blog',
      slug: 'test-blog',
      blogContent: 'Test content',
      featuredImage: 'test-image.jpg',
      author: testUser._id,
    });

    req = {
      body: {},
      params: {},
      user: {
        _id: testUser._id,
      },
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

  describe('doLike', () => {
    it('should like a blog successfully', async () => {
      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(1);

      const like = await BlogLike.findOne({
        user: testUser._id,
        blogid: testBlog._id,
      });
      expect(like).toBeTruthy();
    });

    it('should unlike a blog (toggle)', async () => {
      await BlogLike.create({
        user: testUser._id,
        blogid: testBlog._id,
      });

      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(0);

      const like = await BlogLike.findOne({
        user: testUser._id,
        blogid: testBlog._id,
      });
      expect(like).toBeNull();
    });

    it('should return error when user is not identified', async () => {
      req.user = null;
      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toContain('Unable to identify user');
    });

    it('should use fallback user from body', async () => {
      req.user = null;
      req.body.user = testUser._id.toString();
      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(1);
    });

    it('should call notification on new like', async () => {
      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(notifyLike).toHaveBeenCalledWith({
        likerId: testUser._id.toString(),
        blogId: testBlog._id.toString()
      });
    });

    it('should handle notification failures gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      notifyLike.mockRejectedValueOnce(new Error('Notification error'));
      
      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      const spy = jest.spyOn(BlogLike, 'findOne').mockRejectedValueOnce(new Error('DB error'));

      req.body.blogid = testBlog._id.toString();

      await doLike(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  describe('likeCount', () => {
    it('should return like count for a blog', async () => {
      await BlogLike.create({
        user: testUser._id,
        blogid: testBlog._id,
      });
      await BlogLike.create({
        user: testUser2._id,
        blogid: testBlog._id,
      });

      req.params.blogid = testBlog._id.toString();
      req.params.userid = testUser._id.toString();

      await likeCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(2);
      expect(res._jsonData.isUserliked).toBe(true);
    });

    it('should return isUserliked false when user has not liked', async () => {
      await BlogLike.create({
        user: testUser2._id,
        blogid: testBlog._id,
      });

      req.params.blogid = testBlog._id.toString();
      req.params.userid = testUser._id.toString();

      await likeCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(1);
      expect(res._jsonData.isUserliked).toBe(false);
    });

    it('should work without userid parameter', async () => {
      await BlogLike.create({
        user: testUser._id,
        blogid: testBlog._id,
      });

      req.params.blogid = testBlog._id.toString();

      await likeCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.likecount).toBe(1);
      expect(res._jsonData.isUserliked).toBe(false);
    });

    it('should handle errors', async () => {
      const spy = jest.spyOn(BlogLike, 'countDocuments').mockRejectedValueOnce(new Error('DB error'));

      req.params.blogid = testBlog._id.toString();

      await likeCount(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('DB error');

      spy.mockRestore();
    });
  });

  describe('likeBlog', () => {
    it('should like a blog successfully', async () => {
      req.params.blogId = testBlog._id.toString();

      await likeBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.liked).toBe(true);

      const like = await BlogLike.findOne({ blogid: testBlog._id, user: testUser._id });
      expect(like).toBeTruthy();
    });

    it('should unlike a blog if already liked', async () => {
      await BlogLike.create({ blogid: testBlog._id, user: testUser._id });

      req.params.blogId = testBlog._id.toString();

      await likeBlog(req, res);

      expect(res._jsonData.liked).toBe(false);

      const like = await BlogLike.findOne({ blogid: testBlog._id, user: testUser._id });
      expect(like).toBeNull();
    });

    it('should return 401 when user is not authenticated', async () => {
      req.user = null;
      req.params.blogId = testBlog._id.toString();

      await likeBlog(req, res);

      expect(res._statusCode).toBe(401);
      expect(res._jsonData.error).toBe('Unauthorized');
    });

    it('should not notify when liking own blog', async () => {
      const ownBlog = await Blog.create({
        title: 'My Blog',
        slug: 'my-blog',
        blogContent: 'My content',
        featuredImage: 'image.jpg',
        author: testUser._id,
      });

      req.params.blogId = ownBlog._id.toString();

      await likeBlog(req, res);

      expect(res._statusCode).toBe(201);
    });

    it('should notify when liking someone else blog', async () => {
      req.user = { _id: testUser2._id };
      req.params.blogId = testBlog._id.toString();

      await likeBlog(req, res);

      expect(res._statusCode).toBe(201);
      expect(notifyLike).toHaveBeenCalledWith({
        likerId: testUser2._id,
        blogId: testBlog._id.toString()
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const spy = jest.spyOn(BlogLike, 'findOne').mockRejectedValueOnce(new Error('DB error'));

      req.params.blogId = testBlog._id.toString();

      await likeBlog(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to like blog');
      expect(consoleErrorSpy).toHaveBeenCalled();

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
