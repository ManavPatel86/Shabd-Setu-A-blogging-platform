// /api/routes/moderation.route.js
// Routes for AI moderation endpoints

import express from 'express';
import * as moderationController from '../controllers/moderation.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Blog moderation (writer uploads blog)
router.post('/blog', authenticate, moderationController.moderateBlog);

// Comment moderation
router.post('/comment', authenticate, moderationController.moderateComment);

export default router;
