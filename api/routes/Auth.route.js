import express from 'express'
import { GoogleLogin, Login, Logout, Register, verifyOtp, resendOtp, requestPasswordReset, resetPassword, resendPasswordResetCode, checkUsernameAvailability } from '../controllers/Auth.controller.js'

const AuthRoute = express.Router()

AuthRoute.post('/register', Register)
AuthRoute.get('/username/check', checkUsernameAvailability)
AuthRoute.post('/login', Login)
AuthRoute.post('/google-login', GoogleLogin)
AuthRoute.get('/logout', Logout)

AuthRoute.post('/verify-otp', verifyOtp)
AuthRoute.post('/resend-otp', resendOtp)
AuthRoute.post('/password/forgot', requestPasswordReset)
AuthRoute.post('/password/resend', resendPasswordResetCode)
AuthRoute.post('/password/reset', resetPassword)

export default AuthRoute