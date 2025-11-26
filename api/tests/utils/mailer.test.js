import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock nodemailer before importing mailer
const mockSendMail = jest.fn()
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail
}))

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport
  }
}))

// Mock dotenv
jest.unstable_mockModule('dotenv', () => ({
  default: {
    config: jest.fn()
  }
}))

const { sendOtpEmail, sendPasswordResetEmail } = await import('../../utils/mailer.js')

describe('Mailer Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendOtpEmail', () => {
    it('should send email with correct parameters', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' })

      const to = 'test@example.com'
      const code = '123456'
      const expiresAt = new Date()

      await sendOtpEmail({ to, code, expiresAt })

      expect(mockSendMail).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: expect.stringContaining('verification'),
          html: expect.stringContaining(code)
        })
      )
    })

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Error'))

      await expect(
        sendOtpEmail({ to: 'fail@test.com', code: '123456', expiresAt: new Date() })
      ).rejects.toThrow('SMTP Error')
    })

    it('should validate mailer module loads correctly', () => {
      // The mailer module loads and creates transporter on import
      // This test validates the module can be imported and used
      expect(typeof sendOtpEmail).toBe('function')
    })

    it('should replace verification code in template', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' })

      const code = '999888'
      await sendOtpEmail({ to: 'template@test.com', code, expiresAt: new Date() })

      const callArgs = mockSendMail.mock.calls[0][0]
      expect(callArgs.html).toContain(code)
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'reset-id' })

      const to = 'reset@example.com'
      const code = '654321'

      await sendPasswordResetEmail({ to, code })

      expect(mockSendMail).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: expect.stringContaining('Password reset'),
          html: expect.stringContaining(code)
        })
      )
    })

    it('should handle password reset email sending errors', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Connection Failed'))

      await expect(
        sendPasswordResetEmail({ to: 'fail@test.com', code: '111222' })
      ).rejects.toThrow('SMTP Connection Failed')
    })

    it('should replace verification code in password reset template', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'reset-id' })

      const code = '777888'
      await sendPasswordResetEmail({ to: 'reset@test.com', code })

      const callArgs = mockSendMail.mock.calls[0][0]
      expect(callArgs.html).toContain(code)
      expect(callArgs.subject).toContain('Password reset')
    })
  })
})
