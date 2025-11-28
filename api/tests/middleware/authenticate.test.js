import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'

// Mock jwt before import
const mockJwtVerify = jest.fn()
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify
  }
}))

const { authenticate } = await import('../../middleware/authenticate.js')
const User = (await import('../../models/user.model.js')).default

describe('authenticate middleware', () => {
  let req, res, next

  beforeAll(async () => {
    await connectTestDB()
    process.env.JWT_SECRET = 'test-jwt-secret'
  })

  afterAll(async () => {
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    req = {
      cookies: {}
    }
    res = {}
    next = jest.fn()
    jest.clearAllMocks()
  })

  it('should call next with error when no token is provided', async () => {
    req.cookies.access_token = undefined

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Unauthorized.')
  })

  it('should call next with error when token is empty string', async () => {
    req.cookies.access_token = ''

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Unauthorized.')
  })

  it('should call next with error when user is not found', async () => {
    req.cookies.access_token = 'valid-token'
    mockJwtVerify.mockReturnValue({ _id: '507f1f77bcf86cd799439011' })

    await authenticate(req, res, next)

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET)
    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Unauthorized.')
  })

  it('should call next with error when user is blacklisted', async () => {
    req.cookies.access_token = 'valid-token'
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      role: 'user',
      avatar: 'avatar.jpg',
      isBlacklisted: true
    })

    mockJwtVerify.mockReturnValue({ _id: user._id.toString() })

    await authenticate(req, res, next)

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET)
    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('Account is blacklisted.')
  })

  it('should successfully authenticate and attach user to request', async () => {
    req.cookies.access_token = 'valid-token'
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      role: 'admin',
      avatar: 'avatar.jpg',
      isBlacklisted: false
    })

    mockJwtVerify.mockReturnValue({ _id: user._id.toString() })

    await authenticate(req, res, next)

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET)
    expect(req.user).toEqual({
      _id: user._id,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      avatar: 'avatar.jpg'
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('should handle JsonWebTokenError', async () => {
    req.cookies.access_token = 'invalid-token'
    const jwtError = new Error('Invalid token')
    jwtError.name = 'JsonWebTokenError'
    mockJwtVerify.mockImplementation(() => {
      throw jwtError
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Invalid or expired token.')
  })

  it('should handle TokenExpiredError', async () => {
    req.cookies.access_token = 'expired-token'
    const expiredError = new Error('Token expired')
    expiredError.name = 'TokenExpiredError'
    mockJwtVerify.mockImplementation(() => {
      throw expiredError
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Invalid or expired token.')
  })

  it('should handle generic errors', async () => {
    req.cookies.access_token = 'valid-token'
    const genericError = new Error('Database connection failed')
    mockJwtVerify.mockImplementation(() => {
      throw genericError
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('Database connection failed')
  })

  it('should handle errors without message property', async () => {
    req.cookies.access_token = 'valid-token'
    const errorWithoutMessage = {}
    mockJwtVerify.mockImplementation(() => {
      throw errorWithoutMessage
    })

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(500)
  })

  it('should successfully authenticate user with minimal data', async () => {
    req.cookies.access_token = 'valid-token'
    const user = await User.create({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'hashedpassword',
      role: 'user',
      avatar: null,
      isBlacklisted: false
    })

    mockJwtVerify.mockReturnValue({ _id: user._id.toString() })

    await authenticate(req, res, next)

    expect(req.user).toEqual({
      _id: user._id,
      name: 'Jane',
      email: 'jane@example.com',
      role: 'user',
      avatar: null
    })
    expect(next).toHaveBeenCalledWith()
  })
})
