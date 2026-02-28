import mongoose from 'mongoose';

// Sub-schema for different brands of the same item
const brandPriceSchema = new mongoose.Schema({
  brand_name: { type: String, required: true },
  purchase_price: { type: Number, required: true }, // Cost to owner
  retail_price: { type: Number, required: true },
  wholesale_price: { type: Number, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  
  item_name: { type: String, required: true }, // e.g., "1-inch PVC Pipe"
  unit: { type: String, required: true }, // e.g., "pcs", "kg", "meters"
  
  // Default (Brand A) Pricing
  default_brand_name: { type: String, default: 'Generic' },
  purchase_price: { type: Number, required: true }, 
  retail_price: { type: Number, required: true },
  wholesale_price: { type: Number, required: true },
  
  // Alternate Brands (Brand B, Brand C)
  alternate_brands: [brandPriceSchema],
  
  // Audit Trail
  created_by: { type: String, required: true },
  updated_by: { type: String },
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);