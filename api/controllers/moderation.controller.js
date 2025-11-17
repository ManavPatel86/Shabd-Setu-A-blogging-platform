// /api/controllers/moderation.controller.js
// Handles moderation API endpoints

import { moderateBlog as checkBlogModeration, moderateComment as checkCommentModeration } from '../utils/moderation.js';

/**
 * POST /api/moderate/blog
 * Moderates a blog post before publishing
 * Expects: { content }
 * Returns: { safe, badLines, suggestions }
 */
export const moderateBlog = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required.' });
    const result = await checkBlogModeration(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Moderation failed.' });
  }
};

/**
 * POST /api/moderate/comment
 * Moderates a comment before posting
 * Expects: { text }
 * Returns: { safe, badLines, suggestions }
 */
export const moderateComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required.' });
    const result = await checkCommentModeration(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Moderation failed.' });
  }
};
