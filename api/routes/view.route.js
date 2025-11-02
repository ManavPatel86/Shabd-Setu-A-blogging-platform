import express from "express";
import { addView, getViewCount } from "../controllers/view.controller.js";

const router = express.Router();

router.post("/add-view", addView);
router.get("/:blogId", getViewCount);

export default router;
