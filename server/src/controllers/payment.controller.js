import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body; // e.g., 'plan_XYZ123'
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 1 year
    });

    res.status(200).json({ success: true, subscriptionId: subscription.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPaymentWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature === signature) {
      // Payment is verified
      const event = req.body.event;
      if (event === 'subscription.authenticated' || event === 'subscription.charged') {
        const { id, notes } = req.body.payload.subscription.entity;
        // Update User
        await User.findOneAndUpdate(
          { _id: notes.userId }, 
          { 
            isPremium: true, 
            'subscription.status': 'active',
            'subscription.razorpay_subscription_id': id
          }
        );
      }
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};