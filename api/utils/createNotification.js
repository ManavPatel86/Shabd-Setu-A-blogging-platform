import Notification from "../models/notification.model.js";

let io; 

export function initNotificationIO(ioInstance) {
  io = ioInstance;
}

export async function createNotification({ recipientId, senderId, type, link, extra = {} }) {
  let message = "";

  switch (type) {
    case "like":
      message = `${extra.senderName} liked your blog "${extra.blogTitle}"`;
      break;
    case "comment":
      message = `${extra.senderName} commented on your blog "${extra.blogTitle}"`;
      break;
    case "reply":
      message = `${extra.senderName} replied to your comment`;
      break;
    case "report":
      // Use custom message if provided, otherwise default
      message = extra.message || `${extra.senderName} reported your blog "${extra.blogTitle || ''}"`;
      break;
    case "follow":
      message = `${extra.senderName} started following you`;
      break;
    case "newPost":
      message = `${extra.senderName} posted a new blog: "${extra.blogTitle}"`;
      break;
    case "warning":
      message = extra.message || "You have received a warning from an admin";
      break;
    default:
      message = extra.message || "You have a new notification";
  }

  const doc = await Notification.create({
    recipientId,
    senderId,
    type,
    link,
    message,
  });


  if (io && recipientId) {
    try {
      io.to(String(recipientId)).emit("notification:new", doc);
    } catch (emitErr) {
      console.error('Failed to emit notification via socket:', emitErr);
    }
  }

  return doc;
}
