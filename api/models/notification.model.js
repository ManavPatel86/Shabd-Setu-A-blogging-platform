import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["like", "comment", "reply", "follow", "newPost"],
    required: true
  },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
