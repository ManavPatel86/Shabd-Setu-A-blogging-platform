import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import mongoose from 'mongoose'
import Blog from '../../models/blog.model.js'
import Category from '../../models/category.model.js'
import User from '../../models/user.model.js'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'

// Import controller to get deps object and utility functions
const { 
  generateCategorySuggestions, 
  generateBlogSummary, 
  deps,
  isHttpUrl,
  normalizeSlugLike,
  toPlainText,
  tryParseCategoryResponse
} = await import('../../controllers/blogAI.controller.js')

// Mock LangChain using deps injection
const chainQueue = []
const queueChainResult = (value) => {
  chainQueue.push({ type: 'value', value })
}
const queueChainError = (error) => {
  // Keep the error as-is to preserve all properties like 'status'
  chainQueue.push({ type: 'error', error: error })
}

class FakeChain {
  pipe() {
    return this
  }
  async invoke() {
    if (!chainQueue.length) {
      throw new Error('No queued chain results remaining')
    }
    const next = chainQueue.shift()
    if (next.type === 'error') {
      throw next.error
    }
    return typeof next.value === 'function' ? next.value() : next.value
  }
}

// Create mock classes that will be returned by deps
class MockStringOutputParser {
  pipe() {
    return new FakeChain()
  }
  async invoke(input) {
    const queued = chainQueue.shift()
    if (queued?.type === 'error') {
      throw queued.error
    }
    return typeof queued?.value === 'function' ? queued.value() : (queued?.value || '')
  }
}

class MockChatGoogleGenerativeAI {
  constructor(options) {
    this.options = options
  }
  pipe() {
    return new FakeChain()
  }
  async invoke(input) {
    const queued = chainQueue.shift()
    if (queued?.type === 'error') {
      throw queued.error
    }
    return typeof queued?.value === 'function' ? queued.value() : (queued?.value || '')
  }
}

// Replace deps properties directly
deps.ChatPromptTemplate = {
  fromMessages: () => new FakeChain()
}

deps.StringOutputParser = MockStringOutputParser
deps.ChatGoogleGenerativeAI = MockChatGoogleGenerativeAI

const buildRes = () => {
  const res = {}
  res.status = function status(code) {
    this._statusCode = code
    return this
  }
  res.json = function json(payload) {
    this._jsonData = payload
    return this
  }
  return res
}

const buildNext = (res) => (error) => {
  res._error = error
}

describe('Blog AI Controller', () => {
  const envBackup = { ...process.env }
  let authedUser
  let baseBlog
  let techCategory
  let healthCategory

  beforeAll(async () => {
    await connectTestDB()
    process.env.GEMINI_API_KEY = 'test-api-key'
    process.env.GEMINI_MODEL = 'gemini-2.5-flash'
  })

  afterAll(async () => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in envBackup)) {
        delete process.env[key]
      }
    })
    Object.assign(process.env, envBackup)
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    chainQueue.length = 0

    authedUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!'
    })

    techCategory = await Category.create({
      name: 'Technology',
      slug: 'technology'
    })

    healthCategory = await Category.create({
      name: 'Health & Wellness',
      slug: 'health-wellness'
    })

    baseBlog = await Blog.create({
      title: 'Test Blog',
      slug: 'test-blog',
      blogContent: '<p>Test content</p>',
      featuredImage: 'https://example.com/image.jpg',
      author: authedUser._id,
      categories: []
    })
  })

  describe('generateCategorySuggestions', () => {
    // Success cases
    it('returns matched categories from Gemini JSON output', async () => {
      queueChainResult('["technology", "health-wellness"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'AI in Healthcare',
          content: '<p>Discussion about AI and health technology</p>',
          maxCategories: 2
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(2)
      expect(res._jsonData.suggestedSlugs).toEqual(['technology', 'health-wellness'])
    })

    it('falls back to plain-text parsing when JSON invalid', async () => {
      queueChainResult('technology\nhealth-wellness\nnonexistent-category')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(2)
      expect(res._jsonData.categories.map((cat) => cat.slug).sort()).toEqual(['health-wellness', 'technology'])
    })

    it('handles very long content by truncating', async () => {
      const longContent = 'word '.repeat(15000)
      queueChainResult('["technology"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Long Blog',
          content: `<p>${longContent}</p>`
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
    })

    it('filters categories without _id', async () => {
      queueChainResult('["technology", "nonexistent-slug"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
      expect(res._jsonData.suggestedSlugs).toHaveLength(2)
    })

    it('filters empty normalized category keys', async () => {
      queueChainResult('["technology", "---", "!!!"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
      expect(res._jsonData.categories[0].slug).toBe('technology')
    })

    it('skips duplicate category IDs', async () => {
      queueChainResult('["technology", "Technology"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
      expect(res._jsonData.categories[0].slug).toBe('technology')
    })

    // Model fallback
    it('tries multiple models when first ones fail', async () => {
      queueChainResult('')
      queueChainResult('')
      queueChainResult('["technology"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
    })

    it('exhausts all models before failing', async () => {
      // Queue empty results for all 9 models
      for (let i = 0; i < 9; i++) {
        queueChainResult('')
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toContain('Gemini returned no output')
    })

    it('handles lastError with undefined status', async () => {
      // Create error without status property
      const errorWithoutStatus = new Error('Model error')
      delete errorWithoutStatus.status

      for (let i = 0; i < 9; i++) {
        queueChainError(errorWithoutStatus)
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('handles lastError being null', async () => {
      // Queue empty results for all models (no errors thrown)
      for (let i = 0; i < 9; i++) {
        queueChainResult('')
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('uses default model when GEMINI_MODEL not set', async () => {
      const originalModel = process.env.GEMINI_MODEL
      delete process.env.GEMINI_MODEL

      queueChainResult('["technology"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)

      process.env.GEMINI_MODEL = originalModel
    })

    it('uses "(untitled blog)" when title is empty string', async () => {
      queueChainResult('["technology"]')

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: '',
          content: '<p>Valid content without title</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.categories).toHaveLength(1)
    })

    // Validation errors
    it('requires authentication', async () => {
      const req = {
        body: { content: '<p>test</p>' }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Authentication required')
    })

    it('requires API key', async () => {
      delete process.env.GEMINI_API_KEY

      const req = {
        user: { _id: authedUser._id },
        body: { content: '<p>test</p>' }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('API key is not configured')

      process.env.GEMINI_API_KEY = 'test-api-key'
    })

    it('validates content presence', async () => {
      const req = {
        user: { _id: authedUser._id },
        body: {}
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('content is required')
    })

    it('requires configured categories in database', async () => {
      await Category.deleteMany({})

      const req = {
        user: { _id: authedUser._id },
        body: { content: '<p>test</p>' }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('No categories are configured')
    })

    it('validates plain text is not empty after processing', async () => {
      const req = {
        user: { _id: authedUser._id },
        body: { content: '<script></script><style></style>' }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('empty after processing')
    })

    // Error handling
    it('returns 502 when all models return 404 status', async () => {
      class Model404Error extends Error {
        constructor(message) {
          super(message)
          this.status = 404
        }
      }

      for (let i = 0; i < 9; i++) {
        queueChainError(new Model404Error('Model not found'))
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(502)
    })

    it('returns 500 when all models fail with non-404 errors', async () => {
      for (let i = 0; i < 9; i++) {
        queueChainError(new Error('Gemini outage'))
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Gemini outage')
      expect(res._error.statusCode).toBe(500)
    })

    it('handles database errors', async () => {
      const originalFind = Category.find

      Category.find = () => {
        throw new Error('Database connection lost')
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toContain('Database connection lost')

      Category.find = originalFind
    })

    it('handles errors without message property', async () => {
      const originalFind = Category.find

      Category.find = () => {
        const err = new Error()
        delete err.message
        throw err
      }

      const req = {
        user: { _id: authedUser._id },
        body: {
          title: 'Test',
          content: '<p>Valid content</p>'
        }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateCategorySuggestions(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toBe('Failed to generate category suggestions.')

      Category.find = originalFind
    })
  })

  describe('generateBlogSummary', () => {
    // Caching behavior
    it('uses cached summary when already exists and no refresh requested', async () => {
      baseBlog.summary = 'Cached summary text'
      await baseBlog.save()

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toBe('Cached summary text')
      expect(res._jsonData.cached).toBe(true)
      expect(res._jsonData.refreshed).toBe(false)
    })

    it('generates and stores summary when no cache exists', async () => {
      queueChainResult('Generated summary output')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.cached).toBe(false)
      const updated = await Blog.findById(baseBlog._id)
      expect(updated.summary).toContain('Generated summary output')
    })

    // Refresh functionality
    it('increments refresh count when refresh is requested', async () => {
      queueChainResult('Refreshed summary output')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._jsonData.refreshed).toBe(true)
      expect(res._jsonData.remainingRefreshes).toBe(2)
      const refreshed = await Blog.findById(baseBlog._id)
      expect(refreshed.summaryRefreshCounts[0].count).toBe(1)
    })

    it('increments existing refresh entry for second refresh', async () => {
      baseBlog.summaryRefreshCounts = [
        { user: authedUser._id, count: 1 }
      ]
      await baseBlog.save({ validateBeforeSave: false })

      queueChainResult('Second refresh summary')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.refreshed).toBe(true)
      expect(res._jsonData.remainingRefreshes).toBe(1)
      const updated = await Blog.findById(baseBlog._id)
      expect(updated.summaryRefreshCounts[0].count).toBe(2)
    })

    it('creates new refresh entry when none exists', async () => {
      baseBlog.summaryRefreshCounts = []
      await baseBlog.save({ validateBeforeSave: false })

      queueChainResult('First refresh summary')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.refreshed).toBe(true)
      expect(res._jsonData.remainingRefreshes).toBe(2)
      const updated = await Blog.findById(baseBlog._id)
      expect(updated.summaryRefreshCounts).toHaveLength(1)
      expect(updated.summaryRefreshCounts[0].count).toBe(1)
    })

    it('enforces refresh limits and returns cached summary', async () => {
      baseBlog.summary = 'Cached summary'
      baseBlog.summaryRefreshCounts = [
        { user: authedUser._id, count: 3 }
      ]
      await baseBlog.save()

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toBe('Cached summary')
      expect(res._jsonData.refreshed).toBe(false)
      expect(res._jsonData.remainingRefreshes).toBe(0)
    })

    it('returns error when refresh limit reached and no cached summary exists', async () => {
      baseBlog.summary = null
      baseBlog.summaryRefreshCounts = [
        { user: authedUser._id, count: 3 }
      ]
      await baseBlog.save({ validateBeforeSave: false })

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(429)
      expect(res._error.message).toBe('Refresh limit reached for this blog.')
    })

    it('initializes summaryRefreshCounts array when not an array', async () => {
      await Blog.updateOne(
        { _id: baseBlog._id },
        { $set: { summaryRefreshCounts: null } }
      )

      queueChainResult('Refreshed summary')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: { refresh: 'true' },
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.refreshed).toBe(true)
      const updated = await Blog.findById(baseBlog._id)
      expect(Array.isArray(updated.summaryRefreshCounts)).toBe(true)
      expect(updated.summaryRefreshCounts).toHaveLength(1)
    })

    // Remote content handling
    it('downloads remote content when URL is provided', async () => {
      baseBlog.blogContent = 'https://cloudinary.example.com/blog.html'
      await baseBlog.save()

      const previousFetch = global.fetch
      global.fetch = jest.fn(async () => ({
        ok: true,
        text: async () => '<p>Fetched content from remote</p>'
      }))

      queueChainResult('Fetched summary output')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toBe('Fetched summary output')
      global.fetch = previousFetch
    })

    it('handles failed fetch from remote content', async () => {
      baseBlog.blogContent = 'https://cloudinary.example.com/missing.html'
      await baseBlog.save({ validateBeforeSave: false })

      const previousFetch = global.fetch
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 404
      }))

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Unable to download blog content')
      global.fetch = previousFetch
    })

    // Content processing
    it('handles very long content by truncating', async () => {
      const longContent = 'word '.repeat(15000)
      baseBlog.blogContent = `<p>${longContent}</p>`
      await baseBlog.save({ validateBeforeSave: false })

      queueChainResult('Summary of long content')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toBe('Summary of long content')
    })

    it('limits summary output to 500 words', async () => {
      const longSummary = 'word '.repeat(600)
      queueChainResult(longSummary)

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      const words = res._jsonData.summary.match(/\S+/g)
      expect(words.length).toBeLessThanOrEqual(500)
    })

    // Model fallback
    it('tries multiple models when first ones fail', async () => {
      queueChainError(new Error('Model 1 error'))
      queueChainError(new Error('Model 2 error'))
      queueChainResult('Summary from third model')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toContain('Summary from third model')
    })

    it('exhausts all models before failing for summary', async () => {
      // Queue errors for all 9 models
      for (let i = 0; i < 9; i++) {
        queueChainError(new Error('Model unavailable'))
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('handles lastError with undefined status in summary', async () => {
      // Create error without status property
      const errorWithoutStatus = new Error('Summary generation failed')
      delete errorWithoutStatus.status

      for (let i = 0; i < 9; i++) {
        queueChainError(errorWithoutStatus)
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('handles lastError being null in summary', async () => {
      // All models return empty string (no errors, just no output)
      for (let i = 0; i < 9; i++) {
        queueChainResult('')
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('handles lastError with status but not 404 in summary', async () => {
      const error503 = new Error('Service unavailable')
      error503.status = 503

      for (let i = 0; i < 9; i++) {
        queueChainError(error503)
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('uses default model when GEMINI_MODEL is empty string', async () => {
      const originalModel = process.env.GEMINI_MODEL
      process.env.GEMINI_MODEL = ''

      queueChainResult('Summary with default model')

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.summary).toContain('Summary with default model')

      process.env.GEMINI_MODEL = originalModel
    })

    // Validation errors
    it('requires authentication', async () => {
      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {}
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Authentication required')
    })

    it('requires API key', async () => {
      delete process.env.GEMINI_API_KEY

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('API key is not configured')

      process.env.GEMINI_API_KEY = 'test-api-key'
    })

    it('validates blog id is provided', async () => {
      const req = {
        params: {},
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Blog id is required')
    })

    it('handles missing blog not found in database', async () => {
      const req = {
        params: { blogId: new mongoose.Types.ObjectId().toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Blog not found')
    })

    it('validates blog content is not empty', async () => {
      baseBlog.blogContent = ''
      await baseBlog.save({ validateBeforeSave: false })

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('content is missing')
    })

    it('validates plain text is not empty after processing', async () => {
      baseBlog.blogContent = '<script>code</script><style>styles</style>'
      await baseBlog.save()

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('empty after processing')
    })

    it('requires fetch API for remote content', async () => {
      baseBlog.blogContent = 'https://cloudinary.example.com/blog.html'
      await baseBlog.save()

      const previousFetch = global.fetch
      global.fetch = undefined

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.message).toContain('Fetch API is not available')

      global.fetch = previousFetch
    })

    // Error handling
    it('returns 502 when all models return 404 status', async () => {
      class Summary404Error extends Error {
        constructor(message) {
          super(message)
          this.status = 404
        }
      }

      for (let i = 0; i < 9; i++) {
        queueChainError(new Summary404Error('Summary model not found'))
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(502)
    })

    it('returns 500 when all models fail with non-404 errors', async () => {
      for (let i = 0; i < 9; i++) {
        queueChainError(new Error('Model failure'))
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toContain('Model failure')
    })

    it('handles database errors', async () => {
      const originalFindById = Blog.findById

      Blog.findById = () => {
        throw new Error('Database server error')
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toContain('Database server error')

      Blog.findById = originalFindById
    })

    it('handles errors without message property in summary', async () => {
      const originalFindById = Blog.findById

      Blog.findById = () => {
        const err = new Error()
        delete err.message
        throw err
      }

      const req = {
        params: { blogId: baseBlog._id.toString() },
        query: {},
        user: { _id: authedUser._id }
      }
      const res = buildRes()
      const next = buildNext(res)

      await generateBlogSummary(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toBe('Failed to generate summary.')

      Blog.findById = originalFindById
    })
  })

  describe('Utility functions', () => {
    describe('tryParseCategoryResponse', () => {
      it('handles undefined input', () => {
        const result = tryParseCategoryResponse()
        expect(result).toEqual([])
      })

      it('handles empty string', () => {
        const result = tryParseCategoryResponse('')
        expect(result).toEqual([])
      })

      it('handles whitespace only', () => {
        const result = tryParseCategoryResponse('   \n\t  ')
        expect(result).toEqual([])
      })

      it('parses valid JSON array', () => {
        const result = tryParseCategoryResponse('["tech", "health"]')
        expect(result).toEqual(['tech', 'health'])
      })

      it('falls back to plain text when JSON is not an array', () => {
        const result = tryParseCategoryResponse('{"key": "value"}')
        expect(Array.isArray(result)).toBe(true)
      })

      it('falls back to plain text when JSON parses to null', () => {
        const result = tryParseCategoryResponse('null')
        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual(['null'])
      })

      it('falls back to plain text when JSON parses to number', () => {
        const result = tryParseCategoryResponse('123')
        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual(['123'])
      })

      it('falls back to plain text when JSON parses to boolean', () => {
        const result = tryParseCategoryResponse('true')
        expect(Array.isArray(result)).toBe(true)
      })

    it('falls back to plain text when JSON parses to string', () => {
      const result = tryParseCategoryResponse('"just a string"')
      expect(Array.isArray(result)).toBe(true)
    })

    it('falls back to plain text when JSON is valid but not an array (object case)', () => {
      const result = tryParseCategoryResponse('[{"nested": "object"}]')
      expect(Array.isArray(result)).toBe(true)
      // Should parse as array but when elements are objects, they get stringified
      expect(result.length).toBeGreaterThan(0)
    })

    it('falls back to plain text when brackets contain non-array JSON (covers line 48 else branch)', () => {
      // Input has [ and ] but JSON.parse returns an object, not an array
      const result = tryParseCategoryResponse('Some text [{"key": "value"}] more text')
      expect(Array.isArray(result)).toBe(true)
      // Should fall through to plain-text parsing
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles malformed JSON between brackets that still has valid sub-JSON', () => {
      // When brackets span invalid JSON, should fall through to plain-text
      const result = tryParseCategoryResponse('[tech, health] and [fitness]')
      expect(Array.isArray(result)).toBe(true)
      // Falls back to plain text parsing, splits on comma/newline
      expect(result.length).toBeGreaterThan(0)
      expect(result.some(item => item.includes('tech'))).toBe(true)
    })

    it('handles brackets with only whitespace between them', () => {
      const result = tryParseCategoryResponse('[   ]')
      expect(Array.isArray(result)).toBe(true)
      // Empty brackets create empty array, but filter(Boolean) removes empty items
      expect(result).toEqual([])
    })

    it('handles case when Array.isArray returns false for parsed JSON (defensive branch)', () => {
      // This tests the defensive else branch on line 48
      // Temporarily mock Array.isArray to return false
      const originalIsArray = Array.isArray
      let callCount = 0
      
      Array.isArray = (arg) => {
        callCount++
        // First call is internal to tryParseCategoryResponse
        if (callCount === 1) {
          return false // Force the else branch
        }
        // Subsequent calls (from test expectations) use original
        return originalIsArray(arg)
      }

      const result = tryParseCategoryResponse('["tech", "health"]')
      
      Array.isArray = originalIsArray // Restore
      
      // Should fall back to plain text parsing
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('isHttpUrl', () => {
    it('handles undefined input', () => {
      const result = isHttpUrl()
      expect(result).toBe(false)
    })
  })

  describe('normalizeSlugLike', () => {
    it('handles undefined input', () => {
      const result = normalizeSlugLike()
      expect(result).toBe('')
    })
  })

    describe('toPlainText', () => {
      it('handles undefined input', () => {
        const result = toPlainText()
        expect(result).toBe('')
      })
    })
  })
})