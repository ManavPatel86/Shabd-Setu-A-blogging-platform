import cloudinary from "../config/cloudinary.js"
import { handleError } from "../helpers/handleError.js"
import Blog from "../models/blog.model.js"
import { encode, decode } from 'entities'
import Category from "../models/category.model.js"
import User from "../models/user.model.js"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MAX_CONTENT_LENGTH = 12000;

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value);

const toPlainText = (value = '') => decode(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export const addBlog = async (req, res, next) => {
    try {
        const data = JSON.parse(req.body.data)
        let featuredImage = ''
        if (req.file) {
            // Upload an image
            const uploadResult = await cloudinary.uploader
                .upload(
                    req.file.path,
                    { folder: 'Shabd-Setu-A-blogging-platform', resource_type: 'auto' }
                )
                .catch((error) => {
                    next(handleError(500, error.message))
                });

            featuredImage = uploadResult.secure_url
        }
        
        const blog = new Blog({
            author: data.author,
            category: data.category,
            title: data.title,
            slug: `${data.slug}-${Math.round(Math.random() * 100000)}`,
            featuredImage: featuredImage,
            blogContent: encode(data.blogContent),
        })

        await blog.save()

        res.status(200).json({
            success: true,
            message: 'Blog added successfully.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const editBlog = async (req, res, next) => {
    try {
        const { blogid } = req.params
        const blog = await Blog.findById(blogid).populate('category', 'name')
        if (!blog) {
            next(handleError(404, 'Data not found.'))
        }
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const updateBlog = async (req, res, next) => {
    try {
        const { blogid } = req.params
        const data = JSON.parse(req.body.data)

        const blog = await Blog.findById(blogid)

        blog.category = data.category
        blog.title = data.title
        blog.slug = data.slug
        blog.blogContent = encode(data.blogContent)

        let featuredImage = blog.featuredImage

        if (req.file) {
            // Upload an image
            const uploadResult = await cloudinary.uploader
                .upload(
                    req.file.path,
                    { folder: 'yt-mern-blog', resource_type: 'auto' }
                )
                .catch((error) => {
                    next(handleError(500, error.message))
                });

            featuredImage = uploadResult.secure_url
        }

        blog.featuredImage = featuredImage

        await blog.save()


        res.status(200).json({
            success: true,
            message: 'Blog updated successfully.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const deleteBlog = async (req, res, next) => {
    try {
        const { blogid } = req.params
        await Blog.findByIdAndDelete(blogid)
        res.status(200).json({
            success: true,
            message: 'Blog Deleted successfully.',
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const showAllBlog = async (req, res, next) => {
    try {
        const user = req.user
        let blog;
        if (user.role === 'admin') {
            blog = await Blog.find().populate('author', 'name avatar role').populate('category', 'name slug').sort({ createdAt: -1 }).lean().exec()
        } else {
            blog = await Blog.find({ author: user._id }).populate('author', 'name avatar role').populate('category', 'name slug').sort({ createdAt: -1 }).lean().exec()
        }
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getBlog = async (req, res, next) => {
    try {
        const { slug } = req.params
        const blog = await Blog.findOne({ slug }).populate('author', 'name avatar role').populate('category', 'name slug').lean().exec()
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getRelatedBlog = async (req, res, next) => {
    try {
        const { category, blog } = req.params

        const categoryData = await Category.findOne({ slug: category })
        if (!categoryData) {
            return next(404, 'Category data not found.')
        }
        const categoryId = categoryData._id
        const relatedBlog = await Blog.find({ category: categoryId, slug: { $ne: blog } }).lean().exec()
        res.status(200).json({
            relatedBlog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getBlogsByAuthor = async (req, res, next) => {
    try {
        const { authorId } = req.params

        const blogs = await Blog.find({ author: authorId })
            .populate('author', 'name avatar role')
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .lean()
            .exec()

        res.status(200).json({
            blog: blogs
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getBlogByCategory = async (req, res, next) => {
    try {
        const { category } = req.params

        const categoryData = await Category.findOne({ slug: category })
        if (!categoryData) {
            return next(404, 'Category data not found.')
        }
        const categoryId = categoryData._id
        const blog = await Blog.find({ category: categoryId }).populate('author', 'name avatar role').populate('category', 'name slug').lean().exec()
        res.status(200).json({
            blog,
            categoryData
        })
    } catch (error) {
        next(handleError(500, error.message))
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
            .map((line) => line.replace(/^[-•\u2022\*]\s*/, '').trimEnd())
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
export const search = async (req, res, next) => {
    try {
        const rawQuery = req.query.q || ''
        const query = rawQuery.trim()

        if (!query) {
            return res.status(200).json({
                blog: [],
                authors: []
            })
        }

        const regex = new RegExp(escapeRegex(query), 'i')

        const blog = await Blog.find({
            $or: [
                { title: regex },
                { slug: regex },
            ]
        })
            .populate('author', 'name avatar role')
            .populate('category', 'name slug')
            .lean()
            .exec()

        const authors = await User.find({
            name: regex,
            isBlacklisted: { $ne: true }
        })
            .select('name avatar bio role')
            .limit(12)
            .lean()
            .exec()

        res.status(200).json({
            blog,
            authors,
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getAllBlogs = async (req, res, next) => {
    try {
        const user = req.user
        const blog = await Blog.find().populate('author', 'name avatar role').populate('category', 'name slug').sort({ createdAt: -1 }).lean().exec()
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}