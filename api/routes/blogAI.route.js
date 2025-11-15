import express from 'express'
import { generateCategorySuggestions, generateBlogSummary } from '../controllers/blogAI.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const BlogAIRoute = express.Router()

BlogAIRoute.post('/categorize', authenticate, generateCategorySuggestions)
BlogAIRoute.get('/summary/:blogId', authenticate, generateBlogSummary)

export default BlogAIRoute
