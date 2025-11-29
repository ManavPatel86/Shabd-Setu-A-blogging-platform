import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import User from '../../models/user.model.js';
import Follow from '../../models/follow.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';

// Mock the notification utilities BEFORE importing the controller
jest.unstable_mockModule('../../utils/notifyTriggers.js', () => ({
  notifyFollow: jest.fn().mockResolvedValue(undefined)
}));

const { notifyFollow } = await import('../../utils/notifyTriggers.js');
const { followUser, unfollowUser, getFollowers, getFollowing, checkFollowStatus, getFollowStats } = await import('../../controllers/follow.controller.js');

describe('Follow Controller', () => {
  let req, res, next, testUser, testUser2;

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

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.following).toBe(false);
    });

    it('should handle notification failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      notifyFollow.mockRejectedValueOnce(new Error('Notification failed'));

      req.params.userId = testUser2._id.toString();

      await followUser(req, res, next);

      expect(res._statusCode).toBe(201);
      expect(res._jsonData.following).toBe(true);
      
      consoleErrorSpy.mockRestore();
    });

    it('should return 404 for non-existent user', async () => {
      req.params.userId = '507f1f77bcf86cd799439011';

      await followUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      req.user = { _id: null };
      req.params.userId = testUser2._id.toString();

      await followUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(401);
      expect(res._error.message).toBe('Authentication required');
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

    it('should return 404 for non-existent follow', async () => {
      req.params.userId = testUser2._id.toString();

      await unfollowUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
    });

    it('should handle database errors', async () => {
      const spy = jest.spyOn(Follow, 'findOneAndDelete').mockRejectedValueOnce(new Error('DB error'));

      req.params.userId = testUser2._id.toString();

      await unfollowUser(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('DB error');

      spy.mockRestore();
    });
  });

  describe('getFollowers', () => {
    it('should get user followers with populated details', async () => {
      await Follow.create({
        follower: testUser2._id,
        following: testUser._id,
      });

      req.params.userId = testUser._id.toString();

      await getFollowers(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.followers).toBeDefined();
      expect(res._jsonData.followers.length).toBe(1);
      expect(res._jsonData.followers[0]).toHaveProperty('name');
      expect(res._jsonData.followers[0]).toHaveProperty('email');
    });

    it('should return empty array when no followers', async () => {
      req.params.userId = testUser._id.toString();

      await getFollowers(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.followers).toEqual([]);
    });
  });

  describe('getFollowing', () => {
    it('should get users being followed with populated details', async () => {
      await Follow.create({
        follower: testUser._id,
        following: testUser2._id,
      });

      req.params.userId = testUser._id.toString();

      await getFollowing(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.following).toBeDefined();
      expect(res._jsonData.following[0]).toHaveProperty('name');
      expect(res._jsonData.following[0]).toHaveProperty('email');
    });

    it('should return empty array when not following anyone', async () => {
      req.params.userId = testUser._id.toString();

      await getFollowing(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(Array.isArray(res._jsonData.following)).toBe(true);
      expect(res._jsonData.following).toEqual([]);
    });
  });

  describe('checkFollowStatus', () => {
    it('should return true when following', async () => {
      await Follow.create({
        follower: testUser._id,
        following: testUser2._id,
      });

      req.params.userId = testUser2._id.toString();

      await checkFollowStatus(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      req.params.userId = testUser2._id.toString();

      await checkFollowStatus(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.isFollowing).toBe(false);
    });
  });

  describe('getFollowStats', () => {
    it('should return follow stats for a user', async () => {
      await Follow.create({
        follower: testUser2._id,
        following: testUser._id,
      });
      await Follow.create({
        follower: testUser._id,
        following: testUser2._id,
      });

      req.params.userId = testUser._id.toString();

      await getFollowStats(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.followersCount).toBe(1);
      expect(res._jsonData.followingCount).toBe(1);
    });

    it('should return zero stats for user with no follows', async () => {
      const testUser3 = await User.create({
        name: 'Test User 3',
        email: 'test3@example.com',
        password: 'password123',
      });

      req.params.userId = testUser3._id.toString();

      await getFollowStats(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.followersCount).toBe(0);
      expect(res._jsonData.followingCount).toBe(0);
    });
  });
});
