import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'
import { generateOtp, createAndSendOtp, canResendOtp, resendOtp, verifyOtp } from '../../utils/Otp.js'
import OtpCode from '../../models/OtpCode.model.js'

describe('Otp Utils', () => {
  beforeAll(async () => {
    await connectTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
  })

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOtp()
      expect(otp).toHaveLength(6)
      expect(Number(otp)).toBeGreaterThanOrEqual(100000)
      expect(Number(otp)).toBeLessThanOrEqual(999999)
    })
  })

  describe('createAndSendOtp', () => {
    it('should throw error when email is missing', async () => {
      await expect(
        createAndSendOtp({ email: '', pendingUser: {}, sendEmailFn: jest.fn() })
      ).rejects.toThrow('Email is required')
    })

    it('should throw error when pendingUser is missing', async () => {
      await expect(
        createAndSendOtp({ email: 'test@test.com', pendingUser: null, sendEmailFn: jest.fn() })
      ).rejects.toThrow('Pending user payload is required')
    })

    it('should create OTP document when no existing OTP', async () => {
      const email = 'newuser@test.com'
      const pendingUser = { name: 'Test User', email, password: 'hashed' }
      const mockSendEmail = jest.fn()

      const result = await createAndSendOtp({ email, pendingUser, sendEmailFn: mockSendEmail })

      expect(result).toBeTruthy()
      expect(result.email).toBe(email)
      expect(result.code).toHaveLength(6)
      expect(result.pendingUser.name).toBe('Test User')
      expect(mockSendEmail).toHaveBeenCalledWith({
        email,
        code: result.code,
        expiresAt: result.expiresAt
      })
    })

    it('should update existing OTP document', async () => {
      const email = 'existing@test.com'
      const pendingUser1 = { name: 'User 1', email, password: 'pass1' }
      const pendingUser2 = { name: 'User 2', email, password: 'pass2' }

      await createAndSendOtp({ email, pendingUser: pendingUser1, sendEmailFn: jest.fn() })
      const result = await createAndSendOtp({ email, pendingUser: pendingUser2, sendEmailFn: jest.fn() })

      expect(result.pendingUser.name).toBe('User 2')
      
      const allDocs = await OtpCode.find({ email })
      expect(allDocs).toHaveLength(1)
    })

    it('should reset resendCount and attempts', async () => {
      const email = 'reset@test.com'
      const pendingUser = { name: 'Test', email, password: 'pass' }

      const doc = await OtpCode.create({
        email,
        code: '123456',
        expiresAt: new Date(Date.now() + 300000),
        lastSentAt: new Date(),
        resendCount: 5,
        attempts: 3,
        pendingUser: { name: 'Old', email }
      })

      const result = await createAndSendOtp({ email, pendingUser, sendEmailFn: jest.fn() })

      expect(result.resendCount).toBe(0)
      expect(result.attempts).toBe(0)
    })
  })

  describe('canResendOtp', () => {
    it('should return true when otpDoc is null', () => {
      expect(canResendOtp(null)).toBe(true)
    })

    it('should return true when enough time has passed', () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      const otpDoc = { lastSentAt: oldDate }
      expect(canResendOtp(otpDoc)).toBe(true)
    })

    it('should return false when not enough time has passed', () => {
      const recentDate = new Date(Date.now() - 1000) // 1 second ago
      const otpDoc = { lastSentAt: recentDate }
      expect(canResendOtp(otpDoc)).toBe(false)
    })
  })

  describe('resendOtp', () => {
    it('should throw OTP_NOT_FOUND when no OTP exists', async () => {
      try {
        await resendOtp({ email: 'nonexistent@test.com', sendEmailFn: jest.fn() })
        fail('Should have thrown error')
      } catch (err) {
        expect(err.code).toBe('OTP_NOT_FOUND')
        expect(err.message).toContain('No pending verification')
      }
    })

    it('should throw RESEND_TOO_SOON when trying to resend too quickly', async () => {
      const email = 'toosoon@test.com'
      const pendingUser = { name: 'Test', email, password: 'pass' }
      
      await createAndSendOtp({ email, pendingUser, sendEmailFn: jest.fn() })

      try {
        await resendOtp({ email, sendEmailFn: jest.fn() })
        fail('Should have thrown error')
      } catch (err) {
        expect(err.code).toBe('RESEND_TOO_SOON')
        expect(err.waitSeconds).toBeGreaterThan(0)
      }
    })

    it('should successfully resend OTP after interval', async () => {
      const email = 'resend@test.com'
      const pendingUser = { name: 'Test', email, password: 'pass' }
      
      const firstDoc = await createAndSendOtp({ email, pendingUser, sendEmailFn: jest.fn() })
      
      // Manually update lastSentAt to past
      await OtpCode.updateOne(
        { email },
        { lastSentAt: new Date(Date.now() - 10 * 60 * 1000) }
      )

      const mockSendEmail = jest.fn()
      const result = await resendOtp({ email, sendEmailFn: mockSendEmail })

      expect(result.code).not.toBe(firstDoc.code)
      expect(result.resendCount).toBe(1)
      expect(mockSendEmail).toHaveBeenCalled()
    })

    it('should increment resendCount correctly', async () => {
      const email = 'increment@test.com'
      const pendingUser = { name: 'Test', email, password: 'pass' }
      
      await createAndSendOtp({ email, pendingUser })
      await OtpCode.updateOne(
        { email },
        { lastSentAt: new Date(Date.now() - 10 * 60 * 1000) }
      )

      await resendOtp({ email })
      
      const doc = await OtpCode.findOne({ email })
      expect(doc.resendCount).toBe(1)
    })
  })

  describe('verifyOtp', () => {
    it('should throw OTP_NOT_FOUND when OTP does not exist', async () => {
      try {
        await verifyOtp({ email: 'notfound@test.com', code: '123456' })
        fail('Should have thrown error')
      } catch (err) {
        expect(err.code).toBe('OTP_NOT_FOUND')
      }
    })

    it('should throw OTP_EXPIRED when OTP is expired', async () => {
      const email = 'expired@test.com'
      await OtpCode.create({
        email,
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
        lastSentAt: new Date(),
        pendingUser: { name: 'Test', email }
      })

      try {
        await verifyOtp({ email, code: '123456' })
        fail('Should have thrown error')
      } catch (err) {
        expect(err.code).toBe('OTP_EXPIRED')
        
        const doc = await OtpCode.findOne({ email })
        expect(doc).toBeNull()
      }
    })

    it('should throw INVALID_OTP when code does not match', async () => {
      const email = 'invalid@test.com'
      const pendingUser = { name: 'Test', email, password: 'pass' }
      
      await createAndSendOtp({ email, pendingUser })

      try {
        await verifyOtp({ email, code: '000000' })
        fail('Should have thrown error')
      } catch (err) {
        expect(err.code).toBe('INVALID_OTP')
        
        const doc = await OtpCode.findOne({ email })
        expect(doc.attempts).toBe(1)
      }
    })

    it('should successfully verify correct OTP', async () => {
      const email = 'valid@test.com'
      const pendingUser = { name: 'Valid User', email, password: 'pass123' }
      
      const otpDoc = await createAndSendOtp({ email, pendingUser })
      const code = otpDoc.code
      
      const result = await verifyOtp({ email, code })

      expect(result).toBeTruthy()
      expect(result.name).toBe('Valid User')
      
      const doc = await OtpCode.findOne({ email })
      expect(doc).toBeNull()
    })
  })
})
