import express from 'express'
import { addBlog, deleteBlog, editBlog, getAllBlogs, getBlog, getBlogByCategory, getBlogsByAuthor, getRelatedBlog, search, showAllBlog, updateBlog, getPersonalizedRelated, getPersonalizedHome } from '../controllers/blog.controller.js'
import upload from '../config/multer.js'
import { authenticate } from '../middleware/authenticate.js'

const BlogRoute = express.Router()

BlogRoute.post('/add', authenticate, upload.single('file'), addBlog)
BlogRoute.get('/edit/:blogid', authenticate, editBlog)
BlogRoute.put('/update/:blogid', authenticate, upload.single('file'), updateBlog)
BlogRoute.delete('/delete/:blogid', authenticate, deleteBlog)
BlogRoute.get('/get-all', authenticate, showAllBlog)

BlogRoute.get('/get-blog/:slug', getBlog)
BlogRoute.get('/get-related-blog/:category/:blog', getRelatedBlog)
BlogRoute.get('/get-personalized-related/:blog', authenticate, getPersonalizedRelated)
BlogRoute.get('/get-personalized-home', authenticate, getPersonalizedHome)
BlogRoute.get('/get-blog-by-category/:category', getBlogByCategory)
BlogRoute.get('/search', search)
BlogRoute.get('/author/:authorId', getBlogsByAuthor)

BlogRoute.get('/blogs', getAllBlogs)

export default BlogRoute