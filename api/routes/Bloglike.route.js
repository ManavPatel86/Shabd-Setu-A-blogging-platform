import express from 'express'
import { doLike, likeCount } from '../controllers/bloglike.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const BlogLikeRoute = express.Router()

BlogLikeRoute.post('/do-like', authenticate, doLike)
BlogLikeRoute.get('/get-like/:blogid', likeCount)
BlogLikeRoute.get('/get-like/:blogid/:userid', likeCount)

export default BlogLikeRoute