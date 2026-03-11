import Counter from '../models/Counter.js';

export const generateBillNumber = async (owner_id) => {
  const counter = await Counter.findOneAndUpdate(
    { owner_id },                          // find this owner's counter
    { $inc: { seq: 1 } },                  // atomically increment
    { new: true, upsert: true }            // create if doesn't exist, return updated doc
  );
  
  // Formats as: INV-00001, INV-00002, etc.
  // The padStart ensures clean sorting even as a string
  return `INV-${String(counter.seq).padStart(5, '0')}`;
};