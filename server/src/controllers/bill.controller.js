import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import KhataTransaction from "../models/KhataTransaction.js";
import { generateBillNumber } from "../utils/generateBillNumber.js";

const getOwnerId = (user) =>
  user.role === "Owner" ? user.userId : user.ownerId;

const deriveStatus = (isEstimate, amountPaid, totalAmount) => {
  if (isEstimate) return "Unpaid";
  if (amountPaid >= totalAmount) return "Paid";
  if (amountPaid > 0) return "Partial";
  return "Unpaid";
};

const calcTotal = (items, extraFare, discount) => {
  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.sale_price) * Number(item.quantity),
    0,
  );
  return Math.max(0, itemsTotal + Number(extraFare) - Number(discount));
};

export const createBill = async (req, res) => {
  try {
    const { body, user } = req;
    const {
      customer_id,
      items,
      is_estimate,
      price_mode,
      extra_fare = 0,
      discount = 0,
      amount_paid = 0,
      brand_converted_by,
    } = body;

    const owner_id = getOwnerId(user);
    const created_by = user.name;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Bill must have at least one item." });
    }

    const total_amount = calcTotal(items, extra_fare, discount);
    const finalAmountPaid = is_estimate
      ? 0
      : Math.min(Number(amount_paid), total_amount);
    const status = deriveStatus(is_estimate, finalAmountPaid, total_amount);
    const bill_number = await generateBillNumber(owner_id);

    const bill = await Bill.create({
      owner_id,
      customer_id: customer_id || null,
      bill_number,
      is_estimate,
      price_mode: price_mode || "Retail",
      status,
      items,
      extra_fare: Number(extra_fare),
      discount: Number(discount),
      total_amount,
      amount_paid: finalAmountPaid,
      created_by,
      created_by_id: user.userId, 
      brand_converted_by: brand_converted_by || null,
    });

    if (!is_estimate && customer_id) {
      const debtAmount = total_amount - finalAmountPaid;
      if (debtAmount > 0) {
        await Customer.findByIdAndUpdate(customer_id, {
          $inc: { total_debt: debtAmount },
        });
      }
      if (finalAmountPaid > 0) {
        await KhataTransaction.create({
          owner_id,
          customer_id,
          bill_id: bill._id,
          amount: finalAmountPaid,
          type: "Payment",
          received_by: created_by,
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
    const { user } = req;
    const owner_id = getOwnerId(user);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // 1. Base query for the shop
    const query = { owner_id, is_deleted: false };

    // 2. 🚨 STAFF GUARD: Only return bills created by this specific staff member
    if (user.role === "Staff") {
      query.created_by_id = user.userId;
    }

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate("customer_id", "name phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bill.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      bills,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { params, user } = req;
    const owner_id = getOwnerId(user);
    const bill = await Bill.findOne({
      _id: params.id,
      owner_id,
      is_deleted: false,
    }).populate("customer_id", "name phone address");

    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found." });
    res.status(200).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    const { body, params, user } = req;
    const owner_id = getOwnerId(user);
    const { items, extra_fare, discount, amount_paid } = body;

    const originalBill = await Bill.findOne({
      _id: params.id,
      owner_id,
      is_deleted: false,
    });
    if (!originalBill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found." });

    const newItems = items ?? originalBill.items;
    const newExtraFare =
      extra_fare !== undefined ? Number(extra_fare) : originalBill.extra_fare;
    const newDiscount =
      discount !== undefined ? Number(discount) : originalBill.discount;
    const newTotalAmount = calcTotal(newItems, newExtraFare, newDiscount);

    const newAmountPaid = !originalBill.is_estimate
      ? amount_paid !== undefined
        ? Math.min(Number(amount_paid), newTotalAmount)
        : Math.min(originalBill.amount_paid, newTotalAmount)
      : 0;

    const newStatus = deriveStatus(
      originalBill.is_estimate,
      newAmountPaid,
      newTotalAmount,
    );

    const updatedBill = await Bill.findOneAndUpdate(
      { _id: params.id, owner_id },
      {
        items: newItems,
        extra_fare: newExtraFare,
        discount: newDiscount,
        total_amount: newTotalAmount,
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_by: user.name,
      },
      { new: true },
    );

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

      // Record a KhataTransaction whenever the paid amount increases
      const paymentIncrease = newAmountPaid - (originalBill.amount_paid || 0);
      if (paymentIncrease > 0) {
        await KhataTransaction.create({
          owner_id,
          customer_id: originalBill.customer_id,
          bill_id: originalBill._id,
          amount: paymentIncrease,
          type: "Payment",
          received_by: user.name,
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
    const { params, user } = req;
    const owner_id = getOwnerId(user);

    const bill = await Bill.findOne({
      _id: params.id,
      owner_id,
      is_deleted: false,
    });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found." });

    await Bill.findByIdAndUpdate(params.id, {
      is_deleted: true,
      deleted_by: user.name,
      deleted_at: new Date(),
    });

    if (!bill.is_estimate && bill.customer_id) {
      const khataOps = [];
      const debtToReverse = bill.total_amount - (bill.amount_paid || 0);
      const auditLabel = `[Bill ${bill.bill_number} deleted by ${user.name}]`;

      // ✅ FIX: Use plain $inc instead of aggregation pipeline syntax.
      // The array-based pipeline update was crashing findByIdAndUpdate,
      // causing the catch to return 500 — bill was deleted but the frontend
      // received an error, showing a false "Failed to delete" alert.
      if (debtToReverse > 0) {
        khataOps.push(
          Customer.findByIdAndUpdate(bill.customer_id, {
            $inc: { total_debt: -debtToReverse },
          })
        );
        // Record debt reversal in ledger — reduces what customer owes
        khataOps.push(
          KhataTransaction.create({
            owner_id,
            customer_id: bill.customer_id,
            bill_id: bill._id,
            amount: debtToReverse,
            type: "Payment",
            received_by: auditLabel,
          })
        );
      }

      // Reverse the upfront payment — customer effectively "un-paid",
      // so their debt goes back up via a Credit entry
      if ((bill.amount_paid || 0) > 0) {
        khataOps.push(
          KhataTransaction.create({
            owner_id,
            customer_id: bill.customer_id,
            bill_id: bill._id,
            amount: bill.amount_paid,
            type: "Credit",
            received_by: auditLabel,
          })
        );
      }

      if (khataOps.length > 0) await Promise.all(khataOps);
    }

    res
      .status(200)
      .json({ success: true, message: "Bill deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const convertBillBrand = async (req, res) => {
  try {
    const { body, params, user } = req;
    const owner_id = getOwnerId(user);
    const { target_brand } = body;

    if (!target_brand) {
      return res
        .status(400)
        .json({ success: false, message: "Target brand is required." });
    }

    const bill = await Bill.findOne({
      _id: params.id,
      owner_id,
      is_deleted: false,
    });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found." });

    // FIX: Capture debt values BEFORE any mutation on the bill object
    const oldAmountPaid = bill.amount_paid || 0;
    const oldDebt = bill.total_amount - oldAmountPaid;

    const productIds = bill.items
      .map((item) => item.product_id)
      .filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds }, owner_id });
    const productMap = Object.fromEntries(
      products.map((p) => [p._id.toString(), p]),
    );

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
    bill.brand_converted_by = user.name;
    // FIX: Use captured oldAmountPaid — not bill.amount_paid which may already be mutated in memory
    bill.status = deriveStatus(bill.is_estimate, oldAmountPaid, newTotalAmount);

    await bill.save();

    if (!bill.is_estimate && bill.customer_id) {
      const newDebt = newTotalAmount - oldAmountPaid;
      const diff = newDebt - oldDebt;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(bill.customer_id, {
          $inc: { total_debt: diff },
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: `Converted to ${target_brand}.`, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── POST /api/bills/:id/convert-estimate ──────────────────────────────────────
// Converts an estimate into a real bill.
// Body (all optional): { customer_id, amount_paid, price_mode }
//
// Logic:
//   - Flips is_estimate → false
//   - Assigns a fresh bill_number (the estimate's number is recycled)
//   - Recalculates status based on amount_paid
//   - If customer_id is provided, updates their total_debt and records a
//     KhataTransaction for any upfront payment
export const convertEstimateToBill = async (req, res) => {
  try {
    const { params, body, user } = req;
    const owner_id = getOwnerId(user);
    const { customer_id, amount_paid = 0, price_mode } = body;

    const estimate = await Bill.findOne({
      _id: params.id,
      owner_id,
      is_deleted: false,
      is_estimate: true,          // must be an estimate
    });

    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: "Estimate not found or already converted.",
      });
    }

    const finalAmountPaid = Math.min(Number(amount_paid), estimate.total_amount);
    const finalCustomerId = customer_id || estimate.customer_id || null;
    const finalPriceMode  = price_mode  || estimate.price_mode;
    const status = deriveStatus(false, finalAmountPaid, estimate.total_amount);

    // Generate a new bill number for the converted bill
    const bill_number = await generateBillNumber(owner_id);

    const convertedBill = await Bill.findByIdAndUpdate(
      params.id,
      {
        is_estimate:  false,
        bill_number,
        price_mode:   finalPriceMode,
        customer_id:  finalCustomerId,
        amount_paid:  finalAmountPaid,
        status,
        updated_by:   user.name,
      },
      { new: true },
    );

    // Update customer khata if a customer is linked
    if (finalCustomerId) {
      const debtAmount = estimate.total_amount - finalAmountPaid;

      await Promise.all([
        debtAmount > 0
          ? Customer.findByIdAndUpdate(finalCustomerId, {
              $inc: { total_debt: debtAmount },
            })
          : Promise.resolve(),

        finalAmountPaid > 0
          ? KhataTransaction.create({
              owner_id,
              customer_id: finalCustomerId,
              bill_id: convertedBill._id,
              amount: finalAmountPaid,
              type: "Payment",
              received_by: user.name,
            })
          : Promise.resolve(),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Estimate converted to bill successfully.",
      bill: convertedBill,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};