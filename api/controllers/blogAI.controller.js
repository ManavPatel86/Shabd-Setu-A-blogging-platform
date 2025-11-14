import { decode } from 'entities'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { handleError } from '../helpers/handleError.js'
import Category from '../models/category.model.js'
import Blog from '../models/blog.model.js'

const MAX_CONTENT_LENGTH = 12000

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value)

const normalizeSlugLike = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const toPlainText = (value = '') => decode(value)
  .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const tryParseCategoryResponse = (text = '') => {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')

  if (start !== -1 && end !== -1 && end > start) {
    const jsonSlice = trimmed.slice(start, end + 1)
    try {
      const parsed = JSON.parse(jsonSlice)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item))
      }
    } catch (error) {
      // fall through to plain-text parsing
    }
  }

  return trimmed
    .split(/\n|,/)
    .map((entry) => entry.replace(/[\[\]\"\']+/g, '').trim())
    .filter(Boolean)
}

export const generateCategorySuggestions = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(handleError(500, 'Gemini API key is not configured.'))
    }

    const userId = req.user?._id
    if (!userId) {
      return next(handleError(401, 'Authentication required to categorize blog.'))
    }

    const maxCategories = Math.max(1, Math.min(Number(req.body?.maxCategories) || 3, 5))
    const rawTitle = String(req.body?.title || '').trim()
    const rawContent = String(req.body?.content || '').trim()

    if (!rawContent) {
      return next(handleError(400, 'Blog content is required for categorization.'))
    }

    const categories = await Category.find().select('name slug').sort({ name: 1 }).lean().exec()

    if (!categories.length) {
      return next(handleError(400, 'No categories are configured yet.'))
    }

    const plainContent = toPlainText(rawContent)

    if (!plainContent) {
      return next(handleError(400, 'Content is empty after processing.'))
    }

    const contentForCategorization = plainContent.length > MAX_CONTENT_LENGTH
      ? `${plainContent.slice(0, MAX_CONTENT_LENGTH)}...`
      : plainContent

    const categoryGlossary = categories
      .map((category) => `- ${category.name} (slug: ${category.slug})`)
      .join('\n')

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You assign one to {maxCategories} categories to a blog post using only the provided category list. '
        + 'Return a JSON array of category slugs. Never invent new categories.'
      ],
      [
        'human',
        'Available categories:\n{categoryGlossary}\n\n'
        + 'Example blog title: {exampleTitle}\n'
        + 'Example blog content: {exampleContent}\n'
        + 'Respond with only a JSON array of slugs.'
      ],
      [
        'ai',
        '{exampleAnswer}'
      ],
      [
        'human',
        'Now categorize this blog.\nBlog title: {title}\nBlog content:\n{content}\n'
        + 'Answer with the JSON array now.'
      ],
    ])

    const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const candidateModels = Array.from(new Set([
      preferredModel,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
    ])).filter(Boolean)

    let modelOutput = ''
    let lastError

    for (const modelId of candidateModels) {
      try {
        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY,
          model: modelId,
          temperature: 0,
          maxOutputTokens: 256,
        })

        const chain = prompt.pipe(model).pipe(new StringOutputParser())

        modelOutput = await chain.invoke({
          categoryGlossary,
          maxCategories,
          exampleTitle: 'The Rise of Plant-Based Nutrition',
          exampleContent: 'Discussion about plant-based diets, wellness routines, and healthy lifestyle choices.',
          exampleAnswer: JSON.stringify(['health-wellness']),
          title: rawTitle || '(untitled blog)',
          content: contentForCategorization,
        })

        modelOutput = (modelOutput || '').trim()
        if (modelOutput) {
          break
        }
      } catch (error) {
        lastError = error
      }
    }

    if (!modelOutput) {
      const message = lastError?.message || 'Gemini returned no output.'
      const statusCode = lastError?.status === 404 ? 502 : 500
      throw handleError(
        statusCode,
        `${message} Please verify GEMINI_MODEL is available.`
      )
    }

    const rawSuggestions = tryParseCategoryResponse(modelOutput)
      .slice(0, maxCategories)

    const lookup = new Map()
    categories.forEach((category) => {
      lookup.set(normalizeSlugLike(category.slug), category)
      lookup.set(normalizeSlugLike(category.name), category)
    })

    const matched = []
    const seen = new Set()

    rawSuggestions.forEach((candidate) => {
      const key = normalizeSlugLike(candidate)
      if (!key) {
        return
      }
      const category = lookup.get(key)
      if (!category) {
        return
      }
      const id = category._id.toString()
      if (seen.has(id)) {
        return
      }
      seen.add(id)
      matched.push(category)
    })

    res.status(200).json({
      success: true,
      categories: matched,
      suggestedSlugs: rawSuggestions,
      modelOutput,
    })
  } catch (error) {
    next(handleError(500, error.message || 'Failed to generate category suggestions.'))
  }
}

export const generateBlogSummary = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return next(handleError(500, 'Gemini API key is not configured.'))
    }

    const { blogId } = req.params
    const refreshRequested = String(req.query?.refresh || '').toLowerCase() === 'true'
    const userId = req.user?._id

    if (!blogId) {
      return next(handleError(400, 'Blog id is required.'))
    }

    if (!userId) {
      return next(handleError(401, 'Authentication required to generate summary.'))
    }

    const blog = await Blog.findById(blogId)

    if (!blog) {
      return next(handleError(404, 'Blog not found.'))
    }

    if (!blog.blogContent) {
      return next(handleError(400, 'Blog content is missing.'))
    }

    const cachedSummary = (blog.summary || '').trim()

    if (!refreshRequested && cachedSummary) {
      return res.status(200).json({
        success: true,
        summary: cachedSummary,
        cached: true,
        refreshed: false,
      })
    }

    const MAX_REFRESHES_PER_USER = 3

    let refreshEntry = null

    if (refreshRequested) {
      if (!Array.isArray(blog.summaryRefreshCounts)) {
        blog.summaryRefreshCounts = []
      }

      refreshEntry = blog.summaryRefreshCounts.find((entry) =>
        entry?.user && entry.user.toString() === userId.toString()
      )

      if (refreshEntry?.count >= MAX_REFRESHES_PER_USER) {
        if (cachedSummary) {
          return res.status(200).json({
            success: true,
            summary: cachedSummary,
            cached: true,
            refreshed: false,
            remainingRefreshes: 0,
          })
        }

        return next(handleError(429, 'Refresh limit reached for this blog.'))
      }
    }

    if (isHttpUrl(blog.blogContent) && typeof fetch !== 'function') {
      return next(handleError(500, 'Fetch API is not available to retrieve blog content.'))
    }

    let sourceContent = blog.blogContent

    if (isHttpUrl(sourceContent)) {
      const response = await fetch(sourceContent)
      if (!response.ok) {
        return next(handleError(502, 'Unable to download blog content from Cloudinary.'))
      }
      sourceContent = await response.text()
    }

    const plainText = toPlainText(sourceContent)

    if (!plainText) {
      return next(handleError(400, 'Blog content is empty after processing.'))
    }

    const contentForSummary = plainText.length > MAX_CONTENT_LENGTH
      ? `${plainText.slice(0, MAX_CONTENT_LENGTH)}...`
      : plainText

    const exampleContent = `Minimalism isn't about deprivation; it's a deliberate choice to keep what matters and let go of the rest.
It frees time, space, and attention for experiences, creativity, and community.
By paring down possessions, we discover what genuinely adds value to everyday life.`

    const exampleSummary = `Minimalist living centers on intentionally owning less so daily energy goes toward people and passions rather than possessions.

It replaces clutter with calm, making room for creativity, relationships, and restorative routines.

To begin, review each room for meaningful items only, adopt one-in-one-out habits, and reframe shopping as an intentional choice instead of an impulse.`

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You craft clean, human readable blog summaries for the Shabd Setu platform. Write in plain text only—no markdown, bullet symbols, headings, emojis, or emphasis. Deliver few concise paragraphs (2-3 sentences each) separated by a single blank line. Capture the core theme, tone, and the most practical insights. Keep the complete response at or under 500 words.'
      ],
      [
        'human',
        `Example request:\nBlog title: The Joy of Minimalist Living\n\nContent to summarize:\n${exampleContent}`
      ],
      [
        'ai',
        exampleSummary
      ],
      [
        'human',
        'Blog title: {title}\n\nContent to summarize:\n{content}\n\nGenerate the summary now.'
      ],
    ])

    const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    const runChain = async (modelId) => {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: modelId,
        temperature: 0.3,
        maxOutputTokens: 768,
      })

      const chain = prompt.pipe(model).pipe(new StringOutputParser())

      const payload = {
        title: blog.title,
        content: contentForSummary,
      }

      return (await chain.invoke({
        title: payload.title,
        content: payload.content,
      })).trim()
    }

    const candidateModels = Array.from(new Set([
      preferredModel,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
    ])).filter(Boolean)

    let summary
    let lastError

    for (const modelId of candidateModels) {
      try {
        summary = await runChain(modelId)
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!summary) {
      const message = lastError?.message || 'Gemini returned no output.'
      const statusCode = lastError?.status === 404 ? 502 : 500
      throw handleError(
        statusCode,
        `${message} Please confirm your GEMINI_MODEL matches an available model (eg. gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite). See https://ai.google.dev/gemini-api/docs/models/gemini for the latest list.`
      )
    }

    const cleanedSummary = summary
      .replace(/\r/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .split('\n')
      .map((line) => line.replace(/^[\-•\u2022\*]\s*/, '').trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    let limitedSummary = cleanedSummary
    const wordIterator = cleanedSummary.matchAll(/\S+/g)
    let wordCount = 0
    let cutoffIndex = null

    for (const match of wordIterator) {
      wordCount += 1
      if (wordCount > 500) {
        cutoffIndex = match.index
        break
      }
    }

    if (cutoffIndex !== null) {
      limitedSummary = cleanedSummary.slice(0, cutoffIndex).trimEnd()
    }

    if (refreshRequested) {
      if (refreshEntry) {
        refreshEntry.count += 1
      } else {
        blog.summaryRefreshCounts.push({ user: userId, count: 1 })
      }

      await blog.save({ validateBeforeSave: false })

      const currentCount = refreshEntry ? refreshEntry.count : 1

      return res.status(200).json({
        success: true,
        summary: limitedSummary,
        cached: false,
        refreshed: true,
        remainingRefreshes: Math.max(0, MAX_REFRESHES_PER_USER - currentCount),
      })
    }

    blog.summary = limitedSummary
    await blog.save({ validateBeforeSave: false })

    return res.status(200).json({
      success: true,
      summary: limitedSummary,
      cached: false,
      refreshed: false,
    })
  } catch (error) {
    next(handleError(500, error.message || 'Failed to generate summary.'))
  }
}
