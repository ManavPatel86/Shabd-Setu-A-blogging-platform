import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import { Server as SocketServer } from "socket.io";
import AuthRoute from './routes/Auth.route.js'
import UserRoute from './routes/User.route.js'
import CategoryRoute from './routes/Category.route.js'
import BlogRoute from './routes/Blog.route.js'
import CommentRoute from './routes/Comment.route.js'
import BlogLikeRoute from './routes/Bloglike.route.js'
import ViewRoute from './routes/view.route.js'
import FollowRoute from './routes/follow.route.js'
import SaveRoute from './routes/save.route.js'
import NotificationRoute from './routes/notification.route.js'
import ModerationRoute from './routes/moderation.route.js'
import ReportsRoute from './routes/reports.route.js'
import { initNotificationIO } from "./utils/createNotification.js";
import { createServer } from 'http';

import { log } from 'console';
import Blog from './models/blog.model.js';

dotenv.config()

const PORT = process.env.PORT
const app = express()
const server = createServer(app)

const io = new SocketServer(server, { cors: { origin: "*" } });

initNotificationIO(io);

io.on('connection', (socket) => {

    socket.on('auth:identify', (userId) => {
        if (userId) {
            socket.join(String(userId));
        }
    });
});

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim().replace(/^'+|'+$/g, '')).filter(Boolean)
app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : true,
        credentials: true,
    })
)



app.use('/api/auth', AuthRoute)
app.use('/api/user', UserRoute)
app.use('/api/category', CategoryRoute)
app.use('/api/blog',BlogRoute)
app.use('/api/comment',CommentRoute)
app.use('/api/bloglike',BlogLikeRoute)
app.use('/api/view', ViewRoute)
app.use('/api/follow', FollowRoute)
app.use('/api/save', SaveRoute)
app.use('/api/notifications', NotificationRoute)
app.use('/api/moderate', ModerationRoute)
app.use('/api/report', ReportsRoute)


mongoose.connect(process.env.MONGODB_CONN,{dbName:'Shabd-Setu'})
    .then(()=>console.log('Database connected.'))
    .catch(err=>console.log('Database connection failed.',err))

server.listen(PORT, () => {
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