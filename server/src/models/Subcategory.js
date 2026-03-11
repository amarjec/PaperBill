import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  description: { type: String },
  created_by: { type: String, required: true },
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

// Prevent duplicate subcategory names under the same category for the same owner
subcategorySchema.index({ owner_id: 1, category_id: 1, name: 1 }, { unique: true });
subcategorySchema.index({ owner_id: 1, is_deleted: 1 });

export default mongoose.model('Subcategory', subcategorySchema);