import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'

// Mock createNotification
const mockCreateNotification = jest.fn()
jest.unstable_mockModule('../../utils/createNotification.js', () => ({
  createNotification: mockCreateNotification
}))

const { notifyLike, notifyComment, notifyReply, notifyFollow, notifyFollowersNewPost } = await import('../../utils/notifyTriggers.js')
const User = (await import('../../models/user.model.js')).default
const Blog = (await import('../../models/blog.model.js')).default
const Follow = (await import('../../models/follow.model.js')).default
const Category = (await import('../../models/category.model.js')).default

describe('notifyTriggers', () => {
  beforeAll(async () => {
    await connectTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    jest.clearAllMocks()
  })

  describe('notifyLike', () => {
    it('should notify when someone likes a blog', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker@test.com', password: 'pass' })
      const category = await Category.create({ name: 'Tech', slug: 'tech', key: 'tech' })
      const blog = await Blog.create({ 
        title: 'Test Blog', 
        slug: 'test-blog', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id,
        categories: [category._id]
      })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalled()
    })

    it('should not notify when blog not found', async () => {
      await notifyLike({ likerId: 'user1', blogId: '507f1f77bcf86cd799439011' })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should not notify when liking own blog', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'My Blog', 
        slug: 'my-blog', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyLike({ likerId: author._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should handle blog without categories', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Test', 
        slug: 'test', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalled()
    })

    it('should use "Someone" fallback when liker not found', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Test', 
        slug: 'test', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyLike({ likerId: '507f1f77bcf86cd799439011', blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })

    it('should use "Someone" fallback when liker has no name', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const liker = new User({ name: '', email: 'liker@test.com', password: 'pass' })
      await liker.save({ validateBeforeSave: false })
      const blog = await Blog.create({ 
        title: 'Test', 
        slug: 'test', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })

    it('should handle category without slug', async () => {
      const author = await User.create({ name: 'Author', email: 'author5@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker5@test.com', password: 'pass' })
      const category = new Category({ name: 'NoSlug', key: 'noslug', slug: '' })
      await category.save({ validateBeforeSave: false })
      const blog = await Blog.create({ 
        title: 'Test', 
        slug: 'test-no-slug', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id,
        categories: [category._id]
      })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          link: '/blog/test-no-slug'
        })
      )
    })

    it('should handle null category in array', async () => {
      const author = await User.create({ name: 'Author', email: 'author6@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker6@test.com', password: 'pass' })
      const blog = new Blog({ 
        title: 'Test', 
        slug: 'test-null-cat', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id,
        categories: ['507f1f77bcf86cd799439011']
      })
      await blog.save({ validateBeforeSave: false })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          link: '/blog/test-null-cat'
        })
      )
    })

    it('should handle category with null slug property', async () => {
      const author = await User.create({ name: 'Author', email: 'author7@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker7@test.com', password: 'pass' })
      const category = new Category({ name: 'NullSlug', key: 'nullslug', slug: null })
      await category.save({ validateBeforeSave: false })
      const blog = await Blog.create({ 
        title: 'Test', 
        slug: 'test-slug-null', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id,
        categories: [category._id]
      })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          link: '/blog/test-slug-null'
        })
      )
    })

    it('should handle blog with categories as non-array (covers [] fallback)', async () => {
      const author = await User.create({ name: 'Author', email: 'author8@test.com', password: 'pass' })
      const liker = await User.create({ name: 'Liker', email: 'liker8@test.com', password: 'pass' })
      const blog = new Blog({ 
        title: 'Test', 
        slug: 'test-non-array', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id,
        categories: null // Set categories to null to trigger [] fallback
      })
      await blog.save({ validateBeforeSave: false })

      await notifyLike({ likerId: liker._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          link: '/blog/test-non-array'
        })
      )
    })
  })

  describe('notifyComment', () => {
    it('should notify when someone comments', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const commenter = await User.create({ name: 'Commenter', email: 'commenter@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Post', 
        slug: 'post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyComment({ commenterId: commenter._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalled()
    })

    it('should not notify when blog not found', async () => {
      await notifyComment({ commenterId: 'user1', blogId: '507f1f77bcf86cd799439011' })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should not notify when commenting on own blog', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'My Post', 
        slug: 'my-post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyComment({ commenterId: author._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should use "Someone" fallback when commenter not found', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Post', 
        slug: 'post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyComment({ commenterId: '507f1f77bcf86cd799439011', blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })
  })

  describe('notifyReply', () => {
    it('should notify when someone replies', async () => {
      const commenter = await User.create({ name: 'Commenter', email: 'commenter@test.com', password: 'pass' })
      const replier = await User.create({ name: 'Replier', email: 'replier@test.com', password: 'pass' })
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Post', 
        slug: 'post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyReply({ 
        replierId: replier._id.toString(), 
        originalCommentUserId: commenter._id.toString(), 
        blogId: blog._id.toString() 
      })

      expect(mockCreateNotification).toHaveBeenCalled()
    })

    it('should not notify when replying to own comment', async () => {
      await notifyReply({ 
        replierId: 'user1', 
        originalCommentUserId: 'user1', 
        blogId: '507f1f77bcf86cd799439011' 
      })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should handle blog not found in reply', async () => {
      const commenter = await User.create({ name: 'Commenter', email: 'commenter2@test.com', password: 'pass' })
      const replier = await User.create({ name: 'Replier', email: 'replier2@test.com', password: 'pass' })

      await notifyReply({ 
        replierId: replier._id.toString(), 
        originalCommentUserId: commenter._id.toString(), 
        blogId: '507f1f77bcf86cd799439011' 
      })

      // Should still call createNotification even if blog not found (buildBlogLink returns '#')
      expect(mockCreateNotification).toHaveBeenCalled()
      const call = mockCreateNotification.mock.calls[mockCreateNotification.mock.calls.length - 1][0]
      expect(call.link).toContain('#')
    })

    it('should use "Someone" fallback when replier not found', async () => {
      const commenter = await User.create({ name: 'Commenter', email: 'commenter3@test.com', password: 'pass' })
      const author = await User.create({ name: 'Author', email: 'author3@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Post', 
        slug: 'post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyReply({ 
        replierId: '507f1f77bcf86cd799439011', 
        originalCommentUserId: commenter._id.toString(), 
        blogId: blog._id.toString() 
      })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })
  })

  describe('notifyFollow', () => {
    it('should notify when someone follows', async () => {
      const follower = await User.create({ name: 'Follower', email: 'follower@test.com', password: 'pass' })
      const target = await User.create({ name: 'Target', email: 'target@test.com', password: 'pass' })

      await notifyFollow({ followerId: follower._id.toString(), targetUserId: target._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalled()
    })

    it('should not notify when following self', async () => {
      await notifyFollow({ followerId: 'user1', targetUserId: 'user1' })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should use "Someone" fallback when follower not found', async () => {
      const target = await User.create({ name: 'Target', email: 'target2@test.com', password: 'pass' })

      await notifyFollow({ followerId: '507f1f77bcf86cd799439011', targetUserId: target._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })
  })

  describe('notifyFollowersNewPost', () => {
    it('should notify all followers', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const follower1 = await User.create({ name: 'F1', email: 'f1@test.com', password: 'pass' })
      const follower2 = await User.create({ name: 'F2', email: 'f2@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'New Post', 
        slug: 'new-post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })
      await Follow.create({ follower: follower1._id, following: author._id })
      await Follow.create({ follower: follower2._id, following: author._id })

      await notifyFollowersNewPost({ authorId: author._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledTimes(2)
    })

    it('should not notify when author not found', async () => {
      await notifyFollowersNewPost({ authorId: '507f1f77bcf86cd799439011', blogId: '507f1f77bcf86cd799439011' })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should not notify when blog not found', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      
      await notifyFollowersNewPost({ authorId: author._id.toString(), blogId: '507f1f77bcf86cd799439011' })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should handle author with no followers', async () => {
      const author = await User.create({ name: 'Author', email: 'author@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'Post', 
        slug: 'post', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })

      await notifyFollowersNewPost({ authorId: author._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('should use "Someone" fallback when author has no name', async () => {
      const author = new User({ name: '', email: 'authornoname@test.com', password: 'pass' })
      await author.save({ validateBeforeSave: false })
      const follower = await User.create({ name: 'Follower', email: 'follower3@test.com', password: 'pass' })
      const blog = await Blog.create({ 
        title: 'New Post', 
        slug: 'new-post2', 
        blogContent: 'content',
        featuredImage: 'image.jpg',
        author: author._id
      })
      await Follow.create({ follower: follower._id, following: author._id })

      await notifyFollowersNewPost({ authorId: author._id.toString(), blogId: blog._id.toString() })

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ senderName: 'Someone' })
        })
      )
    })
  })
})
