import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  
  created_by: { type: String, required: true },
  is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);