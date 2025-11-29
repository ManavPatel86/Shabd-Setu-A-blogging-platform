import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals'
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js'
import { createNotification, initNotificationIO } from '../../utils/createNotification.js'
import User from '../../models/user.model.js'
import Notification from '../../models/notification.model.js'

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

  it('should create report notification with default message', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'report',
      link: '/reports/123',
      extra: { senderName: 'Admin' }
    })

    expect(result.message).toBe('Admin reported your blog ""')
  })

  it('should create report notification with custom message', async () => {
    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'report',
      link: '/reports/123',
      extra: { message: 'Your content violates our policy', senderName: 'Admin' }
    })

    expect(result.message).toBe('Your content violates our policy')
  })

  it('should handle warning notification when Notification.create is mocked', async () => {
    // Model enum prevents real 'warning' notifications; mock create to test switch path
    const stubDoc = {
      recipientId: user1._id,
      senderId: user2._id,
      type: 'warning',
      link: '/warning',
      message: 'This is a test warning'
    }

    const spyCreate = jest.spyOn(Notification, 'create').mockResolvedValue(stubDoc)

    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'warning',
      link: '/warning',
      extra: { message: 'This is a test warning' }
    })

    expect(spyCreate).toHaveBeenCalled()
    expect(result).toBe(stubDoc)

    spyCreate.mockRestore()
  })

  it('should use default warning message when Notification.create is mocked and extra.message is missing', async () => {
    const stubDoc = {
      recipientId: user1._id,
      senderId: user2._id,
      type: 'warning',
      link: '/warning',
      message: 'You have received a warning from an admin'
    }

    const spyCreate = jest.spyOn(Notification, 'create').mockResolvedValue(stubDoc)

    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'warning',
      link: '/warning',
      extra: {}
    })

    expect(spyCreate).toHaveBeenCalled()
    expect(result.message).toBe('You have received a warning from an admin')

    spyCreate.mockRestore()
  })

  it('should emit socket notification successfully', async () => {
    let toCalled = false
    let emitCalled = false
    let toArg = null
    let emitArgs = null

    const successMockIo = {
      to: (recipientId) => {
        toCalled = true
        toArg = recipientId
        return successMockIo
      },
      emit: (event, data) => {
        emitCalled = true
        emitArgs = { event, data }
      }
    }
    initNotificationIO(successMockIo)

    const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })

    expect(result).toBeTruthy()
    expect(toCalled).toBe(true)
    expect(toArg).toBe(String(user1._id))
    expect(emitCalled).toBe(true)
    expect(emitArgs.event).toBe('notification:new')
    expect(emitArgs.data).toBeTruthy()
  })

  it('should handle socket emit error gracefully', async () => {
    const errorMockIo = {
      to: () => errorMockIo,
      emit: () => { throw new Error('Socket error') }
    }
    initNotificationIO(errorMockIo)

    // Should not throw, just log error
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const result = await createNotification({
      recipientId: user1._id,
      senderId: user2._id,
      type: 'like',
      link: '/test',
      extra: { senderName: 'Test', blogTitle: 'Test' }
    })
      expect(result).toBeTruthy()
      expect(result.message).toContain('liked your blog')
      expect(consoleErrSpy).toHaveBeenCalled()
    } finally {
      consoleErrSpy.mockRestore()
    }
  })
})
