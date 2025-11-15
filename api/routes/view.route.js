import express from "express";
import { addView, getViewCount } from "../controllers/view.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/add-view", authenticate, addView);
router.get("/:blogId", getViewCount);

export default router;
