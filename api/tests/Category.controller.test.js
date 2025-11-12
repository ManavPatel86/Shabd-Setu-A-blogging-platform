import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import Category from '../models/category.model.js';
import { connectTestDB, closeTestDB, clearTestDB } from './setup/testDb.js';
import { addCategory, showCategory, updateCategory, deleteCategory, getAllCategory } from '../controllers/Category.controller.js';

describe('Category Controller Tests', () => {
  let req, res, next;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    req = {
      body: {},
      params: {},
    };

    const jsonMock = function(data) {
      this._jsonData = data;
      return this;
    };

    const statusMock = function(code) {
      this._statusCode = code;
      return this;
    };

    res = {
      _statusCode: null,
      _jsonData: null,
      status: statusMock,
      json: jsonMock,
    };

    next = jest.fn((error) => {
      if (error) {
        res._error = error;
      }
    });
  });

  describe('addCategory', () => {
    it('should create a new category successfully', async () => {
      req.body = {
        name: 'Technology',
        slug: 'technology',
      };

      await addCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Category added successfully.');

      // Verify category was created
      const category = await Category.findOne({ slug: 'technology' });
      expect(category).toBeTruthy();
      expect(category.name).toBe('Technology');
    });

    it('should handle duplicate category slug', async () => {
      // Create first category
      await Category.create({ name: 'Tech', slug: 'tech' });

      // Try to create duplicate
      req.body = {
        name: 'Technology',
        slug: 'tech',
      };

      await addCategory(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(400);
      expect(res._error.message).toBe('Category slug already exists.');
    });
  });

  describe('showCategory', () => {
    it('should get category by id successfully', async () => {
      const category = await Category.create({
        name: 'Science',
        slug: 'science',
      });

      req.params.categoryid = category._id.toString();

      await showCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.category.name).toBe('Science');
      expect(res._jsonData.category.slug).toBe('science');
    });

    it('should return error for non-existent category', async () => {
      const mongoose = await import('mongoose');
      req.params.categoryid = new mongoose.Types.ObjectId().toString();

      await showCategory(req, res, next);

      expect(res._error).toBeDefined();
      expect(res._error.statusCode).toBe(404);
      expect(res._error.message).toBe('Data not found.');
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const category = await Category.create({
        name: 'Old Name',
        slug: 'old-slug',
      });

      req.params.categoryid = category._id.toString();
      req.body = {
        name: 'New Name',
        slug: 'new-slug',
      };

      await updateCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Category updated successfully.');
      expect(res._jsonData.category.name).toBe('New Name');
      expect(res._jsonData.category.slug).toBe('new-slug');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const category = await Category.create({
        name: 'To Delete',
        slug: 'to-delete',
      });

      req.params.categoryid = category._id.toString();

      await deleteCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.success).toBe(true);
      expect(res._jsonData.message).toBe('Category Deleted successfully.');

      // Verify deletion
      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });
  });

  describe('getAllCategory', () => {
    it('should return all categories', async () => {
      await Category.create([
        { name: 'Tech', slug: 'tech' },
        { name: 'Science', slug: 'science' },
        { name: 'Sports', slug: 'sports' },
      ]);

      await getAllCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.category).toHaveLength(3);
    });

    it('should return empty array when no categories exist', async () => {
      await getAllCategory(req, res, next);

      expect(res._statusCode).toBe(200);
      expect(res._jsonData.category).toHaveLength(0);
    });
  });
});
