import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import Comment from '../models/comment.model.js';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { addcomment, getComments, deleteComment } from '../controllers/Comment.controller.js';

// Mock notification utilities
const mockNotifyFunctions = {};

describe('Comment Controller Tests', () => {
  let req, res, next, testUser, testBlog;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Create test blog
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
        name: testUser.name,
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

  describe('addcomment', () => {
    it('should add a comment successfully', async () => {
      req.body = {
        blogid: testBlog._id.toString(),
        comment: 'Great article!',
      };

      await addcomment(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Comment submitted successfully.');
      expect(res._jsonData.comment.comment).toBe('Great article!');
      expect(res._jsonData.comment.user).toBeDefined();
    });

    it('should require blogid and comment', async () => {
      req.body = {
        comment: 'Test comment',
        // missing blogid
      };

      await addcomment(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Blog ID and comment are required');
    });

    it('should validate blog ID format', async () => {
      req.body = {
        blogid: 'invalid-id',
        comment: 'Test comment',
      };

      await addcomment(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Invalid blog ID');
    });

    it('should trim whitespace from comment', async () => {
      req.body = {
        blogid: testBlog._id.toString(),
        comment: '  Comment with spaces  ',
      };

      await addcomment(req, res, next);

      expect(res._jsonData.comment.comment).toBe('Comment with spaces');
    });
  });

  describe('getComments', () => {
    it('should get all comments for a blog', async () => {
      // Create some comments
      await Comment.create([
        {
          user: testUser._id,
          blogid: testBlog._id,
          comment: 'First comment',
        },
        {
          user: testUser._id,
          blogid: testBlog._id,
          comment: 'Second comment',
        },
      ]);

      req.params.blogid = testBlog._id.toString();

      await getComments(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.comments).toHaveLength(2);
    });

    it('should return empty array for blog with no comments', async () => {
      req.params.blogid = testBlog._id.toString();

      await getComments(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.comments).toHaveLength(0);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        blogid: testBlog._id,
        comment: 'Comment to delete',
      });

      req.params.commentid = comment._id.toString();

      await deleteComment(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Data deleted');

      // Verify deletion
      const deleted = await Comment.findById(comment._id);
      expect(deleted).toBeNull();
    });
  });
});
