import cloudinary from "../config/cloudinary.js"
import { handleError } from "../helpers/handleError.js"
import User from "../models/user.model.js"
import Blog from "../models/blog.model.js"
import BlogLike from "../models/bloglike.model.js"
import Follow from "../models/follow.model.js"
import bcryptjs from 'bcryptjs'
import mongoose from "mongoose"

export const getUser = async (req, res, next) => {
    try {
        const { userid } = req.params
        const user = await User.findOne({ _id: userid }).lean().exec()
        if (!user) {
            next(handleError(404, 'User not found.'))
        }
        res.status(200).json({
            success: true,
            message: 'User data found.',
            user
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}


export const updateUser = async (req, res, next) => {
    try {
        const data = JSON.parse(req.body.data)
        const { userid } = req.params

        const user = await User.findById(userid)
        user.name = data.name
        user.email = data.email
        user.bio = data.bio

        if (data.password && data.password.length >= 8) {
            const hashedPassword = bcryptjs.hashSync(data.password)
            user.password = hashedPassword
        }

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

            user.avatar = uploadResult.secure_url
        }

        await user.save()

        const newUser = user.toObject({ getters: true })
        delete newUser.password
        res.status(200).json({
            success: true,
            message: 'Data updated.',
            user: newUser
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}


export const getAllUser = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return next(handleError(403, 'Only admins can access this resource.'))
        }

        const user = await User.find().sort({ createdAt: -1 })
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const deleteUser = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return next(handleError(403, 'Only admins can access this resource.'))
        }

        const { id } = req.params
        const user = await User.findByIdAndDelete(id)
        res.status(200).json({
            success: true,
            message: 'Data deleted.'
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getUserContributionActivity = async (req, res, next) => {
    try {
        const { userid } = req.params

        if (!userid) {
            return next(handleError(400, 'User id is required.'))
        }

        if (!mongoose.Types.ObjectId.isValid(userid)) {
            return next(handleError(400, 'Invalid user id.'))
        }

        const parsedDays = Number.parseInt(req.query.days, 10)
        const days = Number.isFinite(parsedDays) && parsedDays > 0
            ? Math.min(parsedDays, 365)
            : 365

        const timezone = 'UTC'

        const endDate = new Date()
        endDate.setUTCHours(23, 59, 59, 999)

        const startDate = new Date(endDate)
        startDate.setUTCDate(endDate.getUTCDate() - (days - 1))
        startDate.setUTCHours(0, 0, 0, 0)

        const rawActivity = await Blog.aggregate([
            {
                $match: {
                    author: new mongoose.Types.ObjectId(userid),
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                            timezone
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    count: 1
                }
            },
            {
                $sort: { date: 1 }
            }
        ])

        const activityMap = rawActivity.reduce((acc, item) => {
            acc[item.date] = item.count
            return acc
        }, {})

        const filledActivity = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            const isoDate = currentDate.toISOString().split('T')[0]
            filledActivity.push({
                date: isoDate,
                count: activityMap[isoDate] || 0
            })
            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }

        const totalBlogs = filledActivity.reduce((sum, entry) => sum + entry.count, 0)

        res.status(200).json({
            success: true,
            message: 'Contribution data fetched successfully.',
            range: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                days
            },
            totalBlogs,
            contributions: filledActivity
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getUserProfileOverview = async (req, res, next) => {
    try {
        const { userid } = req.params

        if (!userid) {
            return next(handleError(400, 'User id is required.'))
        }

        if (!mongoose.Types.ObjectId.isValid(userid)) {
            return next(handleError(400, 'Invalid user id.'))
        }

        const userObjectId = new mongoose.Types.ObjectId(userid)

        const [userDoc, blogs] = await Promise.all([
            User.findById(userObjectId)
                .select('name email avatar bio createdAt role')
                .lean()
                .exec(),
            Blog.find({ author: userObjectId })
                .select('title slug createdAt views featuredImage summary categories')
                .populate('categories', 'name slug')
                .sort({ createdAt: -1 })
                .lean()
                .exec()
        ])

        if (!userDoc) {
            return next(handleError(404, 'User not found.'))
        }

        const totalPosts = blogs.length
        const totalViews = blogs.reduce((sum, blog) => sum + (blog?.views || 0), 0)
        const averageViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0

        const blogIds = blogs.map((blog) => blog?._id).filter(Boolean)

        let totalLikes = 0
        const likeCountsByBlog = {}

        if (blogIds.length) {
            const likeCounts = await BlogLike.aggregate([
                {
                    $match: {
                        blogid: { $in: blogIds }
                    }
                },
                {
                    $group: {
                        _id: '$blogid',
                        count: { $sum: 1 }
                    }
                }
            ])

            likeCounts.forEach((entry) => {
                if (!entry?._id) {
                    return
                }
                const key = entry._id.toString()
                likeCountsByBlog[key] = entry.count || 0
                totalLikes += entry.count || 0
            })
        }

        const [followersCount, followingCount] = await Promise.all([
            Follow.countDocuments({ following: userObjectId }),
            Follow.countDocuments({ follower: userObjectId })
        ])

        const categoryStatsMap = new Map()

        blogs.forEach((blog) => {
            const categories = blog?.categories || []
            if (!Array.isArray(categories) || categories.length === 0) {
                return
            }

            categories.forEach((category) => {
                const key = (category?._id || category)?.toString()
                if (!key) {
                    return
                }

                const existing = categoryStatsMap.get(key) || {
                    name: category?.name || 'Uncategorized',
                    slug: category?.slug || '',
                    count: 0
                }

                existing.count += 1
                categoryStatsMap.set(key, existing)
            })
        })

        const topCategories = Array.from(categoryStatsMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map((category) => ({
                name: category.name,
                slug: category.slug,
                count: category.count,
                percentage: totalPosts > 0 ? Math.round((category.count / totalPosts) * 100) : 0
            }))

        const recentPosts = blogs.slice(0, 5).map((blog) => {
            const key = blog?._id?.toString() || ''
            const categories = blog?.categories || []
            const primaryCategory = categories.length > 0 ? categories[0] : null

            return {
                id: blog?._id,
                title: blog?.title,
                slug: blog?.slug,
                createdAt: blog?.createdAt,
                views: blog?.views || 0,
                likeCount: likeCountsByBlog[key] || 0,
                featuredImage: blog?.featuredImage || '',
                category: primaryCategory ? {
                    name: primaryCategory?.name,
                    slug: primaryCategory?.slug
                } : null,
                summary: blog?.summary || ''
            }
        })

        const topPostSource = blogs.slice().sort((a, b) => (b?.views || 0) - (a?.views || 0))[0]

        const topPost = topPostSource ? {
            id: topPostSource?._id,
            title: topPostSource?.title,
            slug: topPostSource?.slug,
            views: topPostSource?.views || 0,
            likeCount: likeCountsByBlog[topPostSource?._id?.toString()] || 0,
            createdAt: topPostSource?.createdAt,
            featuredImage: topPostSource?.featuredImage || '',
            category: topPostSource?.categories && topPostSource.categories.length > 0 ? {
                name: topPostSource.categories[0]?.name,
                slug: topPostSource.categories[0]?.slug
            } : null
        } : null

        res.status(200).json({
            success: true,
            user: {
                _id: userDoc._id,
                name: userDoc.name,
                email: userDoc.email,
                avatar: userDoc.avatar,
                bio: userDoc.bio,
                createdAt: userDoc.createdAt,
                role: userDoc.role
            },
            stats: {
                totalPosts,
                totalViews,
                totalLikes,
                followersCount,
                followingCount,
                averageViewsPerPost
            },
            highlights: {
                topPost,
                topCategories
            },
            recentPosts
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const updateUserBlacklistStatus = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return next(handleError(403, 'Only admins can access this resource.'))
        }

        const { userid } = req.params
        const { isBlacklisted } = req.body

        if (typeof isBlacklisted !== 'boolean') {
            return next(handleError(400, 'isBlacklisted must be provided as a boolean.'))
        }

        if (req.user._id?.toString() === userid) {
            return next(handleError(400, 'You cannot update blacklist status for your own account.'))
        }

        const targetUser = await User.findById(userid)

        if (!targetUser) {
            return next(handleError(404, 'User not found.'))
        }

        if (targetUser.role === 'admin' && isBlacklisted) {
            return next(handleError(400, 'Admin accounts cannot be blacklisted.'))
        }

        targetUser.isBlacklisted = isBlacklisted
        await targetUser.save()

        const responseUser = targetUser.toObject({ getters: true })
        delete responseUser.password

        res.status(200).json({
            success: true,
            message: `User ${isBlacklisted ? 'blacklisted' : 'removed from blacklist'} successfully.`,
            user: responseUser
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}