import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import KhataTransaction from "../models/KhataTransaction.js";

const getOwnerId = (user) => (user.role === "Owner" ? user.userId : user.ownerId);

export const createCustomer = async (req, res) => {
  try {
    const { body, user } = req;
    const { name, phone, address } = body;

    if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });

    const customer = await Customer.create({
      name, phone, address,
      owner_id:   getOwnerId(user),
      created_by: user.name,
    });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ owner_id: getOwnerId(req.user), is_deleted: false });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { params, user } = req;
    const customer = await Customer.findOne({
      _id: params.id, owner_id: getOwnerId(user), is_deleted: false,
    });

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { name, phone, address } = body;

    // FIX: Validate required fields to prevent blanking them out
    if (!name) return res.status(400).json({ success: false, message: "Customer name is required." });

    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { name, phone, address, updated_by: user.name },
      { new: true, runValidators: true },
    );

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateKhataPayment = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { amount } = body;
    const customerId = params.id;
    const owner_id   = getOwnerId(user);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount." });
    }

    const customer = await Customer.findOne({ _id: customerId, owner_id, is_deleted: false });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    // FIX: Use the SAME capped value for both the debt deduction and the bill cascade.
    // Previously, debt used `appliedAmount` (capped) while the cascade used raw `amount`
    // (uncapped), which could over-pay bills and corrupt the ledger.
    const appliedAmount = Math.min(Number(amount), customer.total_debt);

    if (appliedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Customer has no outstanding debt." });
    }

    // Atomic debt deduction
    await Customer.findByIdAndUpdate(customerId, { $inc: { total_debt: -appliedAmount } });

    // Record the transaction
    await KhataTransaction.create({
      owner_id,
      customer_id: customerId,
      amount:      appliedAmount,
      type:        "Payment",
      received_by: user.name,
    });

    // Cascade across unpaid bills oldest-first using the same appliedAmount
    // NOTE: This loop is intentionally sequential to avoid concurrent over-payment.
    // For true atomicity consider a MongoDB transaction session here.
    let remaining = appliedAmount;
    const unpaidBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      status:      { $in: ["Unpaid", "Partial"] },
      is_estimate: false,
      is_deleted:  false,
    }).sort({ createdAt: 1 });

    for (const bill of unpaidBills) {
      if (remaining <= 0) break;
      const pendingOnBill = bill.total_amount - (bill.amount_paid || 0);

      if (remaining >= pendingOnBill) {
        bill.amount_paid = bill.total_amount;
        bill.status      = "Paid";
        remaining       -= pendingOnBill;
      } else {
        bill.amount_paid = (bill.amount_paid || 0) + remaining;
        bill.status      = "Partial";
        remaining        = 0;
      }
      await bill.save();
    }

    res.status(200).json({ success: true, message: "Payment successfully recorded." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getKhataByCustomerId = async (req, res) => {
  try {
    const { params, user } = req;
    const owner_id   = getOwnerId(user);
    const customerId = params.id;

    const customer = await Customer.findOne({ _id: customerId, owner_id, is_deleted: false });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    const [unpaidBills, allBills, transactions] = await Promise.all([
      Bill.find({
        customer_id: customerId, owner_id, is_deleted: false,
        is_estimate: false, status: { $in: ["Unpaid", "Partial"] },
      }).sort({ createdAt: 1 }),
      Bill.find({
        customer_id: customerId, owner_id, is_deleted: false, is_estimate: false,
      }).sort({ createdAt: -1 }),
      KhataTransaction.find({ customer_id: customerId, owner_id }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({ success: true, customer, khata: { unpaidBills, allBills, transactions } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteCustomer = async (req, res) => {
  try {
    const { params, user } = req;
    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { is_deleted: true, deleted_by: user.name, deleted_at: new Date() },
    );

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.status(200).json({ success: true, message: "Customer deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
