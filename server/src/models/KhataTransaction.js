import mongoose from "mongoose";

const khataTransactionSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Credit', 'Payment'], required: true }, 
  received_by: { type: String }
}, { timestamps: true });

export default mongoose.model('KhataTransaction', khataTransactionSchema);