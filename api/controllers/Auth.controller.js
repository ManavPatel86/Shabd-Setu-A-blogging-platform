import User from "../models/user.model.js"
import bcryptjs from 'bcryptjs'
import { handleError } from "../helpers/handleError.js";
import jwt from 'jsonwebtoken'
import { sendOtpEmail } from "../utils/mailer.js";
import { createAndSendOtp, resendOtp as resendOtpUtil, verifyOtp as verifyOtpUtil } from "../utils/Otp.js";


const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES || 5);

// Helper: minutes -> ms
const minutesToMs = mins => mins * 60 * 1000;

export const Register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(handleError(400, "Name, email and password are required."));
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            if (existingUser.isBlacklisted) {
                return next(handleError(403, "Your account has been blacklisted. Please contact support."));
            }
            return next(handleError(409, "User already registered."));
        }

        const hashedPassword = bcryptjs.hashSync(password);

        await createAndSendOtp({
            email: normalizedEmail,
            pendingUser: {
                name: name.trim(),
                passwordHash: hashedPassword,
                role: "user"
            },
            sendEmailFn: async ({ email: targetEmail, code, expiresAt }) => {
                await sendOtpEmail({ to: targetEmail, code, expiresAt });
            }
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email for verification.",
            data: {
                email: normalizedEmail,
                otpExpiryMinutes: OTP_EXPIRY_MINUTES,
                resendIntervalMinutes: RESEND_INTERVAL_MINUTES
            }
        });

    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(handleError(400, "Email and OTP are required."));
        }

        const normalizedEmail = email.trim().toLowerCase();

        const pendingUser = await verifyOtpUtil({ email: normalizedEmail, code: otp });

        if (!pendingUser) {
            return next(handleError(400, "No pending registration found. Please register again."));
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(200).json({ success: true, message: "Email already verified. Please sign in." });
        }

        if (!pendingUser.passwordHash || !pendingUser.name) {
            return next(handleError(400, "Pending registration data is incomplete. Please register again."));
        }

        const newUser = new User({
            name: pendingUser.name,
            email: normalizedEmail,
            password: pendingUser.passwordHash,
            role: pendingUser.role || "user",
            avatar: pendingUser.avatar
        });

        await newUser.save();

        return res.status(200).json({ success: true, message: "Email verified. Registration complete." });
    } catch (error) {
        if (error.code === "OTP_NOT_FOUND" || error.code === "OTP_EXPIRED" || error.code === "INVALID_OTP") {
            return next(handleError(400, error.message));
        }
        return next(handleError(500, error.message));
    }
};

export const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(handleError(400, "Email is required."));
        }

        const normalizedEmail = email.trim().toLowerCase();

        try {
            const otpDoc = await resendOtpUtil({
                email: normalizedEmail,
                sendEmailFn: async ({ email: targetEmail, code, expiresAt }) => {
                    await sendOtpEmail({ to: targetEmail, code, expiresAt });
                }
            });

            const nextAllowedAt = new Date(otpDoc.lastSentAt.getTime() + minutesToMs(RESEND_INTERVAL_MINUTES));

            return res.status(200).json({
                success: true,
                message: "OTP resent successfully.",
                data: {
                    lastSentAt: otpDoc.lastSentAt,
                    resendCount: otpDoc.resendCount,
                    nextAllowedAt,
                    otpExpiryMinutes: OTP_EXPIRY_MINUTES
                }
            });

        } catch (err) {
            if (err.code === "RESEND_TOO_SOON") {
                const waitSeconds = err.waitSeconds || RESEND_INTERVAL_MINUTES * 60;
                return next(handleError(429, `Resend allowed after ${waitSeconds} second(s).`));
            }
            if (err.code === "OTP_NOT_FOUND") {
                return next(handleError(404, err.message));
            }
            return next(handleError(400, err.message));
        }

    } catch (error) {
        next(handleError(500, error.message));
    }
};



export const Login = async (req, res) => {
    try {
        const { email, password } = req.body
        const normalizedEmail = email?.trim().toLowerCase()
        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(404).json({ message: 'Invalid login credentials.' });
        }
        if (user.isBlacklisted) {
            return res.status(403).json({ message: 'Your account has been blacklisted. Please contact support.' });
        }
        const comparePassword = await bcryptjs.compare(password, user.password)
        if (!comparePassword) {
            return res.status(404).json({ message: 'Invalid login credentials.' });
        }

        const token = jwt.sign({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        }, process.env.JWT_SECRET)

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/'
        })

        const newUser = user.toObject({ getters: true })
        delete newUser.password
        res.status(200).json({
            success: true,
            user: newUser,
            message: 'Login successful.'
        })

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const GoogleLogin = async (req, res, next) => {
    try {
        const { name, email, avatar } = req.body
        const normalizedEmail = email?.trim().toLowerCase();
        let user
        user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            //  create new user 
            const password = Math.random().toString()
            const hashedPassword = bcryptjs.hashSync(password)
            const newUser = new User({
                name,
                email: normalizedEmail,
                password: hashedPassword,
                avatar
            })

            user = await newUser.save()

        } else if (user.isBlacklisted) {
            return next(handleError(403, 'Your account has been blacklisted. Please contact support.'))
        }


        const token = jwt.sign({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        }, process.env.JWT_SECRET)


        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/'
        })

        const newUser = user.toObject({ getters: true })
        delete newUser.password
        res.status(200).json({
            success: true,
            user: newUser,
            message: 'Login successful.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const Logout = async (req, res, next) => {
    try {

        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/'
        })

        res.status(200).json({
            success: true,
            message: 'Logout successful.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}
