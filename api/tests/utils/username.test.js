import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../../models/user.model.js'

import {
  normalizeUsername,
  isValidUsername,
  isUsernameAvailable,
  generateUsernameSuggestion,
  buildBaseFromSeed,
  ensureValidLength
} from '../../utils/username.js'

describe('Username utilities', () => {
  let mongoServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('normalizeUsername', () => {
    it('lowercases and trims input', () => {
      expect(normalizeUsername('  HelloWorld  ')).toBe('helloworld')
      expect(normalizeUsername('USER_123')).toBe('user_123')
    })

    it('returns empty string for falsy values', () => {
      expect(normalizeUsername('')).toBe('')
      expect(normalizeUsername()).toBe('')
    })

    it('removes special characters', () => {
      expect(normalizeUsername('hello-world')).toBe('helloworld')
      expect(normalizeUsername('test@user.com')).toBe('testusercom')
    })
  })

  describe('stripToAllowedCharacters', () => {
    it('works same as normalizeUsername', async () => {
      const { stripToAllowedCharacters } = await import('../../utils/username.js')
      expect(stripToAllowedCharacters('Test!')).toBe('test')
    })
  })

  describe('isValidUsername', () => {
    it('accepts valid usernames', () => {
      const samples = ['abc', 'user_1', '123abc', 'lowercaseonly', 'mix123_underscore']
      samples.forEach((value) => expect(isValidUsername(value)).toBe(true))
    })

    it('rejects invalid usernames', () => {
      const invalid = ['ab', 'UPPER', 'has-dash', 'dots.are.bad', 'spaces not allowed', 'toolongusername_morethan20chars', '']
      invalid.forEach((value) => expect(isValidUsername(value)).toBe(false))
    })
  })

  describe('isUsernameAvailable', () => {
    it('reports availability correctly', async () => {
      await User.create({ username: 'taken_name', email: 'taken@example.com', password: 'secret123' })

      expect(await isUsernameAvailable('taken_name')).toBe(false)
      expect(await isUsernameAvailable('available_name')).toBe(true)
    })

    it('excludes current user when requested', async () => {
      const user = await User.create({ username: 'self_name', email: 'self@example.com', password: 'secret123' })

      expect(await isUsernameAvailable('self_name', user._id)).toBe(true)
    })
  })

  describe('buildBaseFromSeed', () => {
    it('returns cleaned seed when length >= 3', () => {
      expect(buildBaseFromSeed('HelloWorld')).toBe('helloworld')
      expect(buildBaseFromSeed('abc')).toBe('abc')
      expect(buildBaseFromSeed('test_user_123')).toBe('test_user_123')
      expect(buildBaseFromSeed('xyz')).toBe('xyz')
    })

    it('returns truncated seed when longer than 20 chars', () => {
      const result = buildBaseFromSeed('a'.repeat(30))
      expect(result.length).toBe(20)
      expect(result).toBe('a'.repeat(20))
    })

    it('collapses multiple underscores', () => {
      expect(buildBaseFromSeed('test__user')).toBe('test_user')
    })

    it('returns random fallback when cleaned seed is < 3 chars', () => {
      const result = buildBaseFromSeed('ab')
      expect(result).toMatch(/^user/)
    })

  })

  describe('ensureValidLength', () => {
    it('trims base and appends suffix', () => {
      expect(ensureValidLength('testuser', '123')).toBe('testuser123')
      expect(ensureValidLength('verylongusername', '999')).toBe('verylongusername999')
      expect(ensureValidLength('a'.repeat(25), '999')).toBe('a'.repeat(17) + '999')
    })

    it('ensures minimum length of 3', () => {
      expect(ensureValidLength('ab', '1')).toBe('ab1')
    })
  })

  describe('generateUsernameSuggestion', () => {
    it('generates a valid username from seed', async () => {
      const suggestion = await generateUsernameSuggestion('Cool Name!')
      expect(isValidUsername(suggestion)).toBe(true)
    })

    it('appends suffixes when needed', async () => {
      await User.create({ username: 'seedname', email: 'one@example.com', password: 'secret123' })
      const suggestion = await generateUsernameSuggestion('Seed Name')
      expect(isValidUsername(suggestion)).toBe(true)
      expect(suggestion.startsWith('seedname')).toBe(true)
    })

    it('uses user fallback when buildBaseFromSeed returns empty', async () => {
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue({ toString: () => '...' })
      
      const suggestion = await generateUsernameSuggestion('ab')
      expect(suggestion).toBe('user')
      
      Math.random = originalRandom
    })

    it('iterates through suffixes when base is taken', async () => {
      await User.create({ username: 'newbase', email: 'base@example.com', password: 'secret123' })
      await User.create({ username: 'newbase1', email: 'base1@example.com', password: 'secret123' })
      
      const suggestion = await generateUsernameSuggestion('newbase')
      expect(isValidUsername(suggestion)).toBe(true)
      expect(suggestion).toMatch(/^newbase\d+$/)
    })

    it('handles seed that results in exactly 20 character base', async () => {
      const longSeed = 'a'.repeat(25)
      const suggestion = await generateUsernameSuggestion(longSeed)
      expect(isValidUsername(suggestion)).toBe(true)
      expect(suggestion.length).toBeLessThanOrEqual(20)
    })

    it('throws error when unable to generate available username after many attempts', async () => {
      const testBase = 'abc'
      const promises = []
      
      promises.push(User.create({ username: testBase, email: `${testBase}@example.com`, password: 'secret123' }))
      
      for (let i = 1; i < 1000; i++) {
        const username = `${testBase}${i}`
        promises.push(User.create({ username, email: `${username}@example.com`, password: 'secret123' }))
      }
      
      await Promise.all(promises)

      await expect(generateUsernameSuggestion('abc')).rejects.toThrow('Unable to generate an available username.')
    }, 30000)
  })
})
