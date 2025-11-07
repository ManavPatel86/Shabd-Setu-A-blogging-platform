import { handleError } from "../helpers/handleError.js"
import Follow from "../models/follow.model.js"
import User from "../models/user.model.js"

import { notifyFollow } from "../utils/notifyTriggers.js";

export const followUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const followerId = req.user._id?.toString();

        if (!followerId) {
            return next(handleError(401, 'Authentication required'));
        }

        // Prevent self-follow
        if (followerId === String(userId)) {
            return next(handleError(400, 'You cannot follow yourself.'));
        }

        // Check if target user exists
        const userToFollow = await User.findById(userId);
        if (!userToFollow) {
            return next(handleError(404, 'User not found.'));
        }

        // Toggle follow: if exists, unfollow; otherwise follow
        const existingFollow = await Follow.findOne({
            follower: followerId,
            following: userId
        });

        if (existingFollow) {
            // Unfollow
            await Follow.findByIdAndDelete(existingFollow._id);
            return res.status(200).json({ success: true, following: false, message: 'Unfollowed user.' });
        }

        // Create follow relationship
        const follow = await Follow.create({ follower: followerId, following: userId });

        // Notify the user being followed
        try {
            await notifyFollow({ followerId, targetUserId: userId });
        } catch (notifyErr) {
            // Log but do not fail the request
            console.error('notifyFollow error:', notifyErr);
        }

        return res.status(201).json({ success: true, following: true, message: 'Successfully followed user.' });
    } catch (error) {
        next(handleError(500, error.message));
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

