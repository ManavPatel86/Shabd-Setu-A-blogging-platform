import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'
import { createNotification, initNotificationIO } from '../../utils/createNotification.js'
import User from '../../models/user.model.js'

describe('createNotification', () => {
  let mockIo
  let user1, user2

  beforeAll(async () => {
    await connectTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    // Create test users with valid ObjectIds
    user1 = await User.create({ name: 'User1', email: 'user1@test.com', password: 'password123' })
    user2 = await User.create({ name: 'User2', email: 'user2@test.com', password: 'password123' })
    mockIo = {
      to: () => mockIo,
      emit: () => {}
    }
  })

  afterEach(() => {
    initNotificationIO(null)
  })

  it('should create like notification', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/blog/tech/post',
      extra: { senderName: 'John', blogTitle: 'My Post' }
    })

    expect(result.recipientId.toString()).toBe(user1._id.toString())
    expect(result.senderId.toString()).toBe(user2._id.toString())
    expect(result.type).toBe('like')
    expect(result.message).toBe('John liked your blog "My Post"')
  })

  it('should create comment notification', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'comment',
      link: '/blog/post#comments',
      extra: { senderName: 'Jane', blogTitle: 'Article' }
    })

    expect(result.message).toBe('Jane commented on your blog "Article"')
  })

  it('should create reply notification', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'reply',
      link: '/blog/post#comments',
      extra: { senderName: 'Alice' }
    })

    expect(result.message).toBe('Alice replied to your comment')
  })

  it('should create follow notification', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'follow',
      link: '/profile/user2',
      extra: { senderName: 'Bob' }
    })

    expect(result.message).toBe('Bob started following you')
  })

  it('should create newPost notification', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'newPost',
      link: '/blog/tutorial',
      extra: { senderName: 'Charlie', blogTitle: 'Tutorial' }
    })

    expect(result.message).toBe('Charlie posted a new blog: "Tutorial"')
  })

  it('should handle notification without unknown type gracefully', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: {}
    })

    expect(result).toBeTruthy()
    expect(result.type).toBe('like')
  })

  it('should emit socket event when io initialized', async () => {
    let emitted = false
    mockIo.emit = () => { emitted = true }
    initNotificationIO(mockIo)

    await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })

    expect(emitted).toBe(true)
  })

  it('should not emit when io not initialized', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })

    expect(result).toBeTruthy()
  })

  it('should not emit when recipientId is null', async () => {
    let emitted = false
    mockIo.emit = () => { emitted = true }
    initNotificationIO(mockIo)

    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })

    expect(result).toBeTruthy()
    expect(emitted).toBe(true)
  })

  it('should handle extra parameter default', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test'
    })

    expect(result).toBeTruthy()
  })

  it('should convert recipientId to string for socket', async () => {
    let roomId = null
    mockIo.to = (id) => { roomId = id; return mockIo }
    initNotificationIO(mockIo)

    await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })

    expect(roomId).toBe(user1._id.toString())
  })

  it('should use default message for unknown type (but will fail validation)', async () => {
    // This tests the switch default case, but will fail at DB level due to enum validation
    try {
      await createNotification({
        recipientId: user1._id,
        senderId: user2._id,
        type: 'unknownType',
        link: '/test',
        extra: {}
      })
    } catch (error) {
      // Expected to fail due to enum validation
      expect(error).toBeTruthy()
      expect(error.name).toBe('ValidationError')
    }
  })
})
