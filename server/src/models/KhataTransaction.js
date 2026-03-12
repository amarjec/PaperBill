import mongoose from "mongoose";

const khataTransactionSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Credit', 'Payment'], required: true }, 
  // bill_id links this transaction to the specific bill it was created for.
  // Used by the passbook to group and cross-out all rows belonging to a
  // deleted bill. Optional — bulk/manual payments have no single bill (null).
  bill_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  received_by: { type: String }
}, { timestamps: true });

export default mongoose.model('KhataTransaction', khataTransactionSchema);