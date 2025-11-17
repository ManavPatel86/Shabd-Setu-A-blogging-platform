import express from 'express'
import { GoogleLogin, Login, Logout, Register, verifyOtp, resendOtp, verifyTwoFactor, requestPasswordReset, resetPassword, resendTwoFactorCode, getTwoFactorStatus, requestTwoFactorToggle, confirmTwoFactorToggle, checkUsernameAvailability} from '../controllers/Auth.controller.js'
import {authenticate} from '../middleware/authenticate.js';


const AuthRoute = express.Router()

AuthRoute.post('/register', Register)
AuthRoute.get('/username/check', checkUsernameAvailability)
AuthRoute.post('/login', Login)
AuthRoute.post('/two-factor/verify', verifyTwoFactor)
AuthRoute.post('/two-factor/resend', resendTwoFactorCode)
AuthRoute.get('/two-factor/status', authenticate, getTwoFactorStatus)
AuthRoute.post('/two-factor/start', authenticate, requestTwoFactorToggle)
AuthRoute.post('/two-factor/confirm', authenticate, confirmTwoFactorToggle)
AuthRoute.post('/google-login', GoogleLogin)
AuthRoute.get('/logout', Logout)

AuthRoute.post('/verify-otp', verifyOtp)
AuthRoute.post('/resend-otp', resendOtp)
AuthRoute.post('/password/forgot', requestPasswordReset)
AuthRoute.post('/password/reset', resetPassword)

export default AuthRoute