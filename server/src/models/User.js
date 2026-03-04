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
  
  // NEW: Tracks if the user completed the inventory setup
  has_inventory: { type: Boolean, default: false },
  role : { type: String, enum: ['Owner', 'Staff'], default: 'Owner' },
  
  // Security & Identity
  secure_pin: { type: String }, // Hashed 4-digit PIN for Profit View
  device_id: { type: String },  // For Single-Device Login Policy
  
  // UPDATED: Razorpay One-Time Payment Logic
  isPremium: { type: Boolean, default: false }, 
  subscription: {
    plan_name: { type: String, enum: ['Free', 'monthly', 'yearly'], default: 'Free' },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'inactive' },
    start_date: { type: Date },
    end_date: { type: Date }, // We check this to see if premium expired
    last_order_id: { type: String } // Prevents double-verification of the same payment
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);