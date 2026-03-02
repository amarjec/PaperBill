import express from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

router.post('/order', protect, ownerOnly, createOrder);
router.post('/verify', protect, ownerOnly, verifyPayment); // Frontend will call this

export default router;