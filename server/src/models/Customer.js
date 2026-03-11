import { Schema, model, Types } from 'mongoose';

const customerSchema = new Schema({
  owner_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  
  // Khata (Credit Ledger)
  total_debt: { type: Number, default: 0 }, 
  
  // Audit Trail
  created_by: { type: String, required: true }, 
  updated_by: { type: String },
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

// Prevent duplicate phone numbers for the same shop owner, ignoring empty/null phones
customerSchema.index(
  { owner_id: 1, phone: 1 }, 
  { unique: true, partialFilterExpression: { phone: { $type: "string", $ne: "" } } }
);

// Optimize common soft-delete queries
customerSchema.index({ owner_id: 1, is_deleted: 1 });

export default model('Customer', customerSchema);