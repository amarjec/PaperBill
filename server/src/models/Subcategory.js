import mongoose from 'mongoose';const subcategorySchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  
  created_by: { type: String, required: true },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Subcategory', subcategorySchema);