import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { handleError } from "../helpers/handleError.js";
import jwt from "jsonwebtoken";
import * as mailer from "../utils/mailer.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import { createAndSendOtp, resendOtp as resendOtpUtil, verifyOtp as verifyOtpUtil } from "../utils/Otp.js";
import { createVerificationCode, resendVerificationCode, verifyCodeForPurpose, VERIFICATION_PURPOSES } from "../utils/verificationToken.js";
import { USERNAME_REQUIREMENTS_MESSAGE, normalizeUsername, isValidUsername, isUsernameAvailable, generateUsernameSuggestion } from "../utils/username.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES) || 1;
const PASSWORD_RESET_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 10);

const minutesToMs = (mins) => mins * 60 * 1000;

const getCookieConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true" || isProduction,
        sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: "/"
    };
};

export const checkUsernameAvailability = async (req, res, next) => {
    try {
        const rawUsername = req.query?.username || req.body?.username || "";
        const username = normalizeUsername(rawUsername);
        if (!username) return next(handleError(400, "Username is required."));
        if (!isValidUsername(username)) return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));

        const available = await isUsernameAvailable(username);
        return res.status(200).json({
            success: true,
            data: { available, username }
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

const sanitizeUser = (userDoc) => {
    if (!userDoc) return null;
    const obj = userDoc.toObject({ getters: true });
    delete obj.password;
    return obj;
};

const issueAuthCookie = (res, user) => {
    const token = jwt.sign(
        {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.cookie("access_token", token, getCookieConfig());
    return { token, user: sanitizeUser(user) };
};

export const Register = async (req, res, next) => {
    try {
        res.clearCookie("access_token", getCookieConfig());
        const { name, email, password, username } = req.body;

        const cleanedName = typeof name === "string" ? name.trim() : "";
        if (!cleanedName || !email || !password || !username) {
            return next(handleError(400, "Name, email, password, and username are required."));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = normalizeUsername(username);

        if (!isValidUsername(normalizedUsername)) {
            return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));
        }

        const usernameAvailable = await isUsernameAvailable(normalizedUsername);
        if (!usernameAvailable) {
            return next(handleError(409, "Username is already taken. Please choose another."));
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return next(handleError(409, "User already registered."));
        }

        const hashedPassword = bcryptjs.hashSync(password);
        const pendingDisplayName = cleanedName;

        await createAndSendOtp({
            email: normalizedEmail,
            pendingUser: {
                username: normalizedUsername,
                name: pendingDisplayName,
                passwordHash: hashedPassword,
                role: "user"
            },
            sendEmailFn: async ({ email: targetEmail, code, expiresAt }) => {
                await mailer.sendOtpEmail({ to: targetEmail, code, expiresAt });
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
        if (!email || !otp) return next(handleError(400, "Email and OTP are required."));

        const normalizedEmail = email.trim().toLowerCase();
        const pendingUser = await verifyOtpUtil({ email: normalizedEmail, code: otp });

        if (!pendingUser) return next(handleError(400, "No pending registration found. Please register again."));

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(200).json({ success: true, message: "Email already verified. Please sign in." });
        }

        if (!pendingUser.passwordHash) {
            return next(handleError(400, "Pending registration data is incomplete. Please register again."));
        }

        let normalizedUsername = pendingUser.username ? normalizeUsername(pendingUser.username) : "";
        if (!normalizedUsername) {
            normalizedUsername = await generateUsernameSuggestion(pendingUser.name || normalizedEmail);
        }

        if (!isValidUsername(normalizedUsername)) {
            return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));
        }

        const usernameAvailable = await isUsernameAvailable(normalizedUsername);
        if (!usernameAvailable) {
            return next(handleError(409, "This username was taken while you were verifying. Please register again with a different username."));
        }

        const safeName = typeof pendingUser.name === "string" ? pendingUser.name.trim() : "";

        const newUser = new User({
            username: normalizedUsername,
            name: safeName || normalizedUsername,
            email: normalizedEmail,
            password: pendingUser.passwordHash,
            role: pendingUser.role || "user",
            avatar: pendingUser.avatar
        });

        await newUser.save();

        return res.status(200).json({ success: true, message: "Email verified. Registration complete." });
    } catch (error) {
        if (["OTP_NOT_FOUND", "OTP_EXPIRED", "INVALID_OTP"].includes(error.code)) {
            return next(handleError(400, error.message));
        }
        return next(handleError(500, error.message));
    }
};

export const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(handleError(400, "Email is required."));

        const normalizedEmail = email.trim().toLowerCase();

        try {
            const otpDoc = await resendOtpUtil({
                email: normalizedEmail,
                sendEmailFn: async ({ email: targetEmail, code, expiresAt }) => {
                    await mailer.sendOtpEmail({ to: targetEmail, code, expiresAt });
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
        if (!next) {
            return res.status(500).json({ success: false, message: error.message });
        }
        return next(handleError(500, error.message));
    }
};

export const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            if (!next) {
                return res.status(400).json({ success: false, message: "Email and password are required." });
            }
            return next(handleError(400, "Email and password are required."));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            if (!next) {
                return res.status(404).json({ success: false, message: "Invalid login credentials." });
            }
            return next(handleError(404, "Invalid login credentials."));
        }

        const comparePassword = await bcryptjs.compare(password, user.password || "");
        if (!comparePassword) {
            if (!next) {
                return res.status(404).json({ success: false, message: "Invalid login credentials." });
            }
            return next(handleError(404, "Invalid login credentials."));
        }

        if (user.isBlacklisted) {
            if (!next) {
                return res.status(403).json({ success: false, message: "Account is blacklisted." });
            }
            return next(handleError(403, "Account is blacklisted."));
        }

        const { token, user: safeUser } = issueAuthCookie(res, user);
        return res.status(200).json({
            success: true,
            token,
            user: safeUser,
            message: "Login successful."
        });
    } catch (error) {
        if (!next) {
            return res.status(500).json({ success: false, message: error.message });
        }
        return next(handleError(500, error.message));
    }
};

export const GoogleLogin = async (req, res, next) => {
    try {
        const { name, email, avatar } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });

        const fallbackSeed = name || normalizedEmail;

        if (!user) {
            const password = Math.random().toString();
            const hashedPassword = bcryptjs.hashSync(password);
            const suggestedUsername = await generateUsernameSuggestion(fallbackSeed);

            const newUser = new User({
                username: suggestedUsername,
                name,
                email: normalizedEmail,
                password: hashedPassword,
                avatar
            });

            user = await newUser.save();
        } else if (!user.username) {
            const suggestedUsername = await generateUsernameSuggestion(fallbackSeed);
            user.username = suggestedUsername;
            await user.save();
        }

        const { token, user: safeUser } = issueAuthCookie(res, user);

        return res.status(200).json({
            success: true,
            token,
            user: safeUser,
            message: "Login successful."
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const Logout = async (req, res, next) => {
    try {
        res.clearCookie("access_token", getCookieConfig());

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(handleError(400, "Email is required."));

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            const { code } = await createVerificationCode({
                email: normalizedEmail,
                userId: user._id,
                purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
                ttlMinutes: PASSWORD_RESET_EXPIRY_MINUTES
            });

            await mailer.sendPasswordResetEmail({ to: normalizedEmail, code });
        }

        return res.status(200).json({
            success: true,
            message: "If an account matches that email, a reset code has been sent.",
            data: {
                email: normalizedEmail,
                otpExpiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
                resendIntervalMinutes: RESEND_INTERVAL_MINUTES
            }
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const resendPasswordResetCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(handleError(400, "Email is required."));

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account matches that email, a reset code has been resent.",
                data: {
                    email: normalizedEmail,
                    otpExpiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
                    resendIntervalMinutes: RESEND_INTERVAL_MINUTES
                }
            });
        }

        try {
            const { code } = await resendVerificationCode({
                email: normalizedEmail,
                purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
                ttlMinutes: PASSWORD_RESET_EXPIRY_MINUTES
            });

            await mailer.sendPasswordResetEmail({ to: normalizedEmail, code });
        } catch (error) {
            if (error.code === "VERIFICATION_NOT_FOUND") {
                return next(handleError(404, "No reset request found. Please request a code first."));
            }
            if (error.code === "RESEND_TOO_SOON") {
                return next(handleError(429, error.message));
            }
            return next(handleError(500, error.message));
        }

        return res.status(200).json({
            success: true,
            message: "Reset code resent. Check your email.",
            data: {
                email: normalizedEmail,
                otpExpiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
                resendIntervalMinutes: RESEND_INTERVAL_MINUTES
            }
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return next(handleError(400, "Email, OTP, and new password are required."));
        }

        if (newPassword.length < 8) {
            return next(handleError(400, "Password must be at least 8 characters."));
        }

        const normalizedEmail = email.trim().toLowerCase();

        await verifyCodeForPurpose({
            email: normalizedEmail,
            purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
            code: otp
        });

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        // Check if new password is same as current password
        const isSamePassword = await bcryptjs.compare(newPassword, user.password || "");
        if (isSamePassword) {
            return next(handleError(400, "New password cannot be the same as your current password."));
        }

        user.password = bcryptjs.hashSync(newPassword);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please sign in."
        });
    } catch (error) {
        if (
            error.code === "VERIFICATION_NOT_FOUND" ||
            error.code === "VERIFICATION_INVALID" ||
            error.code === "VERIFICATION_EXPIRED"
        ) {
            return next(handleError(400, error.message));
        }
        return next(handleError(500, error.message));
    }
};

export { sanitizeUser };