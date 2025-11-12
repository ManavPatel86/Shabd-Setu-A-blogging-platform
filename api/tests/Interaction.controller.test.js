import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import BlogLike from '../models/bloglike.model.js';
import Follow from '../models/follow.model.js';
import { View } from '../models/view.model.js';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { doLike, likeCount } from '../controllers/bloglike.controller.js';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/follow.controller.js';
import { addView, getViewCount } from '../controllers/view.controller.js';

describe('Interaction Controllers Tests', () => {
  let req, res, next, testUser, testUser2, testBlog;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

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

  describe('BlogLike Controller', () => {
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
        // First like
        await BlogLike.create({
          user: testUser._id,
          blogid: testBlog._id,
        });

        req.body.blogid = testBlog._id.toString();

        // doLike toggles, so this will unlike
        await doLike(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.likecount).toBe(0);

        const like = await BlogLike.findOne({
          user: testUser._id,
          blogid: testBlog._id,
        });
        expect(like).toBeNull();
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
    });
  });

  describe('Follow Controller', () => {
    describe('followUser', () => {
      it('should follow a user successfully', async () => {
        req.params.userId = testUser2._id.toString();

        await followUser(req, res, next);

        expect(res._statusCode).toBe(201);
        expect(res._jsonData.success).toBe(true);
        expect(res._jsonData.following).toBe(true);

        const follow = await Follow.findOne({
          follower: testUser._id,
          following: testUser2._id,
        });
        expect(follow).toBeTruthy();
      });

      it('should prevent self-follow', async () => {
        req.params.userId = testUser._id.toString();

        await followUser(req, res, next);

        expect(res._error).toBeDefined();
        expect(res._error.statusCode).toBe(400);
      });

      it('should toggle unfollow for duplicate follows', async () => {
        await Follow.create({
          follower: testUser._id,
          following: testUser2._id,
        });

        req.params.userId = testUser2._id.toString();

        await followUser(req, res, next);

        // followUser toggles, so calling again should unfollow
        expect(res._statusCode).toBe(200);
        expect(res._jsonData.following).toBe(false);
      });
    });

    describe('unfollowUser', () => {
      it('should unfollow a user successfully', async () => {
        await Follow.create({
          follower: testUser._id,
          following: testUser2._id,
        });

        req.params.userId = testUser2._id.toString();

        await unfollowUser(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.success).toBe(true);

        const follow = await Follow.findOne({
          follower: testUser._id,
          following: testUser2._id,
        });
        expect(follow).toBeNull();
      });
    });

    describe('getFollowers', () => {
      it('should get user followers', async () => {
        await Follow.create({
          follower: testUser2._id,
          following: testUser._id,
        });

        req.params.userid = testUser._id.toString();

        await getFollowers(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.followers).toBeDefined();
        expect(res._jsonData.followers.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('getFollowing', () => {
      it('should get users being followed', async () => {
        await Follow.create({
          follower: testUser._id,
          following: testUser2._id,
        });

        req.params.userid = testUser._id.toString();

        await getFollowing(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.following).toBeDefined();
      });
    });
  });

  describe('View Controller', () => {
    describe('addView', () => {
      it('should record a view successfully', async () => {
        req.body.blogId = testBlog._id.toString();

        await addView(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.success).toBe(true);

        const view = await View.findOne({
          blogId: testBlog._id,
          userId: testUser._id,
        });
        expect(view).toBeTruthy();
      });

      it('should increment blog view count', async () => {
        const initialViews = testBlog.views || 0;

        req.body.blogId = testBlog._id.toString();

        await addView(req, res, next);

        const updatedBlog = await Blog.findById(testBlog._id);
        expect(updatedBlog.views).toBe(initialViews + 1);
      });
    });

    describe('getViewCount', () => {
      it('should get blog views count', async () => {
        await View.create({
          blogId: testBlog._id,
          userId: testUser._id,
        });

        req.params.blogId = testBlog._id.toString();

        await getViewCount(req, res, next);

        expect(res._statusCode).toBe(200);
        expect(res._jsonData.viewCount).toBeDefined();
        expect(res._jsonData.viewCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
