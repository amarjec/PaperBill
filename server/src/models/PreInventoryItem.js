import mongoose from 'mongoose';

const preInventoryItemSchema = new mongoose.Schema({
  // The business type this template belongs to
  business_type: { 
    type: String, 
    enum: ['Hardware', 'Grocery', 'Electronics', 'Traders', 'General Store', 'Medical'],
    required: true
  },
  
  // Organizational Structure
  category_name: { type: String, required: true },
  subcategory_name: { type: String },
  
  // Item Details
  item_name: { type: String, required: true },
  unit: { type: String, required: true }, // e.g., "kg", "pcs", "strips"
  
  // Optional: Provide standard default brands for certain industries (like Medical or Hardware)
  default_brands: [{ type: String }] 
}, { timestamps: true });

export default mongoose.model('PreInventoryItem', preInventoryItemSchema);