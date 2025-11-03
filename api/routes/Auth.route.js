import express from 'express'
import { GoogleLogin, Login, Logout, Register, verifyOtp, resendOtp} from '../controllers/Auth.controller.js'
import {authenticate} from '../middleware/authenticate.js';


const AuthRoute = express.Router()

AuthRoute.post('/register', Register)
AuthRoute.post('/login', Login)
AuthRoute.post('/google-login', GoogleLogin)
AuthRoute.get('/logout', Logout)

AuthRoute.post('/verify-otp', verifyOtp)
AuthRoute.post('/resend-otp', resendOtp)

export default AuthRoute