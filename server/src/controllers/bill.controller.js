// import Bill from '../models/Bill.js';
// import Customer from '../models/Customer.js';
// import Product from '../models/Product.js';
// import { generateBillNumber } from '../utils/generateBillNumber.js';

// export const createBill = async (req, res) => {
//   try {
//     const { customer_id, items, is_estimate, price_mode, extra_fare, discount, amount_paid, brand_converted_by } = req.body;
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
//     const created_by = req.user.name || 'Staff Member'; // Extracted from decoded JWT

//     // 1. Calculate totals
//     let itemsTotal = 0;
//     items.forEach(item => {
//       itemsTotal += (item.sale_price * item.quantity);
//     });
//     const total_amount = itemsTotal + Number(extra_fare) - Number(discount);

//     // 2. Determine Status
//     let status = 'Unpaid';
//     if (amount_paid >= total_amount) status = 'Paid';
//     else if (amount_paid > 0) status = 'Partial';

//     const bill_number = await generateBillNumber(owner_id);

//     // 3. Create the Bill Snapshot
//     const bill = await Bill.create({
//       owner_id,
//       customer_id,
//       bill_number,
//       is_estimate,
//       price_mode,
//       status,
//       items,
//       extra_fare,
//       discount,
//       total_amount,
//       amount_paid,
//       created_by,
//       brand_converted_by
//     });

//     // 4. Update Khata (Ledger) if it's NOT an estimate
//     if (!is_estimate && customer_id && total_amount > amount_paid) {
//       const debtAmount = total_amount - amount_paid;
//       await Customer.findByIdAndUpdate(customer_id, {
//         $inc: { total_debt: debtAmount }
//       });
//     }

//     res.status(201).json({ success: true, bill });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Get all bills for the shop
// export const getBills = async (req, res) => {
//   try {
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;

//     // Fetch bills, sorted by newest first, and populate customer name
//     const bills = await Bill.find({ owner_id, is_deleted: false })
//       .populate('customer_id', 'name phone')
//       .sort({ createdAt: -1 });

//     res.status(200).json({ success: true, bills });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Get a single bill by ID
// export const getBillById = async (req, res) => {
//   try {
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;

//     const bill = await Bill.findOne({ _id: req.params.id, owner_id, is_deleted: false })
//       .populate('customer_id', 'name phone address');

//     if (!bill) {
//       return res.status(404).json({ success: false, message: 'Bill not found' });
//     }

//     res.status(200).json({ success: true, bill });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Update a bill (e.g., updating amount paid or status)
// export const updateBill = async (req, res) => {
//   try {
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;

//     // 1. Fetch original bill first — we need it for Khata diff calculation
//     const originalBill = await Bill.findOne({
//       _id: req.params.id,
//       owner_id,
//       is_deleted: false
//     });
//     if (!originalBill) {
//       return res.status(404).json({ success: false, message: 'Bill not found' });
//     }

//     // 2. WHITELIST — only allow these specific fields to be updated
//     // Never trust total_amount from the client — always recalculate it
//     const { items, extra_fare, discount, amount_paid } = req.body;

//     // 3. Build the update object carefully
//     const updateData = { updated_by: req.user.name };

//     // Only update items if provided
//     const newItems = items || originalBill.items;
//     const newExtraFare = extra_fare !== undefined ? Number(extra_fare) : originalBill.extra_fare;
//     const newDiscount = discount !== undefined ? Number(discount) : originalBill.discount;

//     // 4. Always recalculate total_amount server-side from actual items
//     // Never trust the client-sent total
//     let itemsTotal = 0;
//     newItems.forEach(item => {
//       itemsTotal += (Number(item.sale_price) * Number(item.quantity));
//     });
//     const newTotalAmount = itemsTotal + newExtraFare - newDiscount;

//     // 5. Determine new amount_paid safely
//     const newAmountPaid = amount_paid !== undefined
//       ? Math.min(Number(amount_paid), newTotalAmount) // can't pay more than total
//       : originalBill.amount_paid;

//     // 6. Recalculate status
//     let newStatus = 'Unpaid';
//     if (newAmountPaid >= newTotalAmount) newStatus = 'Paid';
//     else if (newAmountPaid > 0) newStatus = 'Partial

//     // 7. Apply whitelisted fields only
//     updateData.items = newItems;
//     updateData.extra_fare = newExtraFare;
//     updateData.discount = newDiscount;
//     updateData.total_amount = newTotalAmount; // server-calculated, not client
//     updateData.amount_paid = newAmountPaid;
//     updateData.status = newStatus;

//     // 8. Perform the update
//     const updatedBill = await Bill.findOneAndUpdate(
//       { _id: req.params.id, owner_id },
//       updateData,
//       { new: true }
//     );

//     // 9. Sync Khata — calculate debt difference and apply it
//     if (!updatedBill.is_estimate && originalBill.customer_id) {
//       const oldDebt = originalBill.total_amount - (originalBill.amount_paid || 0);
//       const newDebt = newTotalAmount - newAmountPaid;
//       const debtDifference = newDebt - oldDebt;

//       if (debtDifference !== 0) {
//         await Customer.findByIdAndUpdate(originalBill.customer_id, {
//           $inc: { total_debt: debtDifference }
//         });
//       }
//     }

//     res.status(200).json({ success: true, bill: updatedBill });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// export const softDeleteBill = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
//     const deleted_by = req.user.name;

//     // FIX A: Fetch the bill FIRST so we can safely read its fields
//     // and check if it actually exists before doing anything
//     const bill = await Bill.findOne({ _id: id, owner_id, is_deleted: false });

//     if (!bill) {
//       return res.status(404).json({ success: false, message: 'Bill not found' });
//     }

//     // Now safely perform the soft delete
//     await Bill.findByIdAndUpdate(id, {
//       is_deleted: true,
//       deleted_by,
//       deleted_at: new Date()
//     });

//     // FIX B & C: Reverse Khata debt with safe fallback for amount_paid
//     // Only reverse if:
//     // - It's a real bill (not an estimate)
//     // - It has a customer linked
//     // - There is actually an unpaid portion to reverse
//     if (!bill.is_estimate && bill.customer_id) {
//       const amountPaid = bill.amount_paid || 0; // FIX C: safe fallback
//       const debtToReverse = bill.total_amount - amountPaid;

//       if (debtToReverse > 0) {
//         await Customer.findByIdAndUpdate(bill.customer_id, {
//           $inc: { total_debt: -debtToReverse }
//         });
//       }
//     }

//     res.status(200).json({ success: true, message: 'Bill deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // brand wise price conversion
// export const convertBillBrand = async (req, res) => {
//   try {
//     const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
//     const { target_brand } = req.body;
//     const billId = req.params.id;

//     // 1. Fetch the bill
//     const bill = await Bill.findOne({ _id: billId, owner_id, is_deleted: false });
//     if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

//     // Store the old debt to recalculate Khata later
//     const oldDebt = bill.total_amount - bill.amount_paid;

//     // 2. Fetch all products referenced in this bill in one go (for performance)
//     const productIds = bill.items.map(item => item.product_id);
//     const products = await Product.find({ _id: { $in: productIds }, owner_id });

//     // Create a dictionary of products for instant lookup
//     const productMap = {};
//     products.forEach(p => { productMap[p._id.toString()] = p; });

//     let newItemsTotal = 0;

//     // 3. Loop through bill items and apply the Brand Switching Logic
//     const updatedItems = bill.items.map(item => {
//       const product = productMap[item.product_id.toString()];

//       // If product was deleted from DB, we keep the item exactly as it was on the bill
//       if (!product) {
//         newItemsTotal += (item.sale_price * item.quantity);
//         return item;
//       }

//       // Look for the target brand in the product's alternate_brands array
//       const brandData = product.alternate_brands.find(
//         b => b.brand_name.toLowerCase() === target_brand.toLowerCase()
//       );

//       let newSalePrice = item.sale_price;
//       let newPurchasePrice = item.purchase_price;
//       let isFallback = false;

//       if (brandData) {
//         // Target Brand Found! Apply its specific prices based on the Bill's price_mode
//         newSalePrice = bill.price_mode === 'Wholesale' ? brandData.wholesale_price : brandData.retail_price;
//         newPurchasePrice = brandData.purchase_price;
//       } else {
//         // Missing Price Fallback! Use the product's default prices
//         newSalePrice = bill.price_mode === 'Wholesale' ? product.wholesale_price : product.retail_price;
//         newPurchasePrice = product.purchase_price;
//         isFallback = true;
//       }

//       newItemsTotal += (newSalePrice * item.quantity);

//       // Return the updated item snapshot
//       return {
//         ...item.toObject(),
//         sale_price: newSalePrice,
//         purchase_price: newPurchasePrice,
//         brand_applied: brandData ? brandData.brand_name : product.default_brand_name,
//         is_fallback_price: isFallback
//       };
//     });

//     // 4. Recalculate the Final Bill Total
//     const newTotalAmount = newItemsTotal + Number(bill.extra_fare) - Number(bill.discount);

//     // 5. Update the Bill in the database
//     bill.items = updatedItems;
//     bill.total_amount = newTotalAmount;
//     bill.brand_converted_by = req.user.name; // Audit trail: Who pushed the button?

//     // Update status if the new total changed how much is owed
//     if (bill.amount_paid >= newTotalAmount) bill.status = 'Paid';
//     else if (bill.amount_paid > 0) bill.status = 'Partial
//     else bill.status = 'Unpaid';

//     await bill.save();

//     // 6. Handle Khata Synchronization
//     if (!bill.is_estimate && bill.customer_id) {
//       const newDebt = newTotalAmount - bill.amount_paid;
//       const debtDifference = newDebt - oldDebt;

//       if (debtDifference !== 0) {
//         await Customer.findByIdAndUpdate(bill.customer_id, {
//           $inc: { total_debt: debtDifference }
//         });
//       }
//     }

//     res.status(200).json({ success: true, message: `Converted to ${target_brand}`, bill });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import { generateBillNumber } from "../utils/generateBillNumber.js";

export const createBill = async (req, res) => {
  try {
    const {
      customer_id,
      items,
      is_estimate,
      price_mode,
      extra_fare,
      discount,
      amount_paid,
      brand_converted_by,
    } = req.body;

    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const created_by = req.user.name || "Staff Member";

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Bill must have at least one item" });
    }

    // 1. Server-side total calculation — never trust client
    let itemsTotal = 0;
    items.forEach((item) => {
      itemsTotal += Number(item.sale_price) * Number(item.quantity);
    });
    const total_amount = Math.max(
      0,
      itemsTotal + Number(extra_fare || 0) - Number(discount || 0),
    );

    // 2. Estimates: no payment, no khata, always "Unpaid" status
    //    Real bills: determine status from amount_paid
    let status = "Unpaid";
    let finalAmountPaid = 0;

    if (!is_estimate) {
      // Cap amount_paid at total to prevent overpayment
      finalAmountPaid = Math.min(Number(amount_paid || 0), total_amount);
      if (finalAmountPaid >= total_amount) status = "Paid";
      else if (finalAmountPaid > 0) status = "Partial";
      else status = "Unpaid";
    }
    // For estimates: status stays 'Unpaid', finalAmountPaid stays 0

    // 3. Sequential bill number per owner
    const bill_number = await generateBillNumber(owner_id);

    // 4. Create bill
    const bill = await Bill.create({
      owner_id,
      customer_id: customer_id || null,
      bill_number,
      is_estimate: !!is_estimate,
      price_mode: price_mode || "Retail",
      status,
      items,
      extra_fare: Number(extra_fare || 0),
      discount: Number(discount || 0),
      total_amount,
      amount_paid: finalAmountPaid,
      created_by,
      brand_converted_by: brand_converted_by || null,
    });

    // 5. Update Khata ONLY for real bills with a customer and outstanding balance
    if (!is_estimate && customer_id) {
      const debtAmount = total_amount - finalAmountPaid;
      if (debtAmount > 0) {
        await Customer.findByIdAndUpdate(customer_id, {
          $inc: { total_debt: debtAmount },
        });
      }
    }

    res.status(201).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const bills = await Bill.find({ owner_id, is_deleted: false })
      .populate("customer_id", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const bill = await Bill.findOne({
      _id: req.params.id,
      owner_id,
      is_deleted: false,
    }).populate("customer_id", "name phone address");
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    res.status(200).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;

    const originalBill = await Bill.findOne({
      _id: req.params.id,
      owner_id,
      is_deleted: false,
    });
    if (!originalBill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });

    // Whitelist only — never accept total_amount from client
    const { items, extra_fare, discount, amount_paid } = req.body;

    const newItems = items || originalBill.items;
    const newExtraFare =
      extra_fare !== undefined ? Number(extra_fare) : originalBill.extra_fare;
    const newDiscount =
      discount !== undefined ? Number(discount) : originalBill.discount;

    // Always recalculate total server-side
    let itemsTotal = 0;
    newItems.forEach((item) => {
      itemsTotal += Number(item.sale_price) * Number(item.quantity);
    });
    const newTotalAmount = Math.max(0, itemsTotal + newExtraFare - newDiscount);

    // Estimates: payment fields stay frozen at 0
    let newAmountPaid = originalBill.amount_paid;
    let newStatus = originalBill.status;

    if (!originalBill.is_estimate) {
      newAmountPaid =
        amount_paid !== undefined
          ? Math.min(Number(amount_paid), newTotalAmount)
          : originalBill.amount_paid;

      if (newAmountPaid >= newTotalAmount) newStatus = "Paid";
      else if (newAmountPaid > 0) newStatus = "Partial";
      else newStatus = "Unpaid";
    }

    const updatedBill = await Bill.findOneAndUpdate(
      { _id: req.params.id, owner_id },
      {
        items: newItems,
        extra_fare: newExtraFare,
        discount: newDiscount,
        total_amount: newTotalAmount,
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_by: req.user.name,
      },
      { new: true },
    );

    // Sync Khata — only for real bills with a customer
    if (!originalBill.is_estimate && originalBill.customer_id) {
      const oldDebt =
        originalBill.total_amount - (originalBill.amount_paid || 0);
      const newDebt = newTotalAmount - newAmountPaid;
      const diff = newDebt - oldDebt;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(originalBill.customer_id, {
          $inc: { total_debt: diff },
        });
      }
    }

    res.status(200).json({ success: true, bill: updatedBill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;

    const bill = await Bill.findOne({ _id: id, owner_id, is_deleted: false });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });

    await Bill.findByIdAndUpdate(id, {
      is_deleted: true,
      deleted_by: req.user.name,
      deleted_at: new Date(),
    });

    // Reverse Khata only for real bills with outstanding balance
    if (!bill.is_estimate && bill.customer_id) {
      const debtToReverse = bill.total_amount - (bill.amount_paid || 0);
      if (debtToReverse > 0) {
        await Customer.findByIdAndUpdate(bill.customer_id, {
          $inc: { total_debt: -debtToReverse },
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const convertBillBrand = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const { target_brand } = req.body;
    const billId = req.params.id;

    const bill = await Bill.findOne({
      _id: billId,
      owner_id,
      is_deleted: false,
    });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });

    const oldDebt = bill.total_amount - (bill.amount_paid || 0);

    const productIds = bill.items.map((item) => item.product_id);
    const products = await Product.find({ _id: { $in: productIds }, owner_id });
    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    let newItemsTotal = 0;
    const updatedItems = bill.items.map((item) => {
      const product = productMap[item.product_id?.toString()];
      if (!product) {
        newItemsTotal += item.sale_price * item.quantity;
        return item;
      }

      const brandData = product.alternate_brands?.find(
        (b) => b.brand_name.toLowerCase() === target_brand.toLowerCase(),
      );
      const isFallback = !brandData;
      const newSalePrice = brandData
        ? bill.price_mode === "Wholesale"
          ? brandData.wholesale_price
          : brandData.retail_price
        : bill.price_mode === "Wholesale"
          ? product.wholesale_price
          : product.retail_price;
      const newPurchasePrice = brandData
        ? brandData.purchase_price
        : product.purchase_price;

      newItemsTotal += newSalePrice * item.quantity;
      return {
        ...item.toObject(),
        sale_price: newSalePrice,
        purchase_price: newPurchasePrice,
        brand_applied: brandData
          ? brandData.brand_name
          : product.default_brand_name,
        is_fallback_price: isFallback,
      };
    });

    const newTotalAmount = Math.max(
      0,
      newItemsTotal + Number(bill.extra_fare) - Number(bill.discount),
    );
    bill.items = updatedItems;
    bill.total_amount = newTotalAmount;
    bill.brand_converted_by = req.user.name;

    // Recalculate status based on existing amount_paid vs new total
    if (!bill.is_estimate) {
      if (bill.amount_paid >= newTotalAmount) bill.status = "Paid";
      else if (bill.amount_paid > 0) bill.status = "Partial";
      else bill.status = "Unpaid";
    }

    await bill.save();

    if (!bill.is_estimate && bill.customer_id) {
      const newDebt = newTotalAmount - (bill.amount_paid || 0);
      const diff = newDebt - oldDebt;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(bill.customer_id, {
          $inc: { total_debt: diff },
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: `Converted to ${target_brand}`, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
