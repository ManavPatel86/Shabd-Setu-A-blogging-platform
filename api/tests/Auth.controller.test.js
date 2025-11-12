import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { Login, GoogleLogin, Logout } from '../controllers/Auth.controller.js';

describe('Auth Controller Tests - Login & Logout', () => {
  let req, res, next;

  beforeAll(async () => {
    await connectTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Setup request/response/next
    req = {
      body: {},
      cookies: {},
    };

    const jsonMock = function(data) {
      this._jsonData = data;
      return this;
    };

    const statusMock = function(code) {
      this._statusCode = code;
      return this;
    };

    const cookieMock = function(name, value, options) {
      this._cookies = this._cookies || {};
      this._cookies[name] = { value, options };
      return this;
    };

    const clearCookieMock = function(name, options) {
      this._clearedCookies = this._clearedCookies || [];
      this._clearedCookies.push({ name, options });
      return this;
    };

    res = {
      _statusCode: null,
      _jsonData: null,
      _cookies: {},
      _clearedCookies: [],
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock,
    };

    next = (error) => {
      res._error = error;
    };
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = bcryptjs.hashSync('password123');
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        avatar: 'avatar-url.jpg',
      });
    });

    it('should login user successfully with valid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await Login(req, res);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData).toBeDefined();
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Login successful.');
      expect(res._jsonData.user.email).toBe('test@example.com');
      expect(res._jsonData.user.name).toBe('Test User');
      expect(res._jsonData.user.password).toBeUndefined();
      
      // Check cookie was set
      expect(res._cookies.access_token).toBeDefined();
      expect(res._cookies.access_token.options.httpOnly).toBe(true);
    });

    it('should return error for non-existent user', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await Login(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.message).toBe('Invalid login credentials.');
    });

    it('should return error for incorrect password', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await Login(req, res);

      expect(res._statusCode).toBe(404);
      expect(res._jsonData.message).toBe('Invalid login credentials.');
    });

    it('should generate valid JWT token', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await Login(req, res);

      const token = res._cookies.access_token.value;
      expect(token).toBeDefined();

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.name).toBe('Test User');
      expect(decoded._id).toBeDefined();
    });

    it('should not include password in JWT payload', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await Login(req, res);

      const token = res._cookies.access_token.value;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.password).toBeUndefined();
    });
  });

  describe('GoogleLogin', () => {
    it('should create new user and login for first-time Google user', async () => {
      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        avatar: 'google-avatar.jpg',
      };

      await GoogleLogin(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Login successful.');
      expect(res._jsonData.user.email).toBe('google@example.com');
      expect(res._jsonData.user.name).toBe('Google User');
      expect(res._jsonData.user.avatar).toBe('google-avatar.jpg');
      expect(res._jsonData.user.password).toBeUndefined();

      // Verify user was created in database
      const user = await User.findOne({ email: 'google@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Google User');
      expect(user.avatar).toBe('google-avatar.jpg');
      expect(user.password).toBeTruthy(); // Password should be hashed
    });

    it('should login existing Google user', async () => {
      // Create existing user
      const hashedPassword = bcryptjs.hashSync('random-password');
      await User.create({
        name: 'Existing Google User',
        email: 'google@example.com',
        password: hashedPassword,
        avatar: 'old-avatar.jpg',
      });

      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        avatar: 'new-avatar.jpg',
      };

      await GoogleLogin(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);

      // Verify user count (should still be 1, not duplicate)
      const userCount = await User.countDocuments({ email: 'google@example.com' });
      expect(userCount).toBe(1);
    });

    it('should normalize email to lowercase for Google login', async () => {
      req.body = {
        name: 'Google User',
        email: 'GOOGLE@EXAMPLE.COM',
        avatar: 'avatar.jpg',
      };

      await GoogleLogin(req, res, next);

      const user = await User.findOne({ email: 'google@example.com' });
      expect(user).toBeTruthy();
      expect(user.email).toBe('google@example.com');
    });

    it('should set JWT token in cookie', async () => {
      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        avatar: 'avatar.jpg',
      };

      await GoogleLogin(req, res, next);

      expect(res._cookies.access_token).toBeDefined();
      expect(res._cookies.access_token.value).toBeTruthy();
      
      // Verify it's a valid JWT
      const token = res._cookies.access_token.value;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.email).toBe('google@example.com');
    });
  });

  describe('Logout', () => {
    it('should clear cookie and logout successfully', async () => {
      await Logout(req, res, next);

      expect(res._clearedCookies.length).toBe(1);
      expect(res._clearedCookies[0].name).toBe('access_token');
      expect(res._clearedCookies[0].options.httpOnly).toBe(true);
      
      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Logout successful.');
    });

    it('should clear cookie with correct options', async () => {
      await Logout(req, res, next);

      const clearedCookie = res._clearedCookies[0];
      expect(clearedCookie.options).toMatchObject({
        httpOnly: true,
        path: '/',
      });
    });
  });
});
