import express from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly, premiumOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// 1. Lock down the entire file
router.use(protect, ownerOnly, premiumOnly);

// 2. The Main Dashboard Endpoint
router.get('/dashboard', getDashboardAnalytics);

export default router;