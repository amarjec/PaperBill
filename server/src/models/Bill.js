import { Schema, model, Types } from "mongoose";

const billItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product" },
    item_name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },

    // Pricing Snapshot
    sale_price: { type: Number, required: true },
    purchase_price: { type: Number, required: true },

    // Brand Tracking
    brand_applied: { type: String, required: true, trim: true },
    is_fallback_price: { type: Boolean, default: false },
  },
  { _id: false },
);

const billSchema = new Schema(
  {
    owner_id: { type: Types.ObjectId, ref: "User", required: true },
    customer_id: { type: Types.ObjectId, ref: "Customer" },

    bill_number: { type: String, required: true, trim: true },

    // Bill Modes
    is_estimate: { type: Boolean, default: false },
    price_mode: {
      type: String,
      enum: ["Retail", "Wholesale"],
      default: "Retail",
    },
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Partial", "Cancelled"],
      default: "Paid",
    },

    // Financials
    items: [billItemSchema],
    extra_fare: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    amount_paid: { type: Number, default: 0 },

    // Audit & Traceability
    created_by: { type: String, required: true },
    updated_by: { type: String },
    brand_converted_by: { type: String },
    created_by_id: { type: Types.ObjectId },

    is_deleted: { type: Boolean, default: false },
    deleted_by: { type: String },
    deleted_at: { type: Date },
  },
  { timestamps: true },
);

// Prevents duplicate bill numbers within a shop
billSchema.index({ owner_id: 1, createdAt: -1 });
billSchema.index({ owner_id: 1, bill_number: 1 }, { unique: true });
billSchema.index({ owner_id: 1, status: 1 }); // Great for filtering unpaid/paid bills

export default model("Bill", billSchema);