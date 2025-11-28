/**
 * Middleware to authenticate users using JWT tokens.
 * Verifies the access_token cookie and attaches user info to req.user.
 * Handles token expiration and invalid tokens appropriately.
 */
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { handleError } from '../helpers/handleError.js'

export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.access_token
        if (!token) {
            return next(handleError(401, 'Unauthorized.'))
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decodedToken._id).lean()

        if (!user) {
            return next(handleError(401, 'Unauthorized.'))
        }

        if (user.isBlacklisted) {
            return next(handleError(403, 'Account is blacklisted.'))
        }

        req.user = {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        }

        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(handleError(401, 'Invalid or expired token.'))
        }
        next(handleError(500, error.message))
    }
}
