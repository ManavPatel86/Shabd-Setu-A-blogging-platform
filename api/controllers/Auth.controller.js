import mongoose from "mongoose";
import User from "../models/user.model.js"
import OtpCode from "../models/otpCode.model.js"
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
        console.log(req.body);
        const { name, email, password } = req.body
        const checkuser = await User.findOne({ email })
        if (checkuser) {
            // user already registered 
            next(handleError(409, 'User already registered.'))
        }

        const hashedPassword = bcryptjs.hashSync(password)
        // register user  
        const user = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false
        })

        const savedUser = await user.save();

        // create and send OTP
        await createAndSendOtp({
        userId: savedUser._id,
        email: savedUser.email,
        sendEmailFn: async ({ email, code, expiresAt }) => {
            // re-use your mailer
            await sendOtpEmail({ to: email, code, expiresAt });
        }
        });

        res.status(200).json({
            success: true,
            message: 'Registration successful. OTP sent to email for verification.',
            data: { userId: savedUser._id, email: savedUser.email, otpExpiryMinutes: OTP_EXPIRY_MINUTES }
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(handleError(400, 'Email and OTP are required.'));
        }

        const entry = await OtpCode.findOne({ email }).sort({ createdAt: -1 });
        if (!entry) {
            return next(handleError(404, 'OTP not found.'));
        }
        if (entry.expiresAt < new Date()) {
            return next(handleError(400, 'OTP expired.'));
        }
        if (entry.code !== otp) {
            entry.attempts += 1;
            await entry.save();
            return next(handleError(400, 'Invalid OTP.'));
        }

        await User.updateOne({ email }, { $set: { isVerified: true } });
        await OtpCode.deleteMany({ email });

        return res.status(200).json({ success: true, message: 'Email verified.' });
    } catch (error) {
        next(handleError(500, error.message));
    }
};

export const resendOtp = async (req, res, next) => {
    try {
        const { userId, email } = req.body;
        if (!userId || !email) return next(handleError(400, "Missing required fields: userId, email"));

        try {
        const otpDoc = await resendOtpUtil({
            userId,
            email,
            sendEmailFn: async ({ email, code, expiresAt }) => {
            await sendOtpEmail({ to: email, code, expiresAt });
            }
        });

        res.status(200).json({
            success: true,
            message: "OTP resent successfully.",
            data: { lastSentAt: otpDoc.lastSentAt, resendCount: otpDoc.resendCount, otpExpiryMinutes: OTP_EXPIRY_MINUTES }
        });

        } catch (err) {
        if (err.code === "RESEND_TOO_SOON") return next(handleError(429, err.message));
        return next(handleError(400, err.message));
        }

    } catch (error) {
        next(handleError(500, error.message));
    }
};



export const Login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: 'Invalid login credentials.' });
        }
        const comparePassword = await bcryptjs.compare(password, user.password)
        if (!comparePassword) {
            return res.status(404).json({ message: 'Invalid login credentials.' });
        }

        const token = jwt.sign({
            _id: user._id,
            name: user.name,
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
        res.status(500).json({ message: error.message });
    }
}

export const GoogleLogin = async (req, res, next) => {
    try {
        const { name, email, avatar } = req.body
        let user
        user = await User.findOne({ email })
        if (!user) {
            //  create new user 
            const password = Math.random().toString()
            const hashedPassword = bcryptjs.hashSync(password)
            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                avatar,
                isVerified: true
            })

            user = await newUser.save()

        }


        const token = jwt.sign({
            _id: user._id,
            name: user.name,
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
