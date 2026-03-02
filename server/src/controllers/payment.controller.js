import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

// Define your one-time plans here
const plans = {
  'monthly': { 
    amount: process.env.MONTHLY_BILLING_PRICE || 199, // Fallback to 199 if env is missing
    days: process.env.MONTHLY_BILLING_DAYS || 30 
  },
  'yearly': { 
    amount: process.env.ANNUAL_BILLING_PRICE || 1999, // Fallback to 1999 if env is missing
    days: process.env.ANNUAL_BILLING_DAYS || 365 
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET, // Using current project's env variable
});

// 1. Create Order (One-Time Payment)
export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body; 
    const userId = req.user.ownerId; // Using current project's auth middleware

    const plan = plans[planId];
    if (!plan) return res.status(400).json({ success: false, message: "Invalid Plan" });

    const options = {
      amount: plan.amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `rec_${Date.now()}`,
      notes: { 
        userId: userId.toString(), 
        planId 
      }
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Verify Payment (Frontend calls this after success)
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const userId = req.user.ownerId; // Using current project's auth middleware

    // Verify signature using the current project's secret key
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    // --- ACTIVATE PREMIUM ---
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // SECURITY CHECK: Prevent Double Processing if user clicks verify twice
    if (user.subscription?.last_order_id === razorpay_order_id) {
      return res.status(200).json({ success: true, message: "Already Activated", user });
    }

    const plan = plans[planId];
    const currentDate = new Date();
    
    // Logic: If already active, extend from Expiry. If expired/free, start from Now.
    let startDate = currentDate;
    if (user.isPremium && user.subscription?.end_date && new Date(user.subscription.end_date) > currentDate) {
      startDate = new Date(user.subscription.end_date);
    }

    // Safe Timestamp Math
    const durationInMillis = plan.days * 24 * 60 * 60 * 1000;
    const newExpiry = new Date(startDate.getTime() + durationInMillis);

    // Update User using your current schema structure 
    user.isPremium = true;
    user.subscription = {
      plan_name: planId,
      status: 'active',
      start_date: startDate,
      end_date: newExpiry,
      last_order_id: razorpay_order_id 
    };
    
    await user.save();

    res.status(200).json({ success: true, message: "Premium Activated!", user });

  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};