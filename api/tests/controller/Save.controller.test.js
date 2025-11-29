import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { toggleSaveBlog, getSavedBlogs, getSaveStatus } from '../../controllers/save.controller.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';
import Blog from '../../models/blog.model.js';
import Category from '../../models/category.model.js';
import User from '../../models/user.model.js';
import { normalizeSavedBlogs } from '../../controllers/save.controller.js';

const buildRes = () => {
  const res = {
    statusCode: null,
    body: null,
  };

  res.status = jest.fn(function status(code) {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn(function json(payload) {
    res.body = payload;
    return res;
  });

  return res;
};

describe('Save Controller', () => {
  let saverUser;
  let blog;
  let category;

  const createReq = (overrides = {}) => ({
    user: { _id: saverUser?._id },
    params: {},
    body: {},
    ...overrides,
  });

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    saverUser = await User.create({
      name: 'Saver',
      email: 'saver@example.com',
      password: 'hashed-password',
      savedBlogs: [],
    });

    const author = await User.create({
      name: 'Author',
      email: 'author@example.com',
      password: 'author-password',
    });

    category = await Category.create({ name: 'General', slug: `general-${Date.now()}` });

    blog = await Blog.create({
      author: author._id,
      categories: [category._id],
      title: `Blog ${Date.now()}`,
      slug: `blog-${new mongoose.Types.ObjectId().toString()}`,
      blogContent: 'Sample content',
      featuredImage: 'http://example.com/image.jpg',
    });
  });

  describe('toggleSaveBlog', () => {
    it('saves a blog when not already saved', async () => {
      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isSaved).toBe(true);
      expect(res.body.savedCount).toBe(1);

      const updatedUser = await User.findById(saverUser._id);
      expect(updatedUser.savedBlogs.map(id => id.toString())).toContain(blog._id.toString());
    });

    it('removes a blog when already saved', async () => {
      saverUser.savedBlogs = [blog._id];
      await saverUser.save();

      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      expect(res.body.isSaved).toBe(false);
      expect(res.body.message).toBe('Removed from saved.');
      expect(res.body.savedCount).toBe(0);
    });

    it('validates ObjectId format', async () => {
      const req = createReq({ params: { blogId: 'not-an-id' } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid blog id.');
    });

    it('returns 404 when blog does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId().toString();
      const req = createReq({ params: { blogId: missingId } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Blog not found.');
    });

    it('returns 404 when user record is missing', async () => {
      const userId = saverUser._id;
      await User.deleteOne({ _id: userId });

      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found.');
    });

    it('handles unexpected errors through next', async () => {
      // findById is chained with .select in the controller, so mock an object with select -> Promise.reject
      const spy = jest.spyOn(User, 'findById').mockImplementationOnce(() => ({ select: () => Promise.reject(new Error('database exploded')) }));

      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await toggleSaveBlog(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('database exploded');

      spy.mockRestore();
    });
  });

  describe('getSavedBlogs', () => {
    it('returns populated saved blogs for the current user', async () => {
      saverUser.savedBlogs = [blog._id];
      await saverUser.save();

      const req = createReq();
      const res = buildRes();
      const next = jest.fn();

      await getSavedBlogs(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.savedBlogs).toHaveLength(1);
      expect(res.body.savedBlogs[0]._id.toString()).toBe(blog._id.toString());
    });

    it('filters out falsy saved blog entries', async () => {
      saverUser.savedBlogs = [null, undefined, blog._id];
      await saverUser.save();

      const req = createReq();
      const res = buildRes();
      const next = jest.fn();

      await getSavedBlogs(req, res, next);

      expect(res.body.savedBlogs).toHaveLength(1);
      expect(res.body.savedBlogs[0]._id.toString()).toBe(blog._id.toString());
    });

    it('returns 404 when user cannot be found', async () => {
      await User.deleteOne({ _id: saverUser._id });

      const req = createReq();
      const res = buildRes();
      const next = jest.fn();

      await getSavedBlogs(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found.');
    });
  });

  describe('getSaveStatus', () => {
    it('returns true when the blog is saved', async () => {
      saverUser.savedBlogs = [blog._id];
      await saverUser.save();

      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await getSaveStatus(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.isSaved).toBe(true);
    });

    it('returns false when the blog is not saved', async () => {
      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await getSaveStatus(req, res, next);

      expect(res.body.success).toBe(true);
      expect(res.body.isSaved).toBe(false);
    });

    it('validates blogId for save status lookups', async () => {
      const req = createReq({ params: { blogId: 'invalid' } });
      const res = buildRes();
      const next = jest.fn();

      await getSaveStatus(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid blog id.');
    });

    it('returns 404 when user does not exist', async () => {
      await User.deleteOne({ _id: saverUser._id });

      const req = createReq({ params: { blogId: blog._id.toString() } });
      const res = buildRes();
      const next = jest.fn();

      await getSaveStatus(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found.');
    });
  });

  describe('normalizeSavedBlogs helper', () => {
    it('returns the same array when already an array', () => {
      const arr = [1, 2, 3];
      expect(normalizeSavedBlogs(arr)).toBe(arr);
    });

    it('returns an empty array for non-arrays', () => {
      expect(normalizeSavedBlogs(null)).toEqual([]);
    });
  });
});
