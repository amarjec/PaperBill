import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import KhataTransaction from "../models/KhataTransaction.js";

const getOwnerId = (user) =>
  user.role === "Owner" ? user.userId : user.ownerId;

export const createCustomer = async (req, res) => {
  try {
    const { body, user } = req;
    const { name, phone, address } = body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Customer name is required." });

    const customer = await Customer.create({
      name,
      phone,
      address,
      owner_id: getOwnerId(user),
      created_by: user.name,
    });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      owner_id: getOwnerId(req.user),
      is_deleted: false,
    });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { params, user } = req;
    const customer = await Customer.findOne({
      _id: params.id,
      owner_id: getOwnerId(user),
      is_deleted: false,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { body, params, user } = req;
    const { name, phone, address } = body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Customer name is required." });

    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, owner_id: getOwnerId(user), is_deleted: false },
      { name, phone, address, updated_by: user.name },
      { new: true, runValidators: true },
    );

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
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
    const owner_id = getOwnerId(user);

    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount." });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      owner_id,
      is_deleted: false,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });

    const appliedAmount = Math.min(Number(amount), customer.total_debt);

    if (appliedAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Customer has no outstanding debt." });
    }

    // Atomic debt deduction
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { total_debt: -appliedAmount },
    });

    // Cascade payment across oldest unpaid bills first, oldest → newest.
    // For each bill we create a SEPARATE KhataTransaction stamped with that
    // bill's _id. This means the passbook can cross out exactly the right
    // payment rows when a bill is later deleted — no ambiguity from a single
    // lump-sum transaction that spans multiple bills.
    let remaining = appliedAmount;

    const unpaidBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      status: { $in: ["Unpaid", "Partial"] },
      is_estimate: false,
      is_deleted: false,
    }).sort({ createdAt: 1 });

    const txnOps = [];

    for (const bill of unpaidBills) {
      if (remaining <= 0) break;
      const pendingOnBill = bill.total_amount - (bill.amount_paid || 0);
      const appliedToBill = Math.min(remaining, pendingOnBill);

      if (remaining >= pendingOnBill) {
        bill.amount_paid = bill.total_amount;
        bill.status = "Paid";
        remaining -= pendingOnBill;
      } else {
        bill.amount_paid = (bill.amount_paid || 0) + remaining;
        bill.status = "Partial";
        remaining = 0;
      }

      // One KhataTransaction per bill — stamped with bill_id so the passbook
      // can group and cross it out if the bill is ever deleted or restored.
      txnOps.push(
        bill.save(),
        KhataTransaction.create({
          owner_id,
          customer_id: customerId,
          bill_id: bill._id,
          amount: appliedToBill,
          type: "Payment",
          received_by: user.name,
        })
      );
    }

    if (txnOps.length > 0) await Promise.all(txnOps);

    res
      .status(200)
      .json({ success: true, message: "Payment successfully recorded." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getKhataByCustomerId = async (req, res) => {
  try {
    const { params, user } = req;
    const owner_id = getOwnerId(user);
    const customerId = params.id;

    const customer = await Customer.findOne({
      _id: customerId,
      owner_id,
      is_deleted: false,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });

    const [unpaidBills, allBills, deletedBills, transactions] = await Promise.all([
      Bill.find({
        customer_id: customerId,
        owner_id,
        is_deleted: false,
        is_estimate: false,
        status: { $in: ["Unpaid", "Partial"] },
      }).sort({ createdAt: 1 }),
      Bill.find({
        customer_id: customerId,
        owner_id,
        is_deleted: false,
        is_estimate: false,
      }).sort({ createdAt: -1 }),
      // Deleted bills included so passbook ledger stays balanced.
      // Their reversal KhataTransactions still exist — without the original
      // invoice row the running balance calculation goes wrong.
      Bill.find({
        customer_id: customerId,
        owner_id,
        is_deleted: true,
        is_estimate: false,
      }).select('bill_number total_amount amount_paid createdAt deleted_at deleted_by').sort({ createdAt: 1 }),
      KhataTransaction.find({ customer_id: customerId, owner_id }).sort({
        createdAt: -1,
      }),
    ]);

    res
      .status(200)
      .json({
        success: true,
        customer,
        khata: { unpaidBills, allBills, deletedBills, transactions },
      });
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

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};