import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  google_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  business_name: { type: String },
  phone_number: { type: String },
  address: { type: String },
  business_type: [{ 
    type: String, 
    enum: ['Hardware', 'Grocery', 'Electronics', 'Traders', 'General Store', 'Medical'] 
  }],
  
  // Security & Identity
  secure_pin: { type: String }, // Hashed 4-digit PIN for Profit View
  device_id: { type: String },  // For Single-Device Login Policy
  
  // Razorpay Subscription Logic
  isPremium: { type: Boolean, default: false }, // Simple check for gated features
  subscription: {
    plan_name: { type: String, enum: ['Free', 'Gold', 'Diamond'], default: 'Free' },
    razorpay_subscription_id: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'past_due', 'cancelled'], default: 'inactive' },
    expires_at: { type: Date }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);