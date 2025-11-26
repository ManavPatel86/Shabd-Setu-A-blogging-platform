import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import VerificationToken from '../../models/verificationToken.model.js'

const {
  createVerificationCode,
  resendVerificationCode,
  verifyCodeForPurpose,
  deleteVerificationCodes,
  VERIFICATION_PURPOSES
} = await import('../../utils/verificationToken.js')

describe('VerificationToken Utils', () => {
  let mongoServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await VerificationToken.deleteMany({})
  })

  describe('createVerificationCode', () => {
    it('should create verification code with all parameters', async () => {
      const userId = new mongoose.Types.ObjectId()
      const result = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        ttlMinutes: 10
      })

      expect(result.code).toHaveLength(6)
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should save token to database', async () => {
      const userId = new mongoose.Types.ObjectId()
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const token = await VerificationToken.findOne({ userId })
      expect(token).toBeTruthy()
      expect(token.email).toBe('test@example.com')
      expect(token.purpose).toBe(VERIFICATION_PURPOSES.PASSWORD_RESET)
    })

    it('should use default 10 minutes expiry', async () => {
      const userId = new mongoose.Types.ObjectId()
      const result = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const expectedExpiry = new Date(Date.now() + 10 * 60 * 1000)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(5000)
    })

    it('should throw error for missing email', async () => {
      const userId = new mongoose.Types.ObjectId()
      await expect(
        createVerificationCode({
          userId,
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow('Email is required')
    })

    it('should throw error for missing purpose', async () => {
      const userId = new mongoose.Types.ObjectId()
      await expect(
        createVerificationCode({
          userId,
          email: 'test@example.com'
        })
      ).rejects.toThrow('Purpose is required')
    })

    it('should replace existing token for same email and purpose', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      const first = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const second = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(first.code).not.toBe(second.code)
      
      const tokens = await VerificationToken.find({ email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      expect(tokens).toHaveLength(1)
      expect(tokens[0].code).toBe(second.code)
    })

    it('should use custom expiry minutes', async () => {
      const userId = new mongoose.Types.ObjectId()
      const result = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        ttlMinutes: 30
      })

      const expectedExpiry = new Date(Date.now() + 30 * 60 * 1000)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(5000)
    })

    it('should use custom code length', async () => {
      const userId = new mongoose.Types.ObjectId()
      const result = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        codeLength: 8
      })

      expect(result.code).toHaveLength(8)
      expect(/^\d+$/.test(result.code)).toBe(true)
    })

    it('should store meta data', async () => {
      const userId = new mongoose.Types.ObjectId()
      const meta = { ip: '127.0.0.1', userAgent: 'test' }
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        meta
      })

      const token = await VerificationToken.findOne({ email: 'test@example.com' })
      expect(token.meta).toEqual(meta)
    })

    it('should lowercase email', async () => {
      const userId = new mongoose.Types.ObjectId()
      await createVerificationCode({
        userId,
        email: 'Test@Example.COM',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const token = await VerificationToken.findOne({ email: 'test@example.com' })
      expect(token).toBeTruthy()
    })
  })

  describe('resendVerificationCode', () => {
    it('should throw error if resend too soon', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await expect(
        resendVerificationCode({
          email: 'test@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow()

      try {
        await resendVerificationCode({
          email: 'test@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('RESEND_TOO_SOON')
        expect(err.waitSeconds).toBeDefined()
      }
    })

    it('should throw error if no existing token found', async () => {
      await expect(
        resendVerificationCode({
          email: 'notfound@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow('No reset request found')

      try {
        await resendVerificationCode({
          email: 'notfound@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('VERIFICATION_NOT_FOUND')
      }
    })

    it('should throw error for missing parameters', async () => {
      await expect(
        resendVerificationCode({
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow()

      try {
        await resendVerificationCode({
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('VERIFICATION_ARGS_MISSING')
      }
    })

    it('should resend after manual time update', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      const first = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      // Manually update lastSentAt to bypass waiting period
      await VerificationToken.updateOne(
        { email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET },
        { lastSentAt: new Date(Date.now() - 3 * 60 * 1000) }
      )

      const result = await resendVerificationCode({
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result.code).not.toBe(first.code)
      expect(result.code).toHaveLength(6)
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should increment resend count', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await VerificationToken.updateOne(
        { email: 'test@example.com' },
        { lastSentAt: new Date(Date.now() - 3 * 60 * 1000) }
      )

      await resendVerificationCode({
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const token = await VerificationToken.findOne({ email: 'test@example.com' })
      expect(token.resendCount).toBeGreaterThan(0)
    })

    it('should use custom TTL on resend', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await VerificationToken.updateOne(
        { email: 'test@example.com' },
        { lastSentAt: new Date(Date.now() - 3 * 60 * 1000) }
      )

      const result = await resendVerificationCode({
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        ttlMinutes: 20
      })

      const expectedExpiry = new Date(Date.now() + 20 * 60 * 1000)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(5000)
    })
  })

  describe('verifyCodeForPurpose', () => {
    it('should verify valid code', async () => {
      const userId = new mongoose.Types.ObjectId()
      const { code } = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const result = await verifyCodeForPurpose({
        email: 'test@example.com',
        code,
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result).toBeTruthy()
      expect(result.email).toBe('test@example.com')
    })

    it('should throw error for missing parameters', async () => {
      await expect(
        verifyCodeForPurpose({
          code: '123456',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow()

      try {
        await verifyCodeForPurpose({
          code: '123456',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('VERIFICATION_ARGS_MISSING')
      }
    })

    it('should throw error for non-existent token', async () => {
      await expect(
        verifyCodeForPurpose({
          email: 'notfound@example.com',
          code: '123456',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow('not found')

      try {
        await verifyCodeForPurpose({
          email: 'notfound@example.com',
          code: '123456',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('VERIFICATION_NOT_FOUND')
      }
    })

    it('should throw error for expired code and delete it', async () => {
      const userId = new mongoose.Types.ObjectId()
      const { code } = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      // Force expiration
      await VerificationToken.updateOne(
        { email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET },
        { expiresAt: new Date(Date.now() - 1000) }
      )

      try {
        await verifyCodeForPurpose({
          email: 'test@example.com',
          code,
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (err) {
        expect(err.message).toContain('expired')
        expect(err.code).toBe('VERIFICATION_EXPIRED')
      }

      // Verify token was deleted after expiration check
      const token = await VerificationToken.findOne({ email: 'test@example.com' })
      expect(token).toBeNull()
    })

    it('should throw error for invalid code', async () => {
      const userId = new mongoose.Types.ObjectId()
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await expect(
        verifyCodeForPurpose({
          email: 'test@example.com',
          code: '999999',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ).rejects.toThrow('Invalid')

      try {
        await verifyCodeForPurpose({
          email: 'test@example.com',
          code: '999999',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('VERIFICATION_INVALID')
      }
    })

    it('should delete token after successful verification', async () => {
      const userId = new mongoose.Types.ObjectId()
      const { code } = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await verifyCodeForPurpose({
        email: 'test@example.com',
        code,
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const token = await VerificationToken.findOne({ email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      expect(token).toBeNull()
    })

    it('should not delete token on failed verification', async () => {
      const userId = new mongoose.Types.ObjectId()
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      try {
        await verifyCodeForPurpose({
          email: 'test@example.com',
          code: '999999',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        // Expected to fail
      }

      const token = await VerificationToken.findOne({ email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      expect(token).toBeTruthy()
    })

    it('should trim code before comparison', async () => {
      const userId = new mongoose.Types.ObjectId()
      const { code } = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      const result = await verifyCodeForPurpose({
        email: 'test@example.com',
        code: `  ${code}  `,
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result).toBeTruthy()
    })
  })

  describe('deleteVerificationCodes', () => {
    it('should delete codes for specific purpose', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await deleteVerificationCodes({ 
        email: 'test@example.com', 
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET 
      })

      const token = await VerificationToken.findOne({ email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      expect(token).toBeNull()
    })

    it('should not affect other users codes', async () => {
      const userId1 = new mongoose.Types.ObjectId()
      const userId2 = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId: userId1,
        email: 'user1@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await createVerificationCode({
        userId: userId2,
        email: 'user2@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      await deleteVerificationCodes({ 
        email: 'user1@example.com', 
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET 
      })

      const user1Token = await VerificationToken.findOne({ email: 'user1@example.com' })
      const user2Token = await VerificationToken.findOne({ email: 'user2@example.com' })

      expect(user1Token).toBeNull()
      expect(user2Token).toBeTruthy()
    })

    it('should handle deleting non-existent codes gracefully', async () => {
      await expect(
        deleteVerificationCodes({ 
          email: 'notfound@example.com', 
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET 
        })
      ).resolves.not.toThrow()
    })

    it('should handle missing parameters gracefully', async () => {
      await expect(
        deleteVerificationCodes({ purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      ).resolves.not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete verification flow', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      // Create code
      const { code } = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      // Verify code
      const result = await verifyCodeForPurpose({
        email: 'test@example.com',
        code,
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result).toBeTruthy()

      // Token should be deleted
      const token = await VerificationToken.findOne({ email: 'test@example.com' })
      expect(token).toBeNull()
    })

    it('should handle resend flow with wait period', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      // Try immediate resend (should fail)
      try {
        await resendVerificationCode({
          email: 'test@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      } catch (err) {
        expect(err.code).toBe('RESEND_TOO_SOON')
      }

      // Force time passage
      await VerificationToken.updateOne(
        { email: 'test@example.com' },
        { lastSentAt: new Date(Date.now() - 3 * 60 * 1000) }
      )

      // Try resend again (should succeed)
      const result = await resendVerificationCode({
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result.code).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very short expiry time', async () => {
      const userId = new mongoose.Types.ObjectId()
      const result = await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        ttlMinutes: 1
      })

      const timeDiff = result.expiresAt.getTime() - Date.now()
      expect(timeDiff).toBeLessThanOrEqual(60 * 1000)
      expect(timeDiff).toBeGreaterThan(0)
    })

    it('should handle concurrent token creation', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      const promises = [
        createVerificationCode({
          userId,
          email: 'test@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        }),
        createVerificationCode({
          userId,
          email: 'test@example.com',
          purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
        })
      ]

      await Promise.all(promises)

      const tokens = await VerificationToken.find({ email: 'test@example.com', purpose: VERIFICATION_PURPOSES.PASSWORD_RESET })
      expect(tokens.length).toBeGreaterThan(0)
    })

    it('should handle different code lengths', async () => {
      const userId = new mongoose.Types.ObjectId()
      
      const result4 = await createVerificationCode({
        userId,
        email: 'test1@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        codeLength: 4
      })
      expect(result4.code).toHaveLength(4)

      const result8 = await createVerificationCode({
        userId,
        email: 'test2@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
        codeLength: 8
      })
      expect(result8.code).toHaveLength(8)
    })

    it('generateNumericCode default and custom length works', async () => {
      const mod = await import('../../utils/verificationToken.js')
      const { generateNumericCode } = mod

      const defaultCode = generateNumericCode()
      expect(defaultCode).toHaveLength(6)
      expect(/^[0-9]+$/.test(defaultCode)).toBe(true)

      const fourDigit = generateNumericCode(4)
      expect(fourDigit).toHaveLength(4)
      expect(/^[0-9]+$/.test(fourDigit)).toBe(true)
    })

    it('resend should work when lastSentAt is missing (null branch)', async () => {
      const userId = new mongoose.Types.ObjectId()

      await createVerificationCode({
        userId,
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      // remove lastSentAt to trigger null path
      await VerificationToken.updateOne(
        { email: 'test@example.com' },
        { $unset: { lastSentAt: '' }, $set: { resendCount: 0 } }
      )

      const result = await resendVerificationCode({
        email: 'test@example.com',
        purpose: VERIFICATION_PURPOSES.PASSWORD_RESET
      })

      expect(result.code).toBeDefined()
      expect(result.record.resendCount).toBeGreaterThanOrEqual(1)
    })
  })
})
