import cloudinary from "../config/cloudinary.js"
import { handleError } from "../helpers/handleError.js"
import Blog from "../models/blog.model.js"
import BlogLike from "../models/bloglike.model.js"
import { encode, decode } from 'entities'
import Category from "../models/category.model.js"
import User from "../models/user.model.js"
import slugify from "slugify";
import { notifyFollowersNewPost } from "../utils/notifyTriggers.js";
import { moderateBlog } from "../utils/moderation.js";
import Follow from "../models/follow.model.js";

export const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSlug = (value = '') => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed) {
        return ''
    }
    return slugify(trimmed, { lower: true, strict: true })
}

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '').trim()
const toPlainText = (value = '') => decode(value)

const parseRequestBody = (raw) => {
    if (!raw) {
        return {}
    }
    if (typeof raw === 'object') {
        return raw
    }
    try {
        return JSON.parse(raw)
    } catch (error) {
        return {}
    }
}

const ensureUniquePublishedSlug = async (baseSlug, excludeId = null) => {
    const normalizedBase = normalizeSlug(baseSlug)
    const fallbackBase = normalizedBase || `blog-${Math.round(Math.random() * 100000)}`
    let candidate = fallbackBase
    let attempt = 0

    const buildQuery = (slugValue) => {
        const query = { slug: slugValue, status: 'published' }
        if (excludeId) {
            query._id = { $ne: excludeId }
        }
        return query
    }

    while (attempt < 8) {
        const exists = await Blog.exists(buildQuery(candidate))
        if (!exists) {
            return candidate
        }
        candidate = `${fallbackBase}-${Math.round(Math.random() * 100000)}`
        attempt += 1
    }

    return `${fallbackBase}-${Date.now()}`
}

const normalizeCategories = (incoming) => {
    if (Array.isArray(incoming)) {
        return [...new Set(incoming.filter(Boolean).map(String))]
    }
    if (!incoming) {
        return []
    }
    return [String(incoming)]
}

const buildBlogResponse = (blog) => ({
    _id: blog._id,
    title: blog.title,
    slug: blog.slug,
    status: blog.status,
    featuredImage: blog.featuredImage,
    categories: blog.categories,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    publishedAt: blog.publishedAt,
})

const publishedOnlyQuery = () => ({
    $or: [
        { status: { $exists: false } },
        { status: 'published' }
    ]
})
export const addBlog = async (req, res, next) => {
    try {
        const data = parseRequestBody(req.body?.data)
        const status = data.status === 'draft' ? 'draft' : 'published'
        const isPublished = status === 'published'

        const authorId = req.user?._id || data.author
        if (!authorId) {
            return next(handleError(401, 'Unauthorized.'))
        }

        const normalizedCategories = normalizeCategories(data.categories ?? data.category)
        if (isPublished && !normalizedCategories.length) {
            return next(handleError(400, 'At least one category is required to publish a blog.'))
        }

        let featuredImage = ''
        if (req.file) {
            const uploadResult = await cloudinary.uploader
                .upload(req.file.path, {
                    folder: 'Shabd-Setu-A-blogging-platform',
                    resource_type: 'auto'
                })
                .catch((error) => {
                    next(handleError(500, error.message))
                })

            if (!uploadResult) {
                return
            }

            featuredImage = uploadResult.secure_url
        }

        if (isPublished && !featuredImage) {
            return next(handleError(400, 'Featured image is required to publish a blog.'))
        }

        const title = typeof data.title === 'string' ? data.title.trim() : ''
        if (isPublished && title.length < 3) {
            return next(handleError(400, 'Title must be at least 3 characters long to publish a blog.'))
        }

        const blogContentRaw = typeof data.blogContent === 'string' ? data.blogContent : ''
        if (isPublished && stripHtml(blogContentRaw).length < 3) {
            return next(handleError(400, 'Blog content must be at least 3 characters long to publish a blog.'))
        }

        let slug = normalizeSlug(data.slug || title)
        if (isPublished) {
            if (!slug) {
                return next(handleError(400, 'Slug is required to publish a blog.'))
            }
            slug = await ensureUniquePublishedSlug(slug)
        }

        // AI Moderation: block unsafe blogs, show errors
        // Combine title and slug with content so single-line fields are also checked
        const combinedForModeration = `TITLE: ${data.title || ''}\nSLUG: ${data.slug || ''}\n${toPlainText(data.blogContent || '')}`;
        const moderationResult = await moderateBlog(combinedForModeration);
        if (!moderationResult.safe) {
            return res.status(400).json({
                success: false,
                message: 'Blog content failed moderation.',
                badLines: moderationResult.badLines,
                suggestions: moderationResult.suggestions,
                summary: moderationResult.summary,
            });
        }

        const blog = new Blog({
            author: authorId,
            categories: normalizedCategories,
            title,
            slug: slug || '',
            featuredImage,
            summary: typeof data.summary === 'string' ? data.summary.trim() : undefined,
            description: typeof data.description === 'string' ? data.description.trim().slice(0, 300) : '',
            blogContent: encode(blogContentRaw),
            status,
            publishedAt: isPublished ? new Date() : null,
        })

        await blog.save()

        if (isPublished) {
            try {
                await notifyFollowersNewPost({ authorId: req.user?._id, blogId: blog._id })
            } catch (notifyErr) {
                console.error('notifyFollowersNewPost error:', notifyErr)
            }
        }

        res.status(200).json({
            success: true,
            message: isPublished ? 'Blog published successfully.' : 'Draft saved successfully.',
            blog: buildBlogResponse(blog),
        })
    } catch (error) {
        if (error?.code === 11000) {
            return next(handleError(409, 'Slug is already in use by another published blog.'))
        }
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
        const data = parseRequestBody(req.body?.data)

        const blog = await Blog.findById(blogid)
        if (!blog) {
            return next(handleError(404, 'Data not found.'))
        }

        const status = data.status === 'draft' ? 'draft' : 'published'
        const isPublishing = status === 'published'
        const previousStatus = blog.status || 'published'

        const categories = normalizeCategories(data.categories ?? data.category)
        if (isPublishing && !categories.length) {
            return next(handleError(400, 'At least one category is required to publish a blog.'))
        }

        // AI Moderation: block unsafe blogs, show errors
        // Combine title and slug with content so single-line fields are also checked
        const combinedForModeration = `TITLE: ${data.title || ''}\nSLUG: ${data.slug || ''}\n${toPlainText(data.blogContent || '')}`;
        const moderationResult = await moderateBlog(combinedForModeration);
        if (!moderationResult.safe) {
            return res.status(400).json({
                success: false,
                message: 'Blog content failed moderation.',
                badLines: moderationResult.badLines,
                suggestions: moderationResult.suggestions,
                summary: moderationResult.summary,
            });
        }

        blog.categories = categories
        blog.title = typeof data.title === 'string' ? data.title.trim() : blog.title
        blog.slug = normalizeSlug(data.slug || data.title || blog.slug)
        blog.blogContent = encode(typeof data.blogContent === 'string' ? data.blogContent : '')

        let featuredImage = blog.featuredImage
        if (req.file) {
            const uploadResult = await cloudinary.uploader
                .upload(req.file.path, {
                    folder: 'Shabd-Setu-A-blogging-platform',
                    resource_type: 'auto'
                })
                .catch((error) => {
                    next(handleError(500, error.message))
                })

            if (!uploadResult) {
                return
            }

            featuredImage = uploadResult.secure_url
        }

        if (isPublishing && !featuredImage) {
            return next(handleError(400, 'Featured image is required to publish a blog.'))
        }

        const title = typeof data.title === 'string' ? data.title.trim() : ''
        if (isPublishing && title.length < 3) {
            return next(handleError(400, 'Title must be at least 3 characters long to publish a blog.'))
        }

        const blogContentRaw = typeof data.blogContent === 'string' ? data.blogContent : ''
        if (isPublishing && stripHtml(blogContentRaw).length < 3) {
            return next(handleError(400, 'Blog content must be at least 3 characters long to publish a blog.'))
        }

        let slug = normalizeSlug(data.slug || blog.slug || title)
        if (isPublishing) {
            if (!slug) {
                return next(handleError(400, 'Slug is required to publish a blog.'))
            }
            slug = await ensureUniquePublishedSlug(slug, blog._id)
        }

        blog.categories = categories
        blog.title = title
        blog.slug = slug || ''
        blog.blogContent = encode(blogContentRaw)
        blog.featuredImage = featuredImage
        if (typeof data.summary === 'string') {
            blog.summary = data.summary.trim()
        }
        if (typeof data.description === 'string') {
            blog.description = data.description.trim().slice(0, 300)
        }
        blog.status = status
        blog.publishedAt = isPublishing ? (blog.publishedAt || new Date()) : null

        await blog.save()

        if (isPublishing && previousStatus !== 'published') {
            try {
                await notifyFollowersNewPost({ authorId: req.user?._id, blogId: blog._id })
            } catch (notifyErr) {
                console.error('notifyFollowersNewPost error:', notifyErr)
            }
        }

        res.status(200).json({
            success: true,
            message: isPublishing ? 'Blog published successfully.' : 'Draft saved successfully.',
            blog: buildBlogResponse(blog),
        })

    } catch (error) {
        if (error?.code === 11000) {
            return next(handleError(409, 'Slug is already in use by another published blog.'))
        }
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
        const sortConfig = { status: 1, updatedAt: -1, createdAt: -1 }
        if (user.role === 'admin') {
                blog = await Blog.find().populate('author', 'name avatar role').populate('categories', 'name slug').sort(sortConfig).lean().exec()
        } else {
                blog = await Blog.find({ author: user._id }).populate('author', 'name avatar role').populate('categories', 'name slug').sort(sortConfig).lean().exec()
        }
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getDrafts = async (req, res, next) => {
    try {
        const userId = req.user?._id
        if (!userId) {
            return next(handleError(401, 'Unauthorized.'))
        }

        const drafts = await Blog.find({ author: userId, status: 'draft' })
            .select('title slug featuredImage updatedAt createdAt status categories')
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean()
            .exec()

        res.status(200).json({ drafts })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getBlog = async (req, res, next) => {
    try {
        const { slug } = req.params
    const blog = await Blog.findOne({ slug, ...publishedOnlyQuery() }).populate('author', 'name avatar role').populate('categories', 'name slug').lean().exec()
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
        const relatedBlog = await Blog.find({ categories: categoryId, slug: { $ne: blog }, ...publishedOnlyQuery() })
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

        const blogs = await Blog.find({ author: authorId, ...publishedOnlyQuery() })
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
            const blog = await Blog.find({ categories: categoryId, ...publishedOnlyQuery() }).populate('author', 'name avatar role').populate('categories', 'name slug').lean().exec()
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
            ],
            ...publishedOnlyQuery(),
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
    const blog = await Blog.find({ ...publishedOnlyQuery() }).populate('author', 'name avatar role').populate('categories', 'name slug').sort({ createdAt: -1 }).lean().exec()
        res.status(200).json({
            blog
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getFollowingFeed = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return next(handleError(401, 'Unauthorized.'));
        }

        const followingIds = await Follow.find({ follower: userId }).distinct('following');

        if (!followingIds.length) {
            return res.status(200).json({ blog: [] });
        }

        const blog = await Blog.find({ author: { $in: followingIds } })
            .populate('author', 'name avatar role')
            .populate('categories', 'name slug')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        res.status(200).json({ blog });
    } catch (error) {
        next(handleError(500, error.message));
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
            const currentBlog = await Blog.findOne({ slug: blog, ...publishedOnlyQuery() }).select('categories').lean().exec()
            const firstCategory = currentBlog?.categories && currentBlog.categories.length ? currentBlog.categories[0] : null
            if (!firstCategory) return res.status(200).json({ relatedBlog: [] })
            const related = await Blog.find({ categories: firstCategory, slug: { $ne: blog }, ...publishedOnlyQuery() })
                .populate('author', 'name avatar role')
                .populate('categories', 'name slug')
                .lean()
                .exec()
            return res.status(200).json({ relatedBlog: related })
        }

        // collect categories from user's liked/saved blogs
        const sourceBlogs = await Blog.find({ _id: { $in: sourceIds }, ...publishedOnlyQuery() }).select('categories').lean().exec()
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

        const candidates = await Blog.find({ categories: { $in: topCategoryIds }, slug: { $ne: blog }, ...publishedOnlyQuery() })
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
        const userId = req.user?._id;
        if (!userId) {
            return next(handleError(401, 'Unauthorized.'));
        }

        const fetchPopularFallback = async ({ fallback = 'popular', message }) => {
            const popular = await BlogLike.aggregate([
                { $group: { _id: '$blogid', likes: { $sum: 1 } } },
                { $sort: { likes: -1 } },
                { $limit: 12 }
            ]);

            const popularIds = popular.map((entry) => entry._id).filter(Boolean);
            if (!popularIds.length) {
                const recent = await Blog.find({})
                    .populate('author', 'name avatar role')
                    .populate('categories', 'name slug')
                    .sort({ createdAt: -1 })
                    .limit(12)
                    .lean()
                    .exec();

                return {
                    blog: recent,
                    meta: {
                        fallback: 'recent',
                        message: message || 'Check out the latest posts while we learn your preferences.',
                    }
                };
            }

            const fallbackBlogs = await Blog.find({ _id: { $in: popularIds } })
                .populate('author', 'name avatar role')
                .populate('categories', 'name slug')
                .lean()
                .exec();

            const order = new Map(popularIds.map((id, index) => [id.toString(), index]));
            fallbackBlogs.sort((a, b) => (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0));

            return {
                blog: fallbackBlogs,
                meta: {
                    fallback,
                    message: message || 'Explore popular posts to kick-start your personalized feed.',
                },
            };
        };

        const [likes, userDoc] = await Promise.all([
            BlogLike.find({ user: userId }).select('blogid createdAt').lean().exec(),
            User.findById(userId).select('savedBlogs').lean().exec()
        ]);

        const savedBlogIds = Array.isArray(userDoc?.savedBlogs) ? userDoc.savedBlogs : [];

        const interactionWeights = new Map();

        const now = Date.now();
        likes.forEach(({ blogid, createdAt }) => {
            if (!blogid) return;
            const id = blogid.toString();
            const ageInDays = Math.max(0, (now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const recencyBoost = 1 + Math.max(0, 30 - ageInDays) / 30; // boost recent likes within last month
            const weight = 2 * recencyBoost;
            interactionWeights.set(id, (interactionWeights.get(id) || 0) + weight);
        });

        savedBlogIds.forEach((blogId) => {
            const id = blogId?.toString();
            if (!id) return;
            interactionWeights.set(id, (interactionWeights.get(id) || 0) + 3);
        });

        const interactionIds = Array.from(interactionWeights.keys());

        if (!interactionIds.length) {
            const payload = await fetchPopularFallback({ fallback: 'popular' });
            return res.status(200).json(payload);
        }

        const seedBlogs = await Blog.find({ _id: { $in: interactionIds } })
            .select('categories author createdAt')
            .lean()
            .exec();

        const sourceBlogs = await Blog.find({ _id: { $in: interactionIds }, ...publishedOnlyQuery() })
            .select('categories')
            .lean()
            .exec();
        const categoryCount = new Map()
        sourceBlogs.forEach(sb => {
            const categories = sb?.categories || []
            categories.forEach(c => {
                const key = (c?._id || c)?.toString()
                if (!key) return
                categoryCount.set(key, (categoryCount.get(key) || 0) + 1)
            })
        })
        const categoryScores = new Map();
        const authorScores = new Map();

        seedBlogs.forEach((blog) => {
            const weight = interactionWeights.get(blog._id.toString()) || 1;
            const categories = blog?.categories || [];

            categories.forEach((category) => {
                const key = (category?._id || category)?.toString();
                if (!key) return;
                categoryScores.set(key, (categoryScores.get(key) || 0) + weight);
            });

            const authorKey = blog?.author?._id ? blog.author._id.toString() : blog?.author?.toString();
            if (authorKey) {
                authorScores.set(authorKey, (authorScores.get(authorKey) || 0) + weight * 0.5);
            }
        });

        const sortedCategories = Array.from(categoryScores.entries()).sort((a, b) => b[1] - a[1]);
        const sortedAuthors = Array.from(authorScores.entries()).sort((a, b) => b[1] - a[1]);

        const topCategoryIds = sortedCategories.slice(0, 5).map(([id]) => id);
        const topAuthorIds = sortedAuthors.slice(0, 5).map(([id]) => id);

        const candidateFilter = [];
        if (topCategoryIds.length) {
            candidateFilter.push({ categories: { $in: topCategoryIds } });
        }
        if (topAuthorIds.length) {
            candidateFilter.push({ author: { $in: topAuthorIds } });
        }

        if (!candidateFilter.length) {
            const payload = await fetchPopularFallback({
                fallback: 'insufficient-data',
                message: 'Interact with a few posts to unlock personalized recommendations.',
            });
            return res.status(200).json(payload);
        }

        const candidateDocs = await Blog.find({
            _id: { $nin: interactionIds },
            $or: candidateFilter,
        })
            .populate('author', 'name avatar role')
            .populate('categories', 'name slug')
            .sort({ createdAt: -1 })
            .limit(60)
            .lean()
            .exec();

        if (!candidateDocs.length) {
            const payload = await fetchPopularFallback({
                fallback: 'no-candidates',
                message: 'No fresh matches yet. Check back soon!',
            });
            return res.status(200).json(payload);
        }

        const candidateIds = candidateDocs.map((candidate) => candidate._id).filter(Boolean);
        let likeCounts = {};
        if (candidateIds.length) {
            const counts = await BlogLike.aggregate([
                { $match: { blogid: { $in: candidateIds } } },
                { $group: { _id: '$blogid', count: { $sum: 1 } } }
            ]);
            counts.forEach((entry) => {
                if (entry && entry._id) likeCounts[entry._id.toString()] = entry.count || 0;
            });
        }

        const scoredCandidates = candidateDocs.map((candidate) => {
            const categoryList = candidate?.categories || [];
            const baseCategoryScore = categoryList.reduce((sum, category) => {
                const key = (category?._id || category)?.toString();
                return sum + (categoryScores.get(key) || 0);
            }, 0);

            const authorKey = candidate?.author?._id ? candidate.author._id.toString() : candidate?.author?.toString();
            const authorAffinity = authorKey ? authorScores.get(authorKey) || 0 : 0;

            const popularity = likeCounts[candidate._id.toString()] || 0;
            const daysSincePublished = Math.max(0, (now - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const recencyBoost = 1 + Math.max(0, 30 - daysSincePublished) / 60; // gentle decay over ~2 months

            const score = baseCategoryScore + authorAffinity + popularity * 0.2 + recencyBoost;

            return { ...candidate, _score: score };
        });

        scoredCandidates.sort((a, b) => b._score - a._score);

        const personalized = scoredCandidates.slice(0, 12).map(({ _score, ...rest }) => rest);

        if (!personalized.length) {
            const payload = await fetchPopularFallback({
                fallback: 'empty',
                message: 'No personalized matches just yet.',
            });
            return res.status(200).json(payload);
        }

        res.status(200).json({
            blog: personalized,
            meta: {
                fallback: 'personalized',
                message: 'Curated from the posts you like and save.',
            },
        });
    } catch (error) {
        next(handleError(500, error.message));
    }
}