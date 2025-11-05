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

        if (!blogId) {
            return next(handleError(400, 'Blog id is required.'))
        }

        const blog = await Blog.findById(blogId)

        if (!blog) {
            return next(handleError(404, 'Blog not found.'))
        }

        if (!blog.blogContent) {
            return next(handleError(400, 'Blog content is missing.'))
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

        const prompt = ChatPromptTemplate.fromMessages([
            [
                'system',
                'You craft concise, engaging summaries for blog posts on the Shabd Setu platform. Highlight the central idea, tone, and 2-3 actionable insights. Respond in markdown with two short paragraphs followed by a bullet list of key takeaways.'
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
                maxOutputTokens: 512,
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

        res.status(200).json({
            success: true,
            summary,
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