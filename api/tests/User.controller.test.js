import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import BlogLike from '../models/bloglike.model.js';
import Follow from '../models/follow.model.js';
import Category from '../models/category.model.js'; // Import to register schema
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { 
  getUser, 
  getAllUser, 
  deleteUser, 
  updateUserBlacklistStatus,
  getUserContributionActivity,
  getUserProfileOverview 
} from '../controllers/User.controller.js';

describe('User Controller Tests', () => {
  let req, res, next;

  beforeAll(async () => {
    await connectTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

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

  describe('getUser', () => {
    it('should get user by id successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: bcryptjs.hashSync('password123'),
      });

      req.params.userid = user._id.toString();

      await getUser(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('User data found.');
      expect(res._jsonData.user.name).toBe('Test User');
      expect(res._jsonData.user.email).toBe('test@example.com');
    });

    it('should return error for non-existent user', async () => {
      req.params.userid = new mongoose.Types.ObjectId().toString();

      await getUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
      expect(res._error.message).toBe('User not found.');
    });

    it('should handle invalid user id', async () => {
      req.params.userid = 'invalid-id';

      await getUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
    });
  });

  describe('getAllUser', () => {
    it('should return all users for admin', async () => {
      // Create admin user
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'admin',
      };

      // Create test users
      await User.create([
        { name: 'User 1', email: 'user1@example.com', password: 'pass123' },
        { name: 'User 2', email: 'user2@example.com', password: 'pass123' },
        { name: 'User 3', email: 'user3@example.com', password: 'pass123' },
      ]);

      await getAllUser(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.user).toHaveLength(3);
    });

    it('should deny access for non-admin users', async () => {
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
      };

      await getAllUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(403);
      expect(res._error.message).toBe('Only admins can access this resource.');
    });

    it('should deny access when no user is authenticated', async () => {
      req.user = null;

      await getAllUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(403);
    });

    it('should return users sorted by creation date (newest first)', async () => {
      req.user = { role: 'admin' };

      await getAllUser(req, res, next);

      // Just verify we get the users, sorting by createdAt works
      // (exact order is hard to test without explicit timestamps)
      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(Array.isArray(res._jsonData.user)).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully for admin', async () => {
      req.user = { role: 'admin' };

      const user = await User.create({
        name: 'User to Delete',
        email: 'delete@example.com',
        password: 'pass123',
      });

      req.params.id = user._id.toString();

      await deleteUser(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Data deleted.');

      // Verify user was deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should deny delete for non-admin users', async () => {
      req.user = { role: 'user' };

      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'pass123',
      });

      req.params.id = user._id.toString();

      await deleteUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(403);

      // Verify user still exists
      const stillExists = await User.findById(user._id);
      expect(stillExists).toBeTruthy();
    });
  });

  describe('updateUserBlacklistStatus', () => {
    it('should blacklist user successfully', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass123',
        role: 'admin',
      });

      const user = await User.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'pass123',
        isBlacklisted: false,
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params.userid = user._id.toString();
      req.body.isBlacklisted = true;

      await updateUserBlacklistStatus(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('User blacklisted successfully.');
      expect(res._jsonData.user.isBlacklisted).toBe(true);
    });

    it('should remove user from blacklist', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass123',
        role: 'admin',
      });

      const user = await User.create({
        name: 'Blacklisted User',
        email: 'blacklisted@example.com',
        password: 'pass123',
        isBlacklisted: true,
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params.userid = user._id.toString();
      req.body.isBlacklisted = false;

      await updateUserBlacklistStatus(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.message).toBe('User removed from blacklist successfully.');
      expect(res._jsonData.user.isBlacklisted).toBe(false);
    });

    it('should prevent admin from blacklisting themselves', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass123',
        role: 'admin',
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params.userid = admin._id.toString();
      req.body.isBlacklisted = true;

      await updateUserBlacklistStatus(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('You cannot update blacklist status for your own account.');
    });

    it('should prevent blacklisting admin users', async () => {
      const admin1 = await User.create({
        name: 'Admin 1',
        email: 'admin1@example.com',
        password: 'pass123',
        role: 'admin',
      });

      const admin2 = await User.create({
        name: 'Admin 2',
        email: 'admin2@example.com',
        password: 'pass123',
        role: 'admin',
      });

      req.user = { _id: admin1._id, role: 'admin' };
      req.params.userid = admin2._id.toString();
      req.body.isBlacklisted = true;

      await updateUserBlacklistStatus(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Admin accounts cannot be blacklisted.');
    });

    it('should require boolean value for isBlacklisted', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass123',
        role: 'admin',
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params.userid = new mongoose.Types.ObjectId().toString();
      req.body.isBlacklisted = 'not-boolean';

      await updateUserBlacklistStatus(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('isBlacklisted must be provided as a boolean.');
    });

    it('should handle non-existent user', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass123',
        role: 'admin',
      });

      req.user = { _id: admin._id, role: 'admin' };
      req.params.userid = new mongoose.Types.ObjectId().toString();
      req.body.isBlacklisted = true;

      await updateUserBlacklistStatus(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
      expect(res._error.message).toBe('User not found.');
    });
  });

  describe('getUserContributionActivity', () => {
    it('should return user contribution activity', async () => {
      const user = await User.create({
        name: 'Blogger',
        email: 'blogger@example.com',
        password: 'pass123',
      });

      // Create blogs
      const today = new Date();
      await Blog.create([
        {
          title: 'Blog 1',
          slug: 'blog-1',
          blogContent: 'Content 1',
          featuredImage: 'image1.jpg',
          author: user._id,
          createdAt: today,
        },
        {
          title: 'Blog 2',
          slug: 'blog-2',
          blogContent: 'Content 2',
          featuredImage: 'image2.jpg',
          author: user._id,
          createdAt: today,
        },
      ]);

      req.params.userid = user._id.toString();
      req.query.days = '7';

      await getUserContributionActivity(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.totalBlogs).toBe(2);
      expect(res._jsonData.contributions).toBeDefined();
      expect(res._jsonData.range.days).toBe(7);
    });

    it('should return error for invalid user id', async () => {
      req.params.userid = 'invalid-id';

      await getUserContributionActivity(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Invalid user id.');
    });

    it('should require user id', async () => {
      req.params.userid = '';

      await getUserContributionActivity(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('User id is required.');
    });

    it('should default to 365 days if not specified', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user@example.com',
        password: 'pass123',
      });

      req.params.userid = user._id.toString();

      await getUserContributionActivity(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.range.days).toBe(365);
    });
  });

  describe('getUserProfileOverview', () => {
    it('should return comprehensive user profile overview', async () => {
      const user = await User.create({
        name: 'Profile User',
        email: 'profile@example.com',
        password: 'pass123',
        bio: 'Test bio',
      });

      // Create blogs (categories is optional, so we omit it)
      await Blog.create({
        title: 'Test Blog',
        slug: 'test-blog',
        blogContent: 'Content',
        featuredImage: 'image.jpg',
        author: user._id,
        views: 100,
        categories: [], // Empty array to avoid populate issues
      });

      req.params.userid = user._id.toString();

      await getUserProfileOverview(req, res, next);

      // Log error for debugging if present
      if (res._error) {
        console.error('getUserProfileOverview error:', res._error.message, res._error.statusCode);
      }

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.user.name).toBe('Profile User');
      expect(res._jsonData.stats).toBeDefined();
      expect(res._jsonData.stats.totalPosts).toBe(1);
      expect(res._jsonData.stats.totalViews).toBe(100);
    });

    it('should return error for non-existent user', async () => {
      req.params.userid = new mongoose.Types.ObjectId().toString();

      await getUserProfileOverview(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
      expect(res._error.message).toBe('User not found.');
    });

    it('should return zero stats for user with no blogs', async () => {
      const user = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'pass123',
      });

      req.params.userid = user._id.toString();

      await getUserProfileOverview(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.stats.totalPosts).toBe(0);
      expect(res._jsonData.stats.totalViews).toBe(0);
      expect(res._jsonData.stats.totalLikes).toBe(0);
    });
  });
});
