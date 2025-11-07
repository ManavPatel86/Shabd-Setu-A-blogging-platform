import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const docs = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, notifications: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, recipientId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
