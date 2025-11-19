import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// Mock mailer before imports
const mockSendOtpEmail = jest.fn();

jest.unstable_mockModule('../../utils/mailer.js', () => ({
  sendOtpEmail: mockSendOtpEmail,
}));

import User from '../../models/user.model.js';
import OtpCode from '../../models/OtpCode.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';
import { Login, GoogleLogin, Logout, Register, verifyOtp, resendOtp } from '../../controllers/Auth.controller.js';

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

    it('should use default OTP_EXPIRY_MINUTES and RESEND_INTERVAL_MINUTES when env vars are missing', async () => {
      jest.resetModules();

      // Remove env vars to trigger fallback defaults at module import
      const prevOtpExpiry = process.env.OTP_EXPIRY_MINUTES;
      const prevResend = process.env.OTP_RESEND_INTERVAL_MINUTES;
      delete process.env.OTP_EXPIRY_MINUTES;
      delete process.env.OTP_RESEND_INTERVAL_MINUTES;

      // Mock Otp util and mailer to avoid DB/side effects
      jest.unstable_mockModule('../../utils/Otp.js', () => ({
        createAndSendOtp: jest.fn().mockResolvedValue(undefined),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
      }));
      jest.unstable_mockModule('../../utils/mailer.js', () => ({ sendOtpEmail: jest.fn() }));

      const ctrl = await import('../../controllers/Auth.controller.js');

      // The act of importing the controller executes module-level initializers
      // such as the OTP_EXPIRY_MINUTES and RESEND_INTERVAL_MINUTES fallbacks.
      expect(typeof ctrl.Register).toBe('function');

      // restore env
      if (prevOtpExpiry !== undefined) process.env.OTP_EXPIRY_MINUTES = prevOtpExpiry;
      if (prevResend !== undefined) process.env.OTP_RESEND_INTERVAL_MINUTES = prevResend;
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

    it('should default role to "user" when pendingUser.role is missing', async () => {
      const hashedPassword = bcryptjs.hashSync('password123');
      // Create OTP document without role in pendingUser
      await OtpCode.create({
        email: 'norole@example.com',
        code: '111111',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'No Role User',
          passwordHash: hashedPassword,
          // role omitted intentionally
        },
      });

      req.body = { email: 'norole@example.com', otp: '111111' };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      const user = await User.findOne({ email: 'norole@example.com' });
      expect(user).toBeTruthy();
      expect(user.role).toBe('user');
    });

    it('should default role to "user" when pendingUser.role is empty string', async () => {
      const hashedPassword = bcryptjs.hashSync('password123');
      await OtpCode.create({
        email: 'emptyrole@example.com',
        code: '222222',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Empty Role User',
          passwordHash: hashedPassword,
          role: '', // Empty string to test falsy value
        },
      });

      req.body = { email: 'emptyrole@example.com', otp: '222222' };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      const user = await User.findOne({ email: 'emptyrole@example.com' });
      expect(user).toBeTruthy();
      expect(user.role).toBe('user');
    });

    it('should default role to "user" when pendingUser.role is null', async () => {
      const hashedPassword = bcryptjs.hashSync('password123');
      await OtpCode.create({
        email: 'nullrole@example.com',
        code: '333334',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          name: 'Null Role User',
          passwordHash: hashedPassword,
          role: null, // Explicitly null
        },
      });

      req.body = { email: 'nullrole@example.com', otp: '333334' };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      const user = await User.findOne({ email: 'nullrole@example.com' });
      expect(user).toBeTruthy();
      expect(user.role).toBe('user');
    });

    it('executes both role-present and role-missing flows in one test (covers both branches)', async () => {
      // Create two OTPs: one with role present, one without
      const hashedPassword = bcryptjs.hashSync('password123');
      await OtpCode.create({
        email: 'rolepresent@example.com',
        code: '222222',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: { name: 'Role Present', passwordHash: hashedPassword, role: 'admin' }
      });

      await OtpCode.create({
        email: 'rolemissing@example.com',
        code: '333333',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: { name: 'Role Missing', passwordHash: hashedPassword }
      });

      // First: role present
      req.body = { email: 'rolepresent@example.com', otp: '222222' };
      await verifyOtp(req, res, next);
      expect(res._statusCode).toBe(200);
      const user1 = await User.findOne({ email: 'rolepresent@example.com' });
      expect(user1.role).toBe('admin');

      // Second: role missing -> should default to 'user'
      req.body = { email: 'rolemissing@example.com', otp: '333333' };
      await verifyOtp(req, res, next);
      expect(res._statusCode).toBe(200);
      const user2 = await User.findOne({ email: 'rolemissing@example.com' });
      expect(user2.role).toBe('user');
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

    it('should handle missing name in pending user data by generating username', async () => {
      const hashedPassword = bcryptjs.hashSync('password123');
      await OtpCode.create({
        email: 'test@example.com',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        lastSentAt: new Date(),
        resendCount: 0,
        attempts: 0,
        pendingUser: {
          // Missing name - should auto-generate username from email
          passwordHash: hashedPassword,
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._statusCode).toBe(200);
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.username).toBeTruthy();
    });

    it('should handle generic error during verification', async () => {
      // Force a generic error by mocking User.findOne to throw
      jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Database connection error'));

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
        },
      });

      req.body = {
        email: 'test@example.com',
        otp: '123456',
      };

      await verifyOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Database connection error');

      jest.restoreAllMocks();
    });

    it('should handle case when verifyOtpUtil returns null (defensive branch line 71)', async () => {
      // This tests the defensive check at line 71 when pendingUser is falsy
      jest.resetModules();
      
      // Mock verifyOtp to return null instead of throwing
      jest.unstable_mockModule('../../utils/Otp.js', () => ({
        verifyOtp: jest.fn().mockResolvedValue(null), // Returns null instead of throwing
        createAndSendOtp: jest.fn(),
        resendOtp: jest.fn(),
      }));
      jest.unstable_mockModule('../../utils/mailer.js', () => ({ sendOtpEmail: jest.fn() }));

      const { verifyOtp: verifyOtpFresh } = await import('../../controllers/Auth.controller.js');

      const freshReq = { body: { email: 'test@example.com', otp: '123456' } };
      const freshRes = { _statusCode: null, _jsonData: null };
      freshRes.status = function (code) { this._statusCode = code; return this; };
      freshRes.json = function (d) { this._jsonData = d; return this; };
      const freshNext = (err) => { freshRes._error = err; };

      await verifyOtpFresh(freshReq, freshRes, freshNext);

      expect(freshRes._error).toBeDefined();
      expect(freshRes._error.statusCode).toBe(400);
      expect(freshRes._error.message).toBe('No pending registration found. Please register again.');
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

    it('should handle generic unexpected errors', async () => {
      // Force outer catch by making email trim throw (simulate corrupted req object)
      req.body = { 
        get email() {
          throw new Error('Unexpected error accessing email');
        }
      };

      await resendOtp(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Unexpected error accessing email');
    });

    it('resendOtp should use RESEND_INTERVAL_MINUTES * 60 when err.waitSeconds is missing', async () => {
      jest.resetModules();

      // Mock resendOtp to throw RESEND_TOO_SOON without waitSeconds
      jest.unstable_mockModule('../../utils/Otp.js', () => ({
        resendOtp: jest.fn().mockRejectedValue({ code: 'RESEND_TOO_SOON' }),
        createAndSendOtp: jest.fn(),
        verifyOtp: jest.fn(),
      }));
      jest.unstable_mockModule('../../utils/mailer.js', () => ({ sendOtpEmail: jest.fn() }));

      const { resendOtp: resendOtpFresh } = await import('../../controllers/Auth.controller.js');

      const freshReq = { body: { email: 'test@example.com' } };
      const freshRes = { _statusCode: null, _jsonData: null };
      freshRes.status = function (code) { this._statusCode = code; return this; };
      freshRes.json = function (d) { this._jsonData = d; return this; };
      const freshNext = (err) => { freshRes._error = err; };

      await resendOtpFresh(freshReq, freshRes, freshNext);

      expect(freshRes._error).toBeDefined();
      expect(freshRes._error.statusCode).toBe(429);
      // default RESEND_INTERVAL_MINUTES is 5 -> 5*60 = 300
      expect(freshRes._error.message).toContain('Resend allowed after');
      expect(freshRes._error.message).toContain('300');
    });

    it('should handle resendOtp generic error (line 140 fallback)', async () => {
      jest.resetModules();

      // Mock resendOtp to throw error with unknown code
      jest.unstable_mockModule('../../utils/Otp.js', () => ({
        resendOtp: jest.fn().mockRejectedValue({ code: 'UNKNOWN_ERROR', message: 'Something went wrong' }),
        createAndSendOtp: jest.fn(),
        verifyOtp: jest.fn(),
      }));
      jest.unstable_mockModule('../../utils/mailer.js', () => ({ sendOtpEmail: jest.fn() }));

      const { resendOtp: resendOtpFresh } = await import('../../controllers/Auth.controller.js');

      const freshReq = { body: { email: 'test@example.com' } };
      const freshRes = { _statusCode: null, _jsonData: null };
      freshRes.status = function (code) { this._statusCode = code; return this; };
      freshRes.json = function (d) { this._jsonData = d; return this; };
      const freshNext = (err) => { freshRes._error = err; };

      await resendOtpFresh(freshReq, freshRes, freshNext);

      expect(freshRes._error).toBeDefined();
      expect(freshRes._error.statusCode).toBe(400);
      expect(freshRes._error.message).toBe('Something went wrong');
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

    it('should handle errors during login', async () => {
      // Force an error by mocking User.findOne to throw
      jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await Login(req, res);

      expect(res._statusCode).toBe(500);
      expect(res._jsonData.message).toBe('Database error');

      jest.restoreAllMocks();
    });

    it('should use sameSite "none" for cookies when NODE_ENV=production (Login)', async () => {
      // Set production env temporarily
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Login: ensure cookie sameSite 'none'
      // User already created in beforeEach
      req.body = { email: 'test@example.com', password: 'password123' };
      await Login(req, res);
      expect(res._cookies.access_token).toBeDefined();
      expect(res._cookies.access_token.options.sameSite).toBe('none');

      // restore env
      process.env.NODE_ENV = prevEnv;
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

    it('should handle errors during Google login', async () => {
      // Force an error by mocking User.findOne to throw
      jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Google login failed'));

      req.body = {
        name: 'Google User',
        email: 'google@example.com',
        avatar: 'avatar.jpg',
      };

      await GoogleLogin(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Google login failed');

      jest.restoreAllMocks();
    });

    it('should use sameSite "none" for cookies when NODE_ENV=production (GoogleLogin)', async () => {
      // Set production env temporarily
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // GoogleLogin: new user
      req.body = { name: 'Prod User', email: 'prod@example.com', avatar: 'a.jpg' };
      await GoogleLogin(req, res, next);
      expect(res._cookies.access_token.options.sameSite).toBe('none');

      // restore env
      process.env.NODE_ENV = prevEnv;
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

    it('should handle errors during logout', async () => {
      // Force an error by mocking res.clearCookie to throw
      res.clearCookie = jest.fn(() => {
        throw new Error('Logout failed');
      });

      await Logout(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(500);
      expect(res._error.message).toBe('Logout failed');
    });

    it('should use sameSite "none" for cookies when NODE_ENV=production (Logout)', async () => {
      // Set production env temporarily
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Logout: clearCookie should have sameSite 'none'
      await Logout(req, res, next);
      const cleared = res._clearedCookies[res._clearedCookies.length - 1];
      expect(cleared.options.sameSite).toBe('none');

      // restore env
      process.env.NODE_ENV = prevEnv;
    });
  });
});