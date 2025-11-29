import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../../models/user.model.js'

import {
  normalizeUsername,
  isValidUsername,
  isUsernameAvailable,
  generateUsernameSuggestion
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
      expect(suggestion).not.toBe('seedname')
    })
  })
})
