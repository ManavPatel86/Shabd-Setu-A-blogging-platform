import { handleError } from "../helpers/handleError.js"
import Follow from "../models/follow.model.js"
import User from "../models/user.model.js"

export const followUser = async (req, res, next) => {
    try {
        const { userId } = req.params
        const followerId = req.user._id

        // Prevent self-follow
        if (followerId.toString() === userId) {
            return next(handleError(400, 'You cannot follow yourself.'))
        }

        // Check if user exists
        const userToFollow = await User.findById(userId)
        if (!userToFollow) {
            return next(handleError(404, 'User not found.'))
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: followerId,
            following: userId
        })

        if (existingFollow) {
            return next(handleError(400, 'You are already following this user.'))
        }

        // Create follow relationship
        const follow = new Follow({
            follower: followerId,
            following: userId
        })

        await follow.save()

        res.status(200).json({
            success: true,
            message: 'Successfully followed user.'
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const unfollowUser = async (req, res, next) => {
    try {
        const { userId } = req.params
        const followerId = req.user._id

        // Find and delete the follow relationship
        const follow = await Follow.findOneAndDelete({
            follower: followerId,
            following: userId
        })

        if (!follow) {
            return next(handleError(404, 'You are not following this user.'))
        }

        res.status(200).json({
            success: true,
            message: 'Successfully unfollowed user.'
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getFollowers = async (req, res, next) => {
    try {
        const { userId } = req.params

        const followers = await Follow.find({ following: userId })
            .populate('follower', 'name avatar email')
            .sort({ createdAt: -1 })
            .lean()
            .exec()

        res.status(200).json({
            success: true,
            followers: followers.map(f => f.follower),
            count: followers.length
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getFollowing = async (req, res, next) => {
    try {
        const { userId } = req.params

        const following = await Follow.find({ follower: userId })
            .populate('following', 'name avatar email')
            .sort({ createdAt: -1 })
            .lean()
            .exec()

        res.status(200).json({
            success: true,
            following: following.map(f => f.following),
            count: following.length
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const checkFollowStatus = async (req, res, next) => {
    try {
        const { userId } = req.params
        const followerId = req.user._id

        const isFollowing = await Follow.findOne({
            follower: followerId,
            following: userId
        })

        res.status(200).json({
            success: true,
            isFollowing: !!isFollowing
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const getFollowStats = async (req, res, next) => {
    try {
        const { userId } = req.params

        const followersCount = await Follow.countDocuments({ following: userId })
        const followingCount = await Follow.countDocuments({ follower: userId })

        res.status(200).json({
            success: true,
            followersCount,
            followingCount
        })
    } catch (error) {
        next(handleError(500, error.message))
    }
}
