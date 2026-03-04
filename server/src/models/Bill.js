import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  item_name: { type: String, required: true }, 
  quantity: { type: Number, required: true },
  
  // Pricing Snapshot
  sale_price: { type: Number, required: true }, 
  purchase_price: { type: Number, required: true }, 
  
  // Brand Tracking
  brand_applied: { type: String, required: true },
  is_fallback_price: { type: Boolean, default: false }
}, { _id: false });

const billSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  bill_number: { type: String, required: true },
  
  // Bill Modes
  is_estimate: { type: Boolean, default: false },
  price_mode: { type: String, enum: ['Retail', 'Wholesale'], default: 'Retail' },
  status: { type: String, enum: ['Paid', 'Partially Paid', 'Unpaid', 'Cancelled'], default: 'Paid' },
  
  // Financials
  items: [billItemSchema],
  extra_fare: { type: Number, default: 0 }, 
  discount: { type: Number, default: 0 },   
  total_amount: { type: Number, required: true }, 
  amount_paid: { type: Number, default: 0 },
  
  // Audit & Traceability
  created_by: { type: String, required: true },
  brand_converted_by: { type: String }, 
  
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

// Prevents any duplicate bill numbers within a shop (belt-and-suspenders)
billSchema.index({ owner_id: 1, createdAt: -1 });
billSchema.index({ owner_id: 1, bill_number: 1 }, { unique: true });

export default mongoose.model('Bill', billSchema);