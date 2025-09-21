import express from 'express'
import {  Login,  Register ,Logout} from '../controllers/Auth.controller.js'

const AuthRoute = express.Router()

AuthRoute.post('/register', Register)
AuthRoute.post('/login', Login)
AuthRoute.get('/logout', Logout)

export default AuthRoute