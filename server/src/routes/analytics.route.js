// routes/analytics.route.js
import express from 'express';
import { getProfitReport } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// Profit reports are strictly for the Owner
router.get('/profit', protect, ownerOnly, getProfitReport);

export default router;