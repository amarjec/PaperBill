import express from 'express';
import { 
  createSubscriptionOrder, 
  verifyPaymentWebhook 
} from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// 1. Create Order: Protected and only the Owner can initiate a subscription
router.post('/order', protect, ownerOnly, createSubscriptionOrder);

// 2. Webhook: PUBLIC route. Razorpay's servers call this automatically in the background.
// Make sure this URL is registered in your Razorpay Dashboard Webhook settings.
router.post('/webhook', verifyPaymentWebhook);

export default router;