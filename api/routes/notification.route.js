import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/authenticate.js"; 

const router = express.Router();

router.get("/", authenticate, getNotifications);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
