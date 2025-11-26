import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Notification from '../../models/notification.model.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../controllers/notification.controller.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';
import User from '../../models/user.model.js';

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

describe('Notification Controller', () => {
  let user;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    user = await User.create({
      name: 'Recipient',
      email: 'recipient@example.com',
      password: 'password',
    });
  });

  describe('getNotifications', () => {
    it('returns latest notifications for the authenticated user', async () => {
      await Notification.create([
        {
          recipientId: user._id,
          senderId: new mongoose.Types.ObjectId(),
          type: 'like',
          message: 'Someone liked your blog',
        },
        {
          recipientId: user._id,
          senderId: new mongoose.Types.ObjectId(),
          type: 'comment',
          message: 'New comment',
        },
      ]);

      const req = { user: { _id: user._id } };
      const res = buildRes();

      await getNotifications(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.body.success).toBe(true);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.statusCode).toBeNull();
    });

    it('handles database errors by returning 500', async () => {
      const req = { user: { _id: user._id } };
      const res = buildRes();

      const findSpy = jest
        .spyOn(Notification, 'find')
        .mockImplementationOnce(() => ({
          sort: () => ({
            limit: () => {
              throw new Error('database failure');
            },
          }),
        }));

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toBe('database failure');

      findSpy.mockRestore();
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read for the current user', async () => {
      const notification = await Notification.create({
        recipientId: user._id,
        senderId: new mongoose.Types.ObjectId(),
        type: 'follow',
        message: 'You have a new follower',
      });

      const req = { user: { _id: user._id }, params: { id: notification._id.toString() } };
      const res = buildRes();

      await markAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      const updated = await Notification.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    it('returns 500 when the database update fails', async () => {
      const req = { user: { _id: user._id }, params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = buildRes();

      const spy = jest.spyOn(Notification, 'findOneAndUpdate').mockRejectedValueOnce(new Error('update failed'));

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toBe('update failed');

      spy.mockRestore();
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read', async () => {
      await Notification.create([
        {
          recipientId: user._id,
          senderId: new mongoose.Types.ObjectId(),
          type: 'like',
          message: 'Liked your post',
          isRead: false,
        },
        {
          recipientId: user._id,
          senderId: new mongoose.Types.ObjectId(),
          type: 'comment',
          message: 'New comment on your post',
          isRead: false,
        },
      ]);

      const req = { user: { _id: user._id } };
      const res = buildRes();

      await markAllAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      const unread = await Notification.find({ recipientId: user._id, isRead: false });
      expect(unread).toHaveLength(0);
    });

    it('returns 500 when marking all as read fails', async () => {
      const req = { user: { _id: user._id } };
      const res = buildRes();

      const spy = jest.spyOn(Notification, 'updateMany').mockRejectedValueOnce(new Error('bulk update failed'));

      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toBe('bulk update failed');

      spy.mockRestore();
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification for the current user', async () => {
      const notification = await Notification.create({
        recipientId: user._id,
        senderId: new mongoose.Types.ObjectId(),
        type: 'comment',
        message: 'Comment removed',
      });

      const req = { user: { _id: user._id }, params: { id: notification._id.toString() } };
      const res = buildRes();

      await deleteNotification(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      const exists = await Notification.findById(notification._id);
      expect(exists).toBeNull();
    });

    it('returns 500 when delete fails', async () => {
      const req = { user: { _id: user._id }, params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = buildRes();

      const spy = jest.spyOn(Notification, 'deleteOne').mockRejectedValueOnce(new Error('delete failed'));

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body.error).toBe('delete failed');

      spy.mockRestore();
    });
  });
});
