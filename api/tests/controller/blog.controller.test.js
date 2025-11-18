import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import mongoose from 'mongoose'
import Blog from '../../models/blog.model.js'
import Category from '../../models/category.model.js'
import User from '../../models/user.model.js'
import cloudinary from '../../config/cloudinary.js'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'

// Mock the notifyTriggers module before importing the controller
jest.unstable_mockModule('../../utils/notifyTriggers.js', () => ({
  notifyFollowersNewPost: jest.fn().mockResolvedValue(undefined),
}))

const {
  addBlog,
  editBlog,
  updateBlog,
  deleteBlog,
  showAllBlog,
  getBlog,
  getRelatedBlog,
  getBlogsByAuthor,
  getBlogByCategory,
  search,
  getAllBlogs,
  escapeRegex,
} = await import('../../controllers/blog.controller.js')

const buildRes = () => {
  const res = {}
  res.status = function status(code) {
    this._statusCode = code
    return this
  }
  res.json = function json(payload) {
    this._jsonData = payload
    return this
  }
  return res
}

const buildNext = (res) => (error) => {
  res._error = error
}

describe('Blog Controller', () => {
  let originalUpload
  let uploadCalls = 0
  let author
  let admin
  let categoryOne
  let categoryTwo

  beforeAll(async () => {
    await connectTestDB()
    originalUpload = cloudinary.uploader.upload
    cloudinary.uploader.upload = (...args) => {
      uploadCalls += 1
      return { secure_url: 'https://image.example/test.jpg' }
    }
  })

  afterAll(async () => {
    cloudinary.uploader.upload = originalUpload
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    uploadCalls = 0
    // Restore default successful upload mock
    cloudinary.uploader.upload = (...args) => {
      uploadCalls += 1
      return { secure_url: 'https://image.example/test.jpg' }
    }

    author = await User.create({
      name: 'Author User',
      email: 'author@example.com',
      password: 'hashed',
      role: 'user',
    })

    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed',
      role: 'admin',
    })

    categoryOne = await Category.create({ name: 'Tech', slug: 'tech' })
    categoryTwo = await Category.create({ name: 'Health', slug: 'health' })
  })

  describe('addBlog', () => {
    it('creates a blog with uploaded image and notifies followers', async () => {
      const req = {
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString(), categoryTwo._id.toString()],
            title: 'New blog',
            slug: 'new-blog',
            blogContent: '<p>Hello world</p>',
            author: author._id.toString(),
          }),
        },
        file: { path: '/tmp/file.jpg' },
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(uploadCalls).toBe(1)
      expect(res._error).toBeUndefined()

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.message).toBe('Blog added successfully.')
      const saved = await Blog.findOne({ title: 'New blog' })
      expect(saved).toBeTruthy()
      expect(saved.featuredImage).toBe('https://image.example/test.jpg')
    })

    it('requires at least one category', async () => {
      const req = {
        body: {
          data: JSON.stringify({
            categories: [],
            title: 'Missing categories',
            slug: 'missing-cat',
            blogContent: 'content',
          }),
        },
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(400)
      expect(res._error.message).toBe('At least one category is required.')
    })

    it('handles cloudinary upload error', async () => {
      cloudinary.uploader.upload = () => {
        throw new Error('Upload failed')
      }

      const req = {
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Upload error blog',
            slug: 'upload-error',
            blogContent: 'content',
            author: author._id.toString(),
          }),
        },
        file: { path: '/tmp/file.jpg' },
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toBe('Upload failed')

      cloudinary.uploader.upload = () => ({ secure_url: 'https://image.example/test.jpg' })
    })

    it('handles general errors', async () => {
      const req = {
        body: {
          data: 'invalid json',
        },
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('should handle data.category as single value instead of array (covers line 26-28)', async () => {
      const req = {
        body: {
          data: JSON.stringify({
            category: categoryOne._id.toString(), // single category instead of array
            title: 'Single category blog',
            slug: 'single-category',
            blogContent: '<p>Content</p>',
          }),
        },
        file: { path: '/tmp/file.jpg' }, // Add file to trigger upload
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(res._error).toBeUndefined()
      expect(res._statusCode).toBe(200)
      const saved = await Blog.findOne({ title: 'Single category blog' })
      expect(saved).toBeTruthy()
      expect(saved.categories).toHaveLength(1)
    })

    it('should handle empty categories object defaulting to empty array (covers line 26-28)', async () => {
      const req = {
        body: {
          data: JSON.stringify({
            // No categories or category field at all
            title: 'No category test',
            slug: 'no-category',
            blogContent: '<p>Content</p>',
          }),
        },
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      // Should fail with 400 because at least one category is required
      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(400)
      expect(res._error.message).toBe('At least one category is required.')
    })

    it('should use data.author when req.user is undefined (covers line 40)', async () => {
      const req = {
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'No user auth blog',
            slug: 'no-user',
            blogContent: '<p>Content</p>',
            author: author._id.toString(),
          }),
        },
        file: { path: '/tmp/file.jpg' }, // Add file to trigger upload
        // No user object (unauthenticated scenario)
        user: null,
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      expect(res._error).toBeUndefined()
      expect(res._statusCode).toBe(200)
      const saved = await Blog.findOne({ title: 'No user auth blog' })
      expect(saved).toBeTruthy()
      expect(saved.author.toString()).toBe(author._id.toString())
    })

  })

  describe('editBlog', () => {
    it('returns blog data', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Edit me',
        slug: 'edit-me',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = { params: { blogid: blog._id.toString() } }
      const res = buildRes()
      const next = buildNext(res)

      await editBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog.title).toBe('Edit me')
    })

    it('handles missing blog', async () => {
      const req = { params: { blogid: new mongoose.Types.ObjectId().toString() } }
      const res = buildRes()
      const next = buildNext(res)

      await editBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(404)
      expect(res._error.message).toBe('Data not found.')
    })

    it('handles database errors', async () => {
      const req = { params: { blogid: 'invalid-id' } }
      const res = buildRes()
      const next = buildNext(res)

      await editBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })
  })

  describe('updateBlog', () => {
    it('updates content and categories', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Old title',
        slug: 'old-slug',
        blogContent: 'old content',
        featuredImage: 'old.jpg',
      })
      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({
            categories: [categoryTwo._id.toString()],
            title: 'Updated title',
            slug: 'updated-slug',
            blogContent: '<b>updated</b>',
          }),
        },
        file: null,
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.message).toBe('Blog updated successfully.')
      const updated = await Blog.findById(blog._id)
      expect(updated.title).toBe('Updated title')
      expect(updated.categories).toHaveLength(1)
      expect(updated.categories[0].toString()).toBe(categoryTwo._id.toString())
    })

    it('validates categories', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Needs cats',
        slug: 'needs-cat',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({ categories: [] }),
        },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(400)
      expect(res._error.message).toBe('At least one category is required.')
    })

    it('successfully uploads new image when updating blog', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Update with image',
        slug: 'update-image',
        blogContent: 'content',
        featuredImage: 'old.jpg',
      })

      cloudinary.uploader.upload = jest.fn().mockResolvedValue({ 
        secure_url: 'https://image.example/new-uploaded.jpg' 
      })

      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Updated with new image',
            slug: 'updated-image',
            blogContent: 'updated content',
          }),
        },
        file: { path: '/tmp/newfile.jpg' },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.message).toBe('Blog updated successfully.')
      const updated = await Blog.findById(blog._id)
      expect(updated.featuredImage).toBe('https://image.example/new-uploaded.jpg')
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/tmp/newfile.jpg',
        { folder: 'yt-mern-blog', resource_type: 'auto' }
      )

      cloudinary.uploader.upload = () => ({ secure_url: 'https://image.example/test.jpg' })
    })

    it('handles cloudinary upload error when updating image', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Update with image',
        slug: 'update-image',
        blogContent: 'content',
        featuredImage: 'old.jpg',
      })

      cloudinary.uploader.upload = () => {
        throw new Error('Upload failed')
      }

      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Updated',
            slug: 'updated',
            blogContent: 'content',
          }),
        },
        file: { path: '/tmp/newfile.jpg' },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
      expect(res._error.message).toBe('Upload failed')

      cloudinary.uploader.upload = () => ({ secure_url: 'https://image.example/test.jpg' })
    })

    it('handles general database errors', async () => {
      const req = {
        params: { blogid: 'invalid-id' },
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Test',
            slug: 'test',
            blogContent: 'content',
          }),
        },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })

    it('should handle data.category as single value in updateBlog (covers line 87-89)', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Update test',
        slug: 'update-test',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })

      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({
            category: categoryTwo._id.toString(), // single category instead of array
            title: 'Updated with single category',
            slug: 'updated-single',
            blogContent: '<p>Updated</p>',
          }),
        },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      const updated = await Blog.findById(blog._id)
      expect(updated.categories).toHaveLength(1)
      expect(updated.categories[0].toString()).toBe(categoryTwo._id.toString())
    })

    it('should handle empty categories in updateBlog defaulting to empty array (covers line 87-89)', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Update test 2',
        slug: 'update-test-2',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })

      const req = {
        params: { blogid: blog._id.toString() },
        body: {
          data: JSON.stringify({
            // No categories or category field
            title: 'Updated no categories',
            slug: 'updated-no-cat',
            blogContent: '<p>Updated</p>',
          }),
        },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      // Should fail with 400 because at least one category is required
      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(400)
      expect(res._error.message).toBe('At least one category is required.')
    })
  })

  describe('deleteBlog', () => {
    it('removes blog by id', async () => {
      const blog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Delete me',
        slug: 'delete-me',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = { params: { blogid: blog._id.toString() } }
      const res = buildRes()
      const next = buildNext(res)

      await deleteBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.message).toBe('Blog Deleted successfully.')
      expect(await Blog.findById(blog._id)).toBeNull()
    })

    it('handles errors during deletion', async () => {
      const req = { params: { blogid: 'invalid-id' } }
      const res = buildRes()
      const next = buildNext(res)

      await deleteBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })
  })

  describe('showAllBlog', () => {
    it('returns all blogs for admin', async () => {
      await Blog.create([
        {
          author: author._id,
          categories: [categoryOne._id],
          title: 'Admin sees this 1',
          slug: 'admin-one',
          blogContent: 'content',
          featuredImage: 'img1.jpg',
        },
        {
          author: admin._id,
          categories: [categoryTwo._id],
          title: 'Admin sees this 2',
          slug: 'admin-two',
          blogContent: 'content',
          featuredImage: 'img2.jpg',
        },
      ])
      const req = { user: { _id: admin._id, role: 'admin' } }
      const res = buildRes()
      const next = buildNext(res)

      await showAllBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(2)
    })

    it('returns only author blogs for non-admin', async () => {
      await Blog.create([
        {
          author: author._id,
          categories: [categoryOne._id],
          title: 'Mine',
          slug: 'mine',
          blogContent: 'content',
          featuredImage: 'img1.jpg',
        },
        {
          author: admin._id,
          categories: [categoryTwo._id],
          title: 'Not mine',
          slug: 'not-mine',
          blogContent: 'content',
          featuredImage: 'img2.jpg',
        },
      ])
      const req = { user: { _id: author._id, role: 'user' } }
      const res = buildRes()
      const next = buildNext(res)

      await showAllBlog(req, res, next)

      expect(res._jsonData.blog).toHaveLength(1)
      expect(res._jsonData.blog[0].title).toBe('Mine')
    })

    it('handles database errors', async () => {
      const originalFind = Blog.find
      Blog.find = () => {
        throw new Error('Database error')
      }

      const req = { user: { _id: author._id, role: 'admin' } }
      const res = buildRes()
      const next = buildNext(res)

      await showAllBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Blog.find = originalFind
    })
  })

  describe('getBlog', () => {
    it('returns blog by slug', async () => {
      await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Slug blog',
        slug: 'slug-blog',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = { params: { slug: 'slug-blog' } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog.slug).toBe('slug-blog')
    })

    it('handles database errors', async () => {
      const originalFindOne = Blog.findOne
      Blog.findOne = () => {
        throw new Error('Database error')
      }

      const req = { params: { slug: 'test-slug' } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Blog.findOne = originalFindOne
    })
  })

  describe('getRelatedBlog', () => {
    it('returns blogs from same category excluding provided slug', async () => {
      const otherBlog = await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Related blog',
        slug: 'related-blog',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = { params: { category: categoryOne.slug, blog: 'different-slug' } }
      const res = buildRes()
      const next = buildNext(res)

      await getRelatedBlog(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.relatedBlog).toHaveLength(1)
      expect(res._jsonData.relatedBlog[0]._id.toString()).toBe(otherBlog._id.toString())
    })

    it('handles missing category data', async () => {
      const req = { params: { category: 'unknown', blog: 'slug' } }
      const res = buildRes()
      const next = buildNext(res)

      await getRelatedBlog(req, res, next)

      expect(res._error).toBeDefined()
    })

    it('handles database errors', async () => {
      const originalFindOne = Category.findOne
      Category.findOne = () => {
        throw new Error('Database error')
      }

      const req = { params: { category: 'tech', blog: 'test' } }
      const res = buildRes()
      const next = buildNext(res)

      await getRelatedBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Category.findOne = originalFindOne
    })
  })

  describe('getBlogsByAuthor', () => {
    it('returns blogs for specified author', async () => {
      await Blog.create([
        {
          author: author._id,
          categories: [categoryOne._id],
          title: 'Author blog 1',
          slug: 'author-blog-1',
          blogContent: 'content',
          featuredImage: 'img1.jpg',
        },
        {
          author: admin._id,
          categories: [categoryTwo._id],
          title: 'Other blog',
          slug: 'other-blog',
          blogContent: 'content',
          featuredImage: 'img2.jpg',
        },
      ])
      const req = { params: { authorId: author._id.toString() } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlogsByAuthor(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(1)
      expect(res._jsonData.blog[0].author._id.toString()).toBe(author._id.toString())
    })

    it('handles database errors', async () => {
      const req = { params: { authorId: 'invalid-id' } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlogsByAuthor(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)
    })
  })

  describe('getBlogByCategory', () => {
    it('returns blogs and category data', async () => {
      await Blog.create({
        author: author._id,
        categories: [categoryTwo._id],
        title: 'Health insights',
        slug: 'health-insights',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      const req = { params: { category: categoryTwo.slug } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlogByCategory(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(1)
      expect(res._jsonData.categoryData.slug).toBe('health')
    })

    it('handles missing category lookups', async () => {
      const req = { params: { category: 'missing' } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlogByCategory(req, res, next)

      expect(res._error).toBeDefined()
    })

    it('handles database errors', async () => {
      const originalFindOne = Category.findOne
      Category.findOne = () => {
        throw new Error('Database error')
      }

      const req = { params: { category: 'tech' } }
      const res = buildRes()
      const next = buildNext(res)

      await getBlogByCategory(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Category.findOne = originalFindOne
    })
  })

  describe('search', () => {
    it('returns empty lists for blank queries', async () => {
      const req = { query: { q: ' ' } }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(0)
      expect(res._jsonData.authors).toHaveLength(0)
    })

    it('returns matching blogs and authors', async () => {
      await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'JavaScript Tips',
        slug: 'js-tips',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })
      await User.create({
        name: 'Jane Query',
        email: 'jane@example.com',
        password: 'hashed',
        role: 'user',
        isBlacklisted: false,
      })
      const req = { query: { q: 'javascript' } }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(1)
      expect(res._jsonData.authors.length).toBeGreaterThanOrEqual(0)
    })

    it('returns empty arrays when no query provided', async () => {
      const req = { query: {} }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(0)
      expect(res._jsonData.authors).toHaveLength(0)
    })

    it('handles database errors', async () => {
      const originalFind = Blog.find
      Blog.find = () => {
        throw new Error('Database error')
      }

      const req = { query: { q: 'test' } }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Blog.find = originalFind
    })

    it('should handle undefined value in search query (covers line 9)', async () => {
      // When req.query.q is undefined, rawQuery becomes ''
      // The escapeRegex function should handle the default parameter
      const req = { query: {} } // No q parameter
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(0)
      expect(res._jsonData.authors).toHaveLength(0)
    })

    it('should properly escape special regex characters in search (covers line 9)', async () => {
      await Blog.create({
        author: author._id,
        categories: [categoryOne._id],
        title: 'Test (special) characters',
        slug: 'test-special',
        blogContent: 'content',
        featuredImage: 'img.jpg',
      })

      // Search with special regex characters that need escaping
      const req = { query: { q: '(special)' } }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(1)
    })

    it('should handle null/undefined directly passed to escapeRegex (covers line 9 default param)', async () => {
      // Test with explicit null query which exercises the default parameter
      // This is an edge case where the query could be explicitly null
      const req = { query: { q: null } }
      const res = buildRes()
      const next = buildNext(res)

      await search(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(0)
      expect(res._jsonData.authors).toHaveLength(0)
    })

    it('should call escapeRegex without argument to cover default parameter (line 9)', () => {
      // Direct unit test: call escapeRegex() without any argument to exercise the default param branch
      const result = escapeRegex()
      expect(result).toBe('')
    })
  })

  describe('getAllBlogs', () => {
    it('returns every blog regardless of user role', async () => {
      await Blog.create([
        {
          author: author._id,
          categories: [categoryOne._id],
          title: 'Blog one',
          slug: 'blog-one',
          blogContent: 'content',
          featuredImage: 'img1.jpg',
        },
        {
          author: admin._id,
          categories: [categoryTwo._id],
          title: 'Blog two',
          slug: 'blog-two',
          blogContent: 'content',
          featuredImage: 'img2.jpg',
        },
      ])
      const req = { user: { _id: author._id } }
      const res = buildRes()
      const next = buildNext(res)

      await getAllBlogs(req, res, next)

      expect(res._statusCode).toBe(200)
      expect(res._jsonData.blog).toHaveLength(2)
    })

    it('handles database errors', async () => {
      const originalFind = Blog.find
      Blog.find = () => {
        throw new Error('Database error')
      }

      const req = { user: { _id: author._id } }
      const res = buildRes()
      const next = buildNext(res)

      await getAllBlogs(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      Blog.find = originalFind
    })
  })

  describe('console.error coverage', () => {
    it('logs console.error when notifyFollowersNewPost fails in addBlog', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Access the already-mocked function
      const notifyTriggers = await import('../../utils/notifyTriggers.js');
      // Clear any previous mock state and make it reject
      notifyTriggers.notifyFollowersNewPost.mockClear();
      notifyTriggers.notifyFollowersNewPost.mockRejectedValueOnce(new Error('Notification service down'));

      const req = {
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Console error test blog',
            slug: 'console-error-test',
            blogContent: '<p>Test content</p>',
            author: author._id.toString(),
          }),
        },
        file: { path: '/tmp/test-image.jpg' }, // Include file to trigger upload
        user: { _id: author._id },
      }
      const res = buildRes()
      const next = buildNext(res)

      await addBlog(req, res, next)

      // The blog should still be created successfully despite notification failure
      expect(res._error).toBeUndefined()
      expect(res._statusCode).toBe(200)
      expect(res._jsonData).toBeDefined()
      expect(res._jsonData.success).toBe(true)
      expect(consoleErrorSpy).toHaveBeenCalledWith('notifyFollowersNewPost error:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('logs console.error when cloudinary upload fails in updateBlog', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const blog = await Blog.create({
        title: 'Original',
        slug: 'original',
        blogContent: 'content',
        featuredImage: 'old.jpg',
        author: author._id,
        categories: [categoryOne._id],
      })

      cloudinary.uploader.upload = () => {
        throw new Error('Upload service down')
      }

      const req = {
        body: {
          data: JSON.stringify({
            categories: [categoryOne._id.toString()],
            title: 'Updated',
            slug: 'updated',
            blogContent: 'new content',
          }),
        },
        params: { blogid: blog._id.toString() },
        file: { path: '/tmp/image.jpg' },
      }
      const res = buildRes()
      const next = buildNext(res)

      await updateBlog(req, res, next)

      expect(res._error).toBeDefined()
      expect(res._error.statusCode).toBe(500)

      consoleErrorSpy.mockRestore()
    })
  })
})
