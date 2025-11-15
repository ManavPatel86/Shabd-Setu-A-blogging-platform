import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import Comment from '../models/comment.model.js';
import Category from '../models/category.model.js';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';

// Mock the notification utilities BEFORE importing controllers
jest.unstable_mockModule('../utils/notifyTriggers.js', () => ({
  notifyComment: jest.fn().mockResolvedValue(undefined),
  notifyReply: jest.fn().mockResolvedValue(undefined)
}));

const { notifyComment, notifyReply } = await import('../utils/notifyTriggers.js');
const { addcomment, getComments, deleteComment, commentCount, getAllComments, addComment, replyToComment } = await import('../controllers/Comment.controller.js');

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
    jest.clearAllMocks();

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

    it('should handle errors in deleteComment', async () => {
      const spy = jest.spyOn(Comment, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Delete failed'));

      req.params.commentid = '507f1f77bcf86cd799439011';

      await deleteComment(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  describe('commentCount', () => {
    it('should return comment count for a blog', async () => {
      await Comment.create([
        { user: testUser._id, blogid: testBlog._id, comment: 'Comment 1' },
        { user: testUser._id, blogid: testBlog._id, comment: 'Comment 2' },
        { user: testUser._id, blogid: testBlog._id, comment: 'Comment 3' },
      ]);

      req.params.blogid = testBlog._id.toString();

      await commentCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.commentCount).toBe(3);
    });

    it('should return 0 for blog with no comments', async () => {
      req.params.blogid = testBlog._id.toString();

      await commentCount(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.commentCount).toBe(0);
    });

    it('should handle errors in commentCount', async () => {
      const spy = jest.spyOn(Comment, 'countDocuments').mockRejectedValueOnce(new Error('Count failed'));

      req.params.blogid = testBlog._id.toString();

      await commentCount(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  describe('getAllComments', () => {
    it('should get all comments for admin user', async () => {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      });

      await Comment.create([
        { user: testUser._id, blogid: testBlog._id, comment: 'Comment 1' },
        { user: testUser._id, blogid: testBlog._id, comment: 'Comment 2' },
      ]);

      req.user = adminUser;

      await getAllComments(req, res, next);

      if (res._error) {
        console.log('Error:', res._error);
      }

      expect(res._statusCode).toBe(200);
      expect(res._jsonData).toBeDefined();
      expect(res._jsonData.comments).toBeDefined();
      expect(res._jsonData.comments).toHaveLength(2);
    });

    it('should get only user comments for non-admin', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      await Comment.create([
        { user: testUser._id, blogid: testBlog._id, comment: 'User comment' },
        { user: otherUser._id, blogid: testBlog._id, comment: 'Other user comment' },
      ]);

      req.user = testUser;

      await getAllComments(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.comments).toHaveLength(1);
      expect(res._jsonData.comments[0].comment).toBe('User comment');
    });

    it('should handle errors in getAllComments', async () => {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin2@example.com',
        password: 'admin123',
        role: 'admin',
      });

      const spy = jest.spyOn(Comment, 'find').mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValueOnce(new Error('Query failed'))
      });

      req.user = adminUser;

      await getAllComments(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      req.params.blogId = testBlog._id.toString();
      req.body.text = 'New comment via addComment';
      req.user = {
        _id: testUser._id,
      };

      await addComment(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData).toBeDefined();
      expect(res._jsonData.comment).toBe('New comment via addComment');
    });

    it('should return 401 when user is not authenticated', async () => {
      req.params.blogId = testBlog._id.toString();
      req.body.text = 'Test comment';
      req.user = null;

      await addComment(req, res);

      expect(res._statusCode).toBe(401);
      expect(res._jsonData.error).toBe('Unauthorized');
    });

    it('should call notifyComment for comments on others blogs', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const otherBlog = await Blog.create({
        title: 'Other Blog',
        slug: 'other-blog',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: otherUser._id,
      });

      req.params.blogId = otherBlog._id.toString();
      req.body.text = 'Comment on others blog';
      req.user = {
        _id: testUser._id,
      };

      await addComment(req, res);

      expect(notifyComment).toHaveBeenCalledWith({
        commenterId: testUser._id,
        blogId: otherBlog._id.toString(),
      });
    });

    it('should not notify when commenting on own blog', async () => {
      notifyComment.mockClear();

      req.params.blogId = testBlog._id.toString();
      req.body.text = 'Comment on own blog';
      req.user = {
        _id: testUser._id,
      };

      await addComment(req, res);

      expect(notifyComment).not.toHaveBeenCalled();
    });

    it('should handle errors in addComment', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const spy = jest.spyOn(Comment, 'create').mockRejectedValueOnce(new Error('Create failed'));

      req.params.blogId = testBlog._id.toString();
      req.body.text = 'Test comment';
      req.user = {
        _id: testUser._id,
      };

      await addComment(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to add comment');
      expect(consoleErrorSpy).toHaveBeenCalled();

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('replyToComment', () => {
    it('should reply to comment successfully', async () => {
      const parentComment = await Comment.create({
        user: testUser._id,
        blogid: testBlog._id,
        comment: 'Parent comment',
      });

      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      req.params.blogId = testBlog._id.toString();
      req.params.commentId = parentComment._id.toString();
      req.body.text = 'Reply to comment';
      req.user = {
        _id: otherUser._id,
      };

      await replyToComment(req, res);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData).toBeDefined();
      expect(res._jsonData.comment).toBe('Reply to comment');
      
      // Verify the reply was created
      const allComments = await Comment.find({});
      expect(allComments.length).toBeGreaterThanOrEqual(2); // parent + reply
    });

    it('should return 404 when parent comment not found', async () => {
      req.params.blogId = testBlog._id.toString();
      req.params.commentId = new mongoose.Types.ObjectId().toString();
      req.body.text = 'Reply';
      req.user = {
        _id: testUser._id,
      };

      await replyToComment(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.error).toBe('Comment not found');
    });

    it('should call notifyReply when replying to others comment', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const parentComment = await Comment.create({
        user: otherUser._id,
        blogid: testBlog._id,
        comment: 'Parent comment',
      });

      req.params.blogId = testBlog._id.toString();
      req.params.commentId = parentComment._id.toString();
      req.body.text = 'Reply';
      req.user = {
        _id: testUser._id,
      };

      await replyToComment(req, res);

      expect(notifyReply).toHaveBeenCalledWith({
        replierId: testUser._id,
        originalCommentUserId: otherUser._id,
        blogId: testBlog._id.toString(),
      });
    });

    it('should not notify when replying to own comment', async () => {
      notifyReply.mockClear();

      const parentComment = await Comment.create({
        user: testUser._id,
        blogid: testBlog._id,
        comment: 'Parent comment',
      });

      req.params.blogId = testBlog._id.toString();
      req.params.commentId = parentComment._id.toString();
      req.body.text = 'Reply to own comment';
      req.user = {
        _id: testUser._id,
      };

      await replyToComment(req, res);

      expect(notifyReply).not.toHaveBeenCalled();
    });

    it('should handle errors in replyToComment', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const spy = jest.spyOn(Comment, 'findById').mockRejectedValueOnce(new Error('Find failed'));

      req.params.blogId = testBlog._id.toString();
      req.params.commentId = '507f1f77bcf86cd799439011';
      req.body.text = 'Reply';
      req.user = {
        _id: testUser._id,
      };

      await replyToComment(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.error).toBe('Failed to reply');
      expect(consoleErrorSpy).toHaveBeenCalled();

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Notification Integration', () => {
    it('should handle notification failure in addcomment', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      notifyComment.mockRejectedValueOnce(new Error('Notification failed'));

      req.body = {
        blogid: testBlog._id.toString(),
        comment: 'Test comment',
      };

      await addcomment(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in getComments', async () => {
      const spy = jest.spyOn(Comment, 'find').mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValueOnce(new Error('Query failed'))
      });

      req.params.blogid = testBlog._id.toString();

      await getComments(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });

    it('should handle errors in addcomment', async () => {
      const spy = jest.spyOn(Comment.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'));

      req.body = {
        blogid: testBlog._id.toString(),
        comment: 'Test comment',
      };

      await addcomment(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);

      spy.mockRestore();
    });
  });
});
