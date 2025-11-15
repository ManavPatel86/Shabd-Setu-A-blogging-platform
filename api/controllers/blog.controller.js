import cloudinary from "../config/cloudinary.js"
import { handleError } from "../helpers/handleError.js"
import Blog from "../models/blog.model.js"
import BlogLike from "../models/bloglike.model.js"
import { encode } from 'entities'
import Category from "../models/category.model.js"
import User from "../models/user.model.js"
import { notifyFollowersNewPost } from "../utils/notifyTriggers.js";

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        
        const incomingCategories = Array.isArray(data.categories)
            ? data.categories
            : data.category
                ? [data.category]
                : []

        const categories = [...new Set(incomingCategories.filter(Boolean))]

        if (!categories.length) {
            return next(handleError(400, 'At least one category is required.'))
        }

        const blog = new Blog({
            // Use authenticated user as author to avoid trusting client data
            author: req.user?._id || data.author,
            category: data.category,
            author: data.author,
            categories,
            title: data.title,
            slug: `${data.slug}-${Math.round(Math.random() * 100000)}`,
            featuredImage: featuredImage,
            blogContent: encode(data.blogContent),
        })

        await blog.save()

        // Notify followers about the new post (fire-and-forget; don't fail the request)
        try {
            await notifyFollowersNewPost({ authorId: req.user?._id, blogId: blog._id });
        } catch (notifyErr) {
            console.error('notifyFollowersNewPost error:', notifyErr);
        }

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
            const blog = await Blog.findById(blogid).populate('categories', 'name slug')
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

        const incomingCategories = Array.isArray(data.categories)
            ? data.categories
            : data.category
                ? [data.category]
                : []

        const categories = [...new Set(incomingCategories.filter(Boolean))]

        if (!categories.length) {
            return next(handleError(400, 'At least one category is required.'))
        }

            blog.categories = categories
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
                blog = await Blog.find().populate('author', 'name avatar role').populate('categories', 'name slug').sort({ createdAt: -1 }).lean().exec()
        } else {
                blog = await Blog.find({ author: user._id }).populate('author', 'name avatar role').populate('categories', 'name slug').sort({ createdAt: -1 }).lean().exec()
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
    const blog = await Blog.findOne({ slug }).populate('author', 'name avatar role').populate('categories', 'name slug').lean().exec()
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
        const relatedBlog = await Blog.find({ categories: categoryId, slug: { $ne: blog } })
            .populate('author', 'name avatar role')
            .populate('categories', 'name slug')
            .lean()
            .exec()
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
            .populate('categories', 'name slug')
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
            const blog = await Blog.find({ categories: categoryId }).populate('author', 'name avatar role').populate('categories', 'name slug').lean().exec()
        res.status(200).json({
            blog,
            categoryData
        })
    } catch (error) {
        next(handleError(500, error.message))
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
                .populate('categories', 'name slug')
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
    const blog = await Blog.find().populate('author', 'name avatar role').populate('categories', 'name slug').sort({ createdAt: -1 }).lean().exec()
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getPersonalizedRelated = async (req, res, next) => {
    try {
        const { blog } = req.params

        const userId = req.user?._id

        if (!userId) {
            return res.status(200).json({ relatedBlog: [] })
        }

        // blog IDs user liked
        const likedBlogIds = await BlogLike.find({ user: userId }).distinct('blogid')

        // saved blogs from user
        const userDoc = await User.findById(userId).select('savedBlogs').lean().exec()
        const savedBlogIds = (userDoc && Array.isArray(userDoc.savedBlogs)) ? userDoc.savedBlogs : []

        const sourceIds = Array.from(new Set([...(likedBlogIds || []), ...(savedBlogIds || [])]))

        // fallback to category-based when no history
        if (!sourceIds.length) {
            const currentBlog = await Blog.findOne({ slug: blog }).select('categories').lean().exec()
            const firstCategory = currentBlog?.categories && currentBlog.categories.length ? currentBlog.categories[0] : null
            if (!firstCategory) return res.status(200).json({ relatedBlog: [] })
            const related = await Blog.find({ categories: firstCategory, slug: { $ne: blog } })
                .populate('author', 'name avatar role')
                .populate('categories', 'name slug')
                .lean()
                .exec()
            return res.status(200).json({ relatedBlog: related })
        }

        // collect categories from user's liked/saved blogs
        const sourceBlogs = await Blog.find({ _id: { $in: sourceIds } }).select('categories').lean().exec()
        const categoryCount = new Map()
        sourceBlogs.forEach(sb => {
            const categories = sb?.categories || []
            categories.forEach(c => {
                const key = (c?._id || c)?.toString()
                if (!key) return
                categoryCount.set(key, (categoryCount.get(key) || 0) + 1)
            })
        })

        const topCategoryIds = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key]) => key)

        if (!topCategoryIds.length) return res.status(200).json({ relatedBlog: [] })

        const candidates = await Blog.find({ categories: { $in: topCategoryIds }, slug: { $ne: blog } })
            .populate('author', 'name avatar role')
            .populate('categories', 'name slug')
            .lean()
            .exec()

        const candidateIds = candidates.map(c => c._id).filter(Boolean)

        // compute like counts to rank
        let likeCounts = {}
        if (candidateIds.length) {
            const counts = await BlogLike.aggregate([
                { $match: { blogid: { $in: candidateIds } } },
                { $group: { _id: '$blogid', count: { $sum: 1 } } }
            ])
            counts.forEach(entry => {
                if (entry && entry._id) likeCounts[entry._id.toString()] = entry.count || 0
            })
        }

        const enriched = candidates.map(c => ({ ...c, likeCount: likeCounts[c._id?.toString()] || 0 }))
        enriched.sort((a, b) => b.likeCount - a.likeCount)

        res.status(200).json({ relatedBlog: enriched.slice(0, 6) })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getPersonalizedHome = async (req, res, next) => {
    try {
        const userId = req.user?._id
        if (!userId) return res.status(200).json({ relatedBlog: [] })

        const likedBlogIds = await BlogLike.find({ user: userId }).distinct('blogid')
        const userDoc = await User.findById(userId).select('savedBlogs').lean().exec()
        const savedBlogIds = (userDoc && Array.isArray(userDoc.savedBlogs)) ? userDoc.savedBlogs : []

        const sourceIds = Array.from(new Set([...(likedBlogIds || []), ...(savedBlogIds || [])]))

        if (!sourceIds.length) {
            // fallback: return most liked blogs
            const popular = await Blog.aggregate([
                { $match: {} },
                { $sample: { size: 12 } }
            ])
            const populated = await Blog.find({ _id: { $in: popular.map(p => p._id) } }).populate('author', 'name avatar role').populate('categories', 'name slug').lean().exec()
            return res.status(200).json({ relatedBlog: populated.slice(0, 6) })
        }

        const sourceBlogs = await Blog.find({ _id: { $in: sourceIds } }).select('categories').lean().exec()
        const categoryCount = new Map()
        sourceBlogs.forEach(sb => {
            const categories = sb?.categories || []
            categories.forEach(c => {
                const key = (c?._id || c)?.toString()
                if (!key) return
                categoryCount.set(key, (categoryCount.get(key) || 0) + 1)
            })
        })

        const topCategoryIds = Array.from(categoryCount.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k)
        if (!topCategoryIds.length) return res.status(200).json({ relatedBlog: [] })

        const candidates = await Blog.find({ categories: { $in: topCategoryIds } })
            .populate('author', 'name avatar role')
            .populate('categories', 'name slug')
            .lean()
            .exec()

        const candidateIds = candidates.map(c => c._id).filter(Boolean)
        let likeCounts = {}
        if (candidateIds.length) {
            const counts = await BlogLike.aggregate([
                { $match: { blogid: { $in: candidateIds } } },
                { $group: { _id: '$blogid', count: { $sum: 1 } } }
            ])
            counts.forEach(entry => {
                if (entry && entry._id) likeCounts[entry._id.toString()] = entry.count || 0
            })
        }

        const enriched = candidates.map(c => ({ ...c, likeCount: likeCounts[c._id?.toString()] || 0 }))
        enriched.sort((a,b)=>b.likeCount - a.likeCount)

        res.status(200).json({ relatedBlog: enriched.slice(0, 8) })
    } catch (error) {
        next(handleError(500, error.message))
    }
}