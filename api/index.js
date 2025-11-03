import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import AuthRoute from './routes/Auth.route.js'
import UserRoute from './routes/User.route.js'
import CategoryRoute from './routes/Category.route.js'
import BlogRoute from './routes/Blog.route.js'


import CommentRouote from './routes/Comment.route.js'
import BlogLikeRoute from './routes/Bloglike.route.js'
import ViewRoute from './routes/view.route.js'
import FollowRoute from './routes/follow.route.js'

import { log } from 'console';
import Blog from './models/blog.model.js';

dotenv.config()

const PORT = process.env.PORT
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials : true  
}))


// route setup
app.use('/api/auth', AuthRoute)
app.use('/api/user', UserRoute )
app.use('/api/category', CategoryRoute)
app.use('api/category', CategoryRoute)
app.use('/api/blog',BlogRoute)
app.use('/api/comment',CommentRouote)
app.use('/api/bloglike',BlogLikeRoute)
app.use('/api/view', ViewRoute)
app.use('/api/follow', FollowRoute)


mongoose.connect(process.env.MONGODB_CONN,{dbName:'Shabd-Setu'})
    .then(()=>console.log('Database connected.'))
    .catch(err=>console.log('Database connection failed.',err))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal server error.'
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})