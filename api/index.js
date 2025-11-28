import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { Server as SocketServer } from "socket.io";
import AuthRoute from './routes/Auth.route.js'
import UserRoute from './routes/User.route.js'
import CategoryRoute from './routes/Category.route.js'
import BlogRoute from './routes/Blog.route.js'
import BlogAIRoute from './routes/blogAI.route.js'
import CommentRoute from './routes/Comment.route.js'
import BlogLikeRoute from './routes/Bloglike.route.js'
import ViewRoute from './routes/view.route.js'
import FollowRoute from './routes/follow.route.js'
import SaveRoute from './routes/save.route.js'
import NotificationRoute from './routes/notification.route.js'
import ModerationRoute from './routes/moderation.route.js'
import ReportsRoute from './routes/reports.route.js'
import AnalyticsRoute from './routes/Analytics.route.js'
import { initNotificationIO } from "./utils/createNotification.js";
import { createServer } from 'http';


dotenv.config()

const PORT = process.env.PORT
const app = express();
app.set('trust proxy', 1); // trust Render/other reverse proxies for secure cookies

// Disable caching for security (prevents BFCache)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});



// HTTPS Enforcement Middleware
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

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

const defaultOrigins = [
  'https://shabdsetu-git-deployment-manav-patels-projects-9e6ba397.vercel.app',
  'https://shabdsetu.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];
// Rate limiting specifically for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const defaultOrigins = ['https://shabdsetu.vercel.app', 'http://localhost:5173'];
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/^'+|'+$/g, ''))
  .filter(Boolean)
  .concat(defaultOrigins)
  .filter((value, index, array) => value && array.indexOf(value) === index);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Apply rate limiting only to login route
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth', AuthRoute)
app.use('/api/user', UserRoute)
app.use('/api/category', CategoryRoute)
app.use('/api/blog',BlogRoute)
app.use('/api/blog',BlogAIRoute)
app.use('/api/comment',CommentRoute)
app.use('/api/bloglike',BlogLikeRoute)
app.use('/api/view', ViewRoute)
app.use('/api/follow', FollowRoute)
app.use('/api/save', SaveRoute)
app.use('/api/notifications', NotificationRoute)
app.use('/api/moderate', ModerationRoute)
app.use('/api/report', ReportsRoute)
app.use('/api/analytics', AnalyticsRoute)


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