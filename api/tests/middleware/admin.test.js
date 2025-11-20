import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Import the admin middleware
const adminMiddleware = (await import('../../middleware/admin.js')).default

describe('admin middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', () => {
    req.user = undefined

    adminMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when user is null', () => {
    req.user = null

    adminMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 when user is not an admin', () => {
    req.user = {
      _id: 'user123',
      role: 'user'
    }

    adminMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 when user role is empty string', () => {
    req.user = {
      _id: 'user123',
      role: ''
    }

    adminMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 when user role is undefined', () => {
    req.user = {
      _id: 'user123'
    }

    adminMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next when user is an admin', () => {
    req.user = {
      _id: 'admin123',
      role: 'admin'
    }

    adminMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('should call next when user is an admin with additional properties', () => {
    req.user = {
      _id: 'admin123',
      role: 'admin',
      name: 'Admin User',
      email: 'admin@example.com'
    }

    adminMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
