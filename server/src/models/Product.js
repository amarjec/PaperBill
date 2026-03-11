import { Schema, model, Types } from 'mongoose';

const brandPriceSchema = new Schema({
  brand_name: { type: String, required: true, trim: true },
  purchase_price: { type: Number, required: true },
  retail_price: { type: Number, required: true },
  wholesale_price: { type: Number, required: true }
}, { _id: false });

const productSchema = new Schema({
  owner_id: { type: Types.ObjectId, ref: 'User', required: true },
  subcategory_id: { type: Types.ObjectId, ref: 'Subcategory' },
  
  item_name: { type: String, required: true, trim: true }, 
  unit: { type: String, required: true, default: 'pcs', trim: true}, 
  
  // Default (Brand A) Pricing
  default_brand_name: { type: String, default: 'Generic', trim: true },
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

// Optimize searching for products by owner
productSchema.index({ owner_id: 1, is_deleted: 1 });
productSchema.index({ owner_id: 1, item_name: 1 }); // Optimize search bars

export default model('Product', productSchema);