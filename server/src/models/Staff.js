import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: true },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const staffSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  assigned_pin: { type: String, }, 
  
  // Security
  device_id: { type: String }, // Single-Device tracking for Staff
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  
  // Granular Permissions
  permissions: {
    category: { type: permissionSchema, default: () => ({}) },
    subCategory: { type: permissionSchema, default: () => ({}) },
    products: { type: permissionSchema, default: () => ({}) },
    customers: { type: permissionSchema, default: () => ({}) },
    bills: { type: permissionSchema, default: () => ({}) },
    khata: { type: permissionSchema, default: () => ({}) },
  },

  // Audit
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String }, // Name of Owner who deleted
  deleted_at: { type: Date }
}, { timestamps: true });

// Ensure a phone number is only used once per shop owner
staffSchema.index({ owner_id: 1, phone_number: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);