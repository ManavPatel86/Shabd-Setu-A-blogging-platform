import cloudinary from "../config/cloudinary.js"
import { handleError } from "../helpers/handleError.js"
import User from "../models/user.model.js"
import bcryptjs from 'bcryptjs'

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