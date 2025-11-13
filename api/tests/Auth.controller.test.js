import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// Mock mailer before imports
const mockSendOtpEmail = jest.fn();

jest.unstable_mockModule('../utils/mailer.js', () => ({
  sendOtpEmail: mockSendOtpEmail,
}));

import User from '../models/user.model.js';
import OtpCode from '../models/OtpCode.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { Login, GoogleLogin, Logout, Register, verifyOtp, resendOtp } from '../controllers/Auth.controller.js';

describe('Auth Controller Tests', () => {
  let req, res, next;

  beforeAll(async () => {
    await connectTestDB();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
    process.env.OTP_EXPIRY_MINUTES = '5';
    process.env.OTP_RESEND_INTERVAL_MINUTES = '5';
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

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

  describe('Register', () => {
    it('should create OTP and send email for new user registration', async () => {
      mockSendOtpEmail.mockResolvedValue();

      req.body = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      await Register(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('OTP sent to your email for verification.');
      expect(res._jsonData.data.email).toBe('newuser@example.com');
      expect(res._jsonData.data.otpExpiryMinutes).toBe(5);

      // Verify OTP was created in database
      const otpDoc = await OtpCode.findOne({ email: 'newuser@example.com' });
      expect(otpDoc).toBeTruthy();
      expect(otpDoc.pendingUser.name).toBe('New User');
      expect(otpDoc.pendingUser.role).toBe('user');
    });

    it('should require name, email, and password', async () => {
      req.body = {
        email: 'test@example.com',
      };

      await Register(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Name, email and password are required.');
    });

    it('should normalize email to lowercase', async () => {
      mockSendOtpEmail.mockResolvedValue();

      req.body = {
        name: 'User',
        email: 'USER@EXAMPLE.COM',
        password: 'password123',
      };

      await Register(req, res, next);

      // Check OTP was created with normalized email
      const otpDoc = await OtpCode.findOne({ email: 'user@example.com' });
      expect(otpDoc).toBeTruthy();
      expect(otpDoc.email).toBe('user@example.com');
    });

    it('should reject registration if user already exists', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: bcryptjs.hashSync('password123'),
      });

      req.body = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };

      await Register(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(409);
      expect(res._error.message).toBe('User already registered.');
    });

    it('should hash password before storing', async () => {
      mockSendOtpEmail.mockResolvedValue();

      req.body = {
        name: 'User',
        email: 'user@example.com',
        password: 'plainpassword',
      };

      await Register(req, res, next);

      const otpDoc = await OtpCode.findOne({ email: 'user@example.com' });
      expect(otpDoc.pendingUser.passwordHash).toBeDefined();
      expect(otpDoc.pendingUser.passwordHash).not.toBe('plainpassword');
      expect(bcryptjs.compareSync('plainpassword', otpDoc.pendingUser.passwordHash)).toBe(true);
    });

    it('should handle errors during OTP creation', async () => {
      // Create invalid data to cause an error
      jest.spyOn(OtpCode.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));

      req.body = {
        name: 'User',
        email: 'user@example.com',
        password: 'password123',
      };

      await Register(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Database error');

      jest.restoreAllMocks();
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and create user successfully', async () => {
      const hashedPassword = bcryptjs.hashSync('password123');
      
      // Create OTP document
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: hashedPassword,
          role: 'user',
          avatar: 'avatar.jpg',
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Email verified. Registration complete.');

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.avatar).toBe('avatar.jpg');

      // OTP should be deleted after verification
      const otpDoc = await OtpCode.findOne({ email: 'test@example.com' });
      expect(otpDoc).toBeNull();
    });

    it('should require email and OTP', async () => {
      req.body = {
        email: 'test@example.com',
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Email and OTP are required.');
    });

    it('should handle expired OTP', async () => {
      // Create expired OTP
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 minutes ago
        lastSentAt: new Date(Date.now() - 10 * 60 * 1000),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toContain('OTP expired');
    });

    it('should handle invalid OTP', async () => {
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '999999', // Wrong OTP
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toContain('Invalid OTP');
    });

    it('should handle OTP not found', async () => {
      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toContain('OTP not found');
    });

    it('should handle already verified email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: bcryptjs.hashSync('password123'),
      });

      // Create OTP for already registered user
      await OtpCode.create({
        email: 'existing@example.com',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'existing@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.message).toBe('Email already verified. Please sign in.');
    });

    it('should handle incomplete pending user data', async () => {
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          // Missing passwordHash
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Pending registration data is incomplete. Please register again.');
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      mockSendOtpEmail.mockResolvedValue();

      // Create OTP with old lastSentAt (6 minutes ago, past the 5-minute interval)
      const oldLastSentAt = new Date(Date.now() - 6 * 60 * 1000);
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: oldLastSentAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: oldLastSentAt,
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'test@example.com',
      };

      await resendOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('OTP resent successfully.');
      expect(res._jsonData.data.resendCount).toBe(1);
    });

    it('should require email', async () => {
      req.body = {};

      await resendOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Email is required.');
    });

    it('should handle resend too soon error', async () => {
      mockSendOtpEmail.mockResolvedValue();

      // Create OTP with recent lastSentAt (1 minute ago, within 5-minute interval)
      const recentLastSentAt = new Date(Date.now() - 1 * 60 * 1000);
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: recentLastSentAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: recentLastSentAt,
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'test@example.com',
      };

      await resendOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(429);
      expect(res._error.message).toContain('second(s)');
    });

    it('should handle OTP not found during resend', async () => {
      req.body = {
        email: 'nonexistent@example.com',
      };

      await resendOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
      expect(res._error.message).toContain('No pending verification found');
    });

    it('should normalize email during resend', async () => {
      mockSendOtpEmail.mockResolvedValue();

      const oldLastSentAt = new Date(Date.now() - 6 * 60 * 1000);
      await OtpCode.create({
        email: 'test@example.com', // Store in lowercase
        code: '123456',
        createdAt: oldLastSentAt,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: oldLastSentAt,
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Test User',
          passwordHash: bcryptjs.hashSync('password123'),
          role: 'user',
        },
      });

      req.body = {
        email: 'TEST@EXAMPLE.COM',
      };

      await resendOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.data.resendCount).toBe(1);
    });
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
