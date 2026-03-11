import { Schema, model, Types } from 'mongoose';

const categorySchema = new Schema({
  owner_id: { type: Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  
  created_by: { type: String, required: true },
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

// Prevent duplicate category names for the same owner
categorySchema.index({ owner_id: 1, name: 1 }, { unique: true });
categorySchema.index({ owner_id: 1, is_deleted: 1 });

export default model('Category', categorySchema);