import express from 'express'
import { addcomment } from '../controllers/Comment.controller.js'

const CommentRouote = express.Router()

CommentRouote.post('/add', authenticate, addcomment)


export default CommentRouote