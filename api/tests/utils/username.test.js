import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../../models/user.model.js'

const {
  normalizeUsername,
  isValidUsername,
  generateUniqueUsername,
  ensureUserHasUsername
} = await import('../../utils/username.js')

// Also import the module as an object in tests when we need to spy on exports
const usernameModule = await import('../../utils/username.js')

describe('Username Utils', () => {
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
    await User.deleteMany({})
  })

  describe('normalizeUsername', () => {
    it('should convert to lowercase', () => {
      expect(normalizeUsername('TestUser')).toBe('testuser')
      expect(normalizeUsername('UPPERCASE')).toBe('uppercase')
    })

    it('should trim whitespace', () => {
      expect(normalizeUsername('  test  ')).toBe('test')
      expect(normalizeUsername(' username ')).toBe('username')
    })

    it('should handle empty string', () => {
      expect(normalizeUsername('')).toBe('')
      expect(normalizeUsername('   ')).toBe('')
    })

    it('should preserve underscores and numbers', () => {
      expect(normalizeUsername('test_user_123')).toBe('test_user_123')
      expect(normalizeUsername('USER123')).toBe('user123')
    })

    it('should handle undefined', () => {
      expect(normalizeUsername()).toBe('')
      expect(normalizeUsername(undefined)).toBe('')
    })
  })

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('testuser')).toBe(true)
      expect(isValidUsername('user123')).toBe(true)
      expect(isValidUsername('test_user')).toBe(true)
      expect(isValidUsername('abc')).toBe(true)
      expect(isValidUsername('a1234567890123456789')).toBe(true) // 20 chars
    })

    it('should reject usernames starting with number', () => {
      expect(isValidUsername('123user')).toBe(false)
      expect(isValidUsername('1test')).toBe(false)
    })

    it('should reject usernames starting with underscore', () => {
      expect(isValidUsername('_user')).toBe(false)
      expect(isValidUsername('_test123')).toBe(false)
    })

    it('should reject too short usernames', () => {
      expect(isValidUsername('ab')).toBe(false)
      expect(isValidUsername('a')).toBe(false)
      expect(isValidUsername('')).toBe(false)
    })

    it('should reject too long usernames', () => {
      expect(isValidUsername('a12345678901234567890')).toBe(false) // 21 chars
      expect(isValidUsername('verylongusernamethatexceedslimit')).toBe(false)
    })

    it('should reject uppercase characters', () => {
      expect(isValidUsername('TestUser')).toBe(false)
      expect(isValidUsername('USER')).toBe(false)
    })

    it('should reject special characters', () => {
      expect(isValidUsername('test@user')).toBe(false)
      expect(isValidUsername('user.name')).toBe(false)
      expect(isValidUsername('test-user')).toBe(false)
      expect(isValidUsername('user#123')).toBe(false)
    })

    it('should handle undefined and empty', () => {
      expect(isValidUsername()).toBe(false)
      expect(isValidUsername(undefined)).toBe(false)
      expect(isValidUsername('')).toBe(false)
    })
  })

  describe('generateUniqueUsername', () => {
    it('should generate username from seed', async () => {
      const username = await generateUniqueUsername('testuser')
      expect(username).toBe('testuser')
      expect(isValidUsername(username)).toBe(true)
    })

    it('should add suffix if username exists', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
        fullName: 'Test User'
      })

      const username = await generateUniqueUsername('testuser')
      expect(username).toMatch(/^testuser\d+$/)
      expect(username).not.toBe('testuser')
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle multiple collisions', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
        fullName: 'Test User 1'
      })
      await User.create({
        username: 'testuser1',
        email: 'test2@example.com',
        password: 'password123',
        fullName: 'Test User 2'
      })

      const username = await generateUniqueUsername('testuser')
      expect(username).toMatch(/^testuser\d+$/)
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle seed starting with number', async () => {
      const username = await generateUniqueUsername('123user')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toMatch(/^user/)
    })

    it('should handle seed starting with underscore', async () => {
      const username = await generateUniqueUsername('_testuser')
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle empty seed', async () => {
      const username = await generateUniqueUsername('')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toMatch(/^user/)
    })

    it('should handle seed with special characters', async () => {
      const username = await generateUniqueUsername('test@user#123')
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle seed with only special characters', async () => {
      const username = await generateUniqueUsername('@#$%')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toMatch(/^user/)
    })

    it('should truncate long seeds', async () => {
      const longSeed = 'verylongusernamethatexceedsthelimit'
      const username = await generateUniqueUsername(longSeed)
      expect(username.length).toBeLessThanOrEqual(20)
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle seed with spaces', async () => {
      const username = await generateUniqueUsername('test user name')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toBe('testusername')
    })

    it('should preserve valid parts of seed', async () => {
      const username = await generateUniqueUsername('john123_doe')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toContain('john123')
    })
  })

  describe('ensureUserHasUsername', () => {
    it('should not modify user with valid username', async () => {
      const user = new User({
        username: 'validuser',
        email: 'valid@example.com',
        password: 'password123',
        fullName: 'Valid User'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).toBe('validuser')
    })

    it('should generate username if missing', async () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123',
        fullName: 'John Doe'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).toBeDefined()
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should use provided seed', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })

      const result = await ensureUserHasUsername(user, 'customseed')
      expect(result.username).toBeDefined()
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should handle invalid existing username', async () => {
      const user = new User({
        username: '123invalid',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).not.toBe('123invalid')
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should handle empty username', async () => {
      const user = new User({
        username: '',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).not.toBe('')
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should return null for null user', async () => {
      const result = await ensureUserHasUsername(null)
      expect(result).toBeNull()
    })

    it('should use fullName as fallback', async () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123',
        fullName: 'John Doe'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).toBeDefined()
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should use email as fallback if name missing', async () => {
      const user = new User({
        email: 'testuser@example.com',
        password: 'password123'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).toBeDefined()
      expect(isValidUsername(result.username)).toBe(true)
    })

    it('should handle username collision during generation', async () => {
      await User.create({
        username: 'johndoe',
        email: 'john1@example.com',
        password: 'password123',
        fullName: 'John Doe 1'
      })

      const user = new User({
        email: 'john2@example.com',
        password: 'password123',
        fullName: 'John Doe'
      })

      const result = await ensureUserHasUsername(user)
      expect(result.username).not.toBe('johndoe')
      expect(isValidUsername(result.username)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle usernames with maximum suffix length', async () => {
      const baseUsername = 'user'
      for (let i = 0; i < 5; i++) {
        await User.create({
          username: i === 0 ? baseUsername : `${baseUsername}${i}`,
          email: `user${i}@example.com`,
          password: 'password123',
          fullName: `User ${i}`
        })
      }

      const username = await generateUniqueUsername(baseUsername)
      expect(isValidUsername(username)).toBe(true)
      expect(username.length).toBeLessThanOrEqual(20)
    })

    it('should handle concurrent username generation', async () => {
      const promises = [
        generateUniqueUsername('concurrent'),
        generateUniqueUsername('concurrent'),
        generateUniqueUsername('concurrent')
      ]

      const usernames = await Promise.all(promises)
      
      // All should be valid
      usernames.forEach(username => {
        expect(isValidUsername(username)).toBe(true)
      })
    })

    it('should handle very long suffix numbers', async () => {
      const baseUsername = 'usr'
      for (let i = 0; i < 100; i++) {
        await User.create({
          username: i === 0 ? baseUsername : `${baseUsername}${i}`,
          email: `u${i}@example.com`,
          password: 'password123',
          fullName: `U ${i}`
        })
      }

      const username = await generateUniqueUsername(baseUsername)
      expect(isValidUsername(username)).toBe(true)
      expect(username.length).toBeLessThanOrEqual(20)
    })

    it('should handle unicode in seed', async () => {
      const username = await generateUniqueUsername('üser')
      expect(isValidUsername(username)).toBe(true)
    })

    it('should handle mixed case in seed', async () => {
      const username = await generateUniqueUsername('TestUser123')
      expect(isValidUsername(username)).toBe(true)
      expect(username).toBe('testuser123')
    })

    it('should call buildUsernameBase default arg when no seed provided', async () => {
      // call the module directly without any args to ensure default arg branch is covered
      const base = usernameModule.buildUsernameBase()
      expect(base).toBeDefined()
      expect(base).toMatch(/^user/) // random user fallback should start with 'user'
      expect(base.length).toBeGreaterThanOrEqual(3)
    })

    it('should generate username when no seed is provided (default argument)', async () => {
      const username = await generateUniqueUsername()
      expect(isValidUsername(username)).toBe(true)
      expect(username).toMatch(/^user/)
    })

    it('should handle very long base with suffix that exceeds 20 chars', async () => {
      // Create a scenario where base + suffix would be too long
      // The generateUniqueUsername function trims the base to ensure total length <= 20
      const longSeed = 'verylongusername'
      const existsSpy = jest.spyOn(User, 'exists')
        .mockResolvedValueOnce(true)  // First candidate exists
        .mockResolvedValue(false)     // Second with suffix doesn't

      const username = await generateUniqueUsername(longSeed)
      expect(username.length).toBeLessThanOrEqual(20)
      expect(isValidUsername(username)).toBe(true)

      existsSpy.mockRestore()
    })

    it('should add suffix when candidate exists (mock exists)', async () => {
      const existsSpy = jest.spyOn(User, 'exists').mockResolvedValueOnce(true).mockResolvedValue(false)

      const username = await generateUniqueUsername('collisionseed')
      expect(username).toMatch(/\d+$/)
      expect(isValidUsername(username)).toBe(true)

      existsSpy.mockRestore()
    })

    it('should fallback to _id when name and email missing', async () => {
      const userDoc = {
        _id: new mongoose.Types.ObjectId(),
        username: undefined,
        save: jest.fn(async function () { return this })
      }

      const result = await ensureUserHasUsername(userDoc)
      expect(result).toBe(userDoc)
      expect(userDoc.username).toBeDefined()
      expect(userDoc.save).toHaveBeenCalled()
      expect(isValidUsername(userDoc.username)).toBe(true)
    })

    it('should fallback to "user" when no seed and no id available', async () => {
      const userDoc = {
        username: undefined,
        save: jest.fn(async function () { return this })
      }

      const result = await ensureUserHasUsername(userDoc)
      expect(result).toBe(userDoc)
      expect(userDoc.username).toBeDefined()
      expect(userDoc.save).toHaveBeenCalled()
      expect(isValidUsername(userDoc.username)).toBe(true)
    })

    it('should regenerate with timestamp when candidate exceeds 20 chars (line 43)', async () => {
      // Line 43 triggers when candidate becomes invalid (> 20 chars) due to very large suffix
      // With the refactored code, we can now test this by starting with a large suffix
      
      // Start with suffix that will create invalid candidate (18 digits)
      // When suffix = 1e17, candidate = "abc" (3 chars) + "100000000000000000" (18 chars) = 21 chars (invalid)
      const largeSuffix = 100000000000000000; // 1e17
      
      // Mock User.exists to return false (no collision with the invalid candidate)
      const existsSpy = jest.spyOn(User, 'exists').mockResolvedValue(false);
      
      // Call with _startingSuffix parameter to jump directly to large suffix
      // Note: _startingSuffix is an internal parameter used only for testing this edge case
      const username = await generateUniqueUsername('abc', largeSuffix);
      
      // The function should detect invalid candidate and regenerate with timestamp
      expect(isValidUsername(username)).toBe(true);
      expect(username.length).toBeLessThanOrEqual(20);
      // Should be regenerated (not 'abc' + large suffix)
      expect(username).toMatch(/^user/);
      expect(username).not.toMatch(/^abc/);
      
      existsSpy.mockRestore();
    })
  })
})
