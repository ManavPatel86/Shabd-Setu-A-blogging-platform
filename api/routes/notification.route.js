import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/authenticate.js"; 

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.patch("/:id/read", verifyToken, markAsRead);
router.patch("/read-all", verifyToken, markAllAsRead);
router.delete("/:id", verifyToken, deleteNotification);

export default router;
