import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export default mongoose.model('Counter', counterSchema);