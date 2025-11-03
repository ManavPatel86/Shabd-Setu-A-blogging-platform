import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getSaveStatus, getSavedBlogs, toggleSaveBlog } from "../controllers/save.controller.js";

const SaveRoute = express.Router();

SaveRoute.post("/toggle/:blogId", authenticate, toggleSaveBlog);
SaveRoute.get("/status/:blogId", authenticate, getSaveStatus);
SaveRoute.get("/", authenticate, getSavedBlogs);

export default SaveRoute;
