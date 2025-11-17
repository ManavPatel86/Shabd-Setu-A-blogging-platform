// /api/routes/reports.route.js
// Routes for reporting blogs and admin report management

import express from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// User reports a blog
router.post('/blog', authenticate, reportsController.reportBlog);

// Admin: list all reports
router.get('/admin/reports', authenticate, admin, reportsController.listReports);

// Admin: update report status
router.patch('/admin/report/:id', authenticate, admin, reportsController.updateReportStatus);

// Admin action endpoints
router.patch('/admin/report/:id/safe', authenticate, admin, reportsController.adminSafeReport);
router.patch('/admin/report/:id/remove', authenticate, admin, reportsController.adminRemoveReport);
router.patch('/admin/report/:id/ban', authenticate, admin, reportsController.adminBanReport);
router.patch('/admin/report/:id/resolve', authenticate, admin, reportsController.adminResolveReport);

export default router;
