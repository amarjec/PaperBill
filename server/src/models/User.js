import { Schema, model } from 'mongoose'; // Removed unused Types

const userSchema = new Schema({
  google_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },

  business_name: { type: String, trim: true },
  phone_number:  { type: String, unique: true, sparse: true, trim: true }, // sparse → allows multiple nulls
  address: { type: String, trim: true },
  business_type: [{ 
    type: String, 
    enum: ['Hardware', 'Grocery', 'Electronics', 'Traders', 'General Store', 'Medical', 'Other'] 
  }],
  
  has_inventory: { type: Boolean, default: false },
  
  // Security & Identity
  secure_pin: { type: String,}, 
  device_id: { type: String },  
  
  //Razorpay Logic
  isPremium: { type: Boolean, default: false }, 
  subscription: {
    plan_name: { type: String, enum: ['free', 'monthly', 'yearly', 'trial'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'inactive' },
    start_date: { type: Date },
    end_date: { type: Date }, 
    last_order_id: { type: String } 
  },

  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date }
}, { timestamps: true });

export default model('User', userSchema);