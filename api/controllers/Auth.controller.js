import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { handleError } from "../helpers/handleError.js";
import jwt from "jsonwebtoken";
import { sendOtpEmail, sendPasswordResetEmail, sendTwoFactorCodeEmail, sendTwoFactorSetupEmail } from "../utils/mailer.js";
import { createAndSendOtp, resendOtp as resendOtpUtil, verifyOtp as verifyOtpUtil } from "../utils/Otp.js";
import { createVerificationCode, verifyCodeForPurpose, VERIFICATION_PURPOSES } from "../utils/verificationToken.js";
import { USERNAME_REQUIREMENTS_MESSAGE, normalizeUsername, isValidUsername, generateUniqueUsername, ensureUserHasUsername } from "../utils/username.js";

// Password validation requirements
const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
};

const PASSWORD_REQUIREMENTS_MESSAGE = `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).`;

const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, message: 'Password is required.' };
    }

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        return { isValid: false, message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long.` };
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
    }

    if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number.' };
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).' };
    }

    return { isValid: true };
};

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES || 5);
const TWO_FACTOR_OTP_EXPIRY_MINUTES = Number(process.env.TWO_FACTOR_OTP_EXPIRY_MINUTES || 5);
const PASSWORD_RESET_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 10);
const TWO_FACTOR_TOGGLE_EXPIRY_MINUTES = Number(process.env.TWO_FACTOR_TOGGLE_EXPIRY_MINUTES || 10);

// Helper: minutes -> ms
const minutesToMs = (mins) => mins * 60 * 1000;

export const checkUsernameAvailability = async (req, res, next) => {
    try {
        const username = normalizeUsername(req.query?.username || req.body?.username || "");

        if (!username) {
            return next(handleError(400, "Username is required."));
        }

        if (!isValidUsername(username)) {
            return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));
        }

        const exists = await User.exists({ username });
        return res.status(200).json({
            success: true,
            data: {
                available: !exists,
                username,
            },
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

const maskEmail = (email = "") => {
    const [local = "", domain = ""] = email.split("@");
    if (!local) return email;
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
};

const issueAuthCookie = (res, user) => {
    const token = jwt.sign(
        {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
    });

    return sanitizeUser(user);
};

const createTwoFactorChallenge = async (user) => {
    const normalizedEmail = user.email.trim().toLowerCase();
    const { code, expiresAt } = await createVerificationCode({
        email: normalizedEmail,
        userId: user._id,
        purpose: VERIFICATION_PURPOSES.TWO_FACTOR_LOGIN,
        ttlMinutes: TWO_FACTOR_OTP_EXPIRY_MINUTES,
    });

    await sendTwoFactorCodeEmail({ to: normalizedEmail, code, expiresAt });

    const challengeToken = jwt.sign(
        {
            type: "two-factor",
            userId: user._id,
            email: normalizedEmail,
        },
        process.env.JWT_SECRET,
        { expiresIn: `${Math.max(TWO_FACTOR_OTP_EXPIRY_MINUTES, 1)}m` }
    );

    return {
        twoFactorToken: challengeToken,
        expiresAt,
    };
};

export const Register = async (req, res, next) => {
    try {
        const { username, email, password, name } = req.body;

        if (!username || !email || !password) {
            return next(handleError(400, "Username, email and password are required."));
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return next(handleError(400, passwordValidation.message));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = normalizeUsername(username);

        if (!isValidUsername(normalizedUsername)) {
            return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));
        }

        const [existingUser, usernameTaken] = await Promise.all([
            User.findOne({ email: normalizedEmail }),
            User.findOne({ username: normalizedUsername })
        ]);

        if (existingUser) {
            return next(handleError(409, "User already registered."));
        }

        if (usernameTaken) {
            return next(handleError(409, "Username is already taken. Please choose another."));
        }

        const hashedPassword = bcryptjs.hashSync(password);
        const pendingDisplayName = typeof name === "string" && name.trim() ? name.trim() : normalizedUsername;

        await createAndSendOtp({
            email: normalizedEmail,
            pendingUser: {
                username: normalizedUsername,
                name: pendingDisplayName,
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

        if (!pendingUser.passwordHash || !pendingUser.username) {
            return next(handleError(400, "Pending registration data is incomplete. Please register again."));
        }

        const normalizedUsername = normalizeUsername(pendingUser.username);

        if (!isValidUsername(normalizedUsername)) {
            return next(handleError(400, USERNAME_REQUIREMENTS_MESSAGE));
        }

        const usernameTaken = await User.findOne({ username: normalizedUsername });
        if (usernameTaken) {
            return next(handleError(409, "This username was taken while you were verifying. Please register again with a different username."));
        }

        const newUser = new User({
            username: normalizedUsername,
            name: pendingUser.name || normalizedUsername,
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



export const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(handleError(400, "Email and password are required."));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return next(handleError(404, "Invalid login credentials."));
        }

        const comparePassword = await bcryptjs.compare(password, user.password || "");
        if (!comparePassword) {
            return next(handleError(404, "Invalid login credentials."));
        }

        if (user.isBlacklisted) {
            return next(handleError(403, "Account is blacklisted."));
        }

        const requiresTwoFactor = user.twoFactorEnabled === true;

        await ensureUserHasUsername(user, user.name || normalizedEmail);

        if (!requiresTwoFactor) {
            const safeUser = issueAuthCookie(res, user);
            return res.status(200).json({
                success: true,
                user: safeUser,
                message: "Login successful.",
                requiresTwoFactor: false,
            });
        }

        const { twoFactorToken } = await createTwoFactorChallenge(user);

        return res.status(200).json({
            success: true,
            requiresTwoFactor: true,
            twoFactorToken,
            message: "Enter the verification code sent to your email.",
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const verifyTwoFactor = async (req, res, next) => {
    try {
        const { token, code } = req.body;
        if (!token || !code) {
            return next(handleError(400, "Two-factor token and code are required."));
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return next(handleError(401, "Two-factor challenge expired. Please sign in again."));
        }

        if (payload?.type !== "two-factor" || !payload?.userId) {
            return next(handleError(400, "Invalid two-factor token."));
        }

        await verifyCodeForPurpose({
            email: payload.email,
            purpose: VERIFICATION_PURPOSES.TWO_FACTOR_LOGIN,
            code,
        });

        const user = await User.findById(payload.userId);
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        await ensureUserHasUsername(user);
        const safeUser = issueAuthCookie(res, user);

        return res.status(200).json({
            success: true,
            user: safeUser,
            message: "Login successful.",
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

export const resendTwoFactorCode = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return next(handleError(400, "Two-factor token is required."));
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return next(handleError(401, "Two-factor challenge expired. Please sign in again."));
        }

        if (payload?.type !== "two-factor" || !payload?.userId) {
            return next(handleError(400, "Invalid two-factor token."));
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        if (user.twoFactorEnabled !== true) {
            return next(handleError(400, "Two-factor authentication is not enabled for this account."));
        }

        const { twoFactorToken } = await createTwoFactorChallenge(user);

        return res.status(200).json({
            success: true,
            twoFactorToken,
            message: "We emailed you a new verification code.",
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const getTwoFactorStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?._id).select("twoFactorEnabled email");
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        return res.status(200).json({
            success: true,
            data: {
                enabled: user.twoFactorEnabled === true,
                email: maskEmail(user.email),
            },
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const requestTwoFactorToggle = async (req, res, next) => {
    try {
        const action = String(req.body?.action || "").toLowerCase();
        if (!["enable", "disable"].includes(action)) {
            return next(handleError(400, "Action must be either enable or disable."));
        }

        const user = await User.findById(req.user?._id);
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        const desiredState = action === "enable";
        const alreadyInState = desiredState ? user.twoFactorEnabled === true : user.twoFactorEnabled !== true;
        if (alreadyInState) {
            return next(handleError(400, desiredState ? "Two-step verification is already on." : "Two-step verification is already off."));
        }

        const normalizedEmail = user.email.trim().toLowerCase();
        const { expiresAt, code } = await createVerificationCode({
            email: normalizedEmail,
            userId: user._id,
            purpose: VERIFICATION_PURPOSES.TWO_FACTOR_TOGGLE,
            ttlMinutes: TWO_FACTOR_TOGGLE_EXPIRY_MINUTES,
            meta: { action },
        });

        const actionDescription = desiredState ? "turn on" : "turn off";
        await sendTwoFactorSetupEmail({
            to: normalizedEmail,
            code,
            actionDescription,
        });

        return res.status(200).json({
            success: true,
            message: `Enter the code sent to ${maskEmail(normalizedEmail)} to confirm this change.`,
            data: {
                action,
                expiresAt,
                email: maskEmail(normalizedEmail),
            },
        });
    } catch (error) {
        return next(handleError(500, error.message));
    }
};

export const confirmTwoFactorToggle = async (req, res, next) => {
    try {
        const action = String(req.body?.action || "").toLowerCase();
        const code = String(req.body?.code || "").trim();

        if (!action || !code) {
            return next(handleError(400, "Action and verification code are required."));
        }

        if (!["enable", "disable"].includes(action)) {
            return next(handleError(400, "Action must be either enable or disable."));
        }

        const user = await User.findById(req.user?._id);
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        const normalizedEmail = user.email.trim().toLowerCase();
        const record = await verifyCodeForPurpose({
            email: normalizedEmail,
            purpose: VERIFICATION_PURPOSES.TWO_FACTOR_TOGGLE,
            code,
        });

        const recordedAction = record?.meta?.action;
        if (recordedAction && recordedAction !== action) {
            return next(handleError(400, "This verification code was issued for a different action."));
        }

        const enableTwoFactor = action === "enable";
        user.twoFactorEnabled = enableTwoFactor;
        await user.save();

        const safeUser = sanitizeUser(user);

        return res.status(200).json({
            success: true,
            message: enableTwoFactor
                ? "Two-step verification is now on."
                : "Two-step verification has been turned off.",
            data: { enabled: enableTwoFactor },
            user: safeUser,
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
            const fallbackUsername = await generateUniqueUsername(name || normalizedEmail);
            const newUser = new User({
                username: fallbackUsername,
                name,
                email: normalizedEmail,
                password: hashedPassword,
                avatar
            })

            user = await newUser.save()

        } else {
            await ensureUserHasUsername(user, name || normalizedEmail);
        }


        const token = jwt.sign({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar
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

import VerificationToken from "../models/verificationToken.model.js";
import PasswordResetRequest from "../models/PasswordResetRequest.model.js";

export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(handleError(400, "Email is required."));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Check number of requests in the last 24 hours in PasswordResetRequest collection
            const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours
            const recentRequestsCount = await PasswordResetRequest.countDocuments({
                email: normalizedEmail,
                requestedAt: { $gte: timeWindow },
            });

            if (recentRequestsCount >= 3) {
                return next(handleError(429, "You have exceeded the maximum number of password reset requests for this email. Please try again after 24hrs."));
            }

            // Log this request
            await PasswordResetRequest.create({ email: normalizedEmail });

            const { code } = await createVerificationCode({
                email: normalizedEmail,
                userId: user._id,
                purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
                ttlMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
            });

            await sendPasswordResetEmail({ to: normalizedEmail, code });
        }

        return res.status(200).json({
            success: true,
            message: "If an account matches that email, a reset code has been sent.",
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

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return next(handleError(400, passwordValidation.message));
        }

        const normalizedEmail = email.trim().toLowerCase();

        await verifyCodeForPurpose({
            email: normalizedEmail,
            purpose: VERIFICATION_PURPOSES.PASSWORD_RESET,
            code: otp,
        });

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return next(handleError(404, "Account not found."));
        }

        user.password = bcryptjs.hashSync(newPassword);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please sign in.",
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
