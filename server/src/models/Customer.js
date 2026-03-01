import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  
  // Khata (Credit Ledger)
  total_debt: { type: Number, default: 0 }, 
  
  // NEW: Log of individual payments received
  khata_transactions: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    received_by: { type: String } // To track which staff member collected the cash
  }],
  
  // Audit Trail
  created_by: { type: String, required: true }, 
  updated_by: { type: String },
  is_deleted: { type: Boolean, default: false },
  deleted_by: { type: String },
  deleted_at: { type: Date }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);