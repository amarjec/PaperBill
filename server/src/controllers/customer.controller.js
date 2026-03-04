import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";

export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      owner_id: req.user.role === "Owner" ? req.user.userId : req.user.ownerId,
      created_by: req.user.name,
    });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      owner_id: req.user.role === "Owner" ? req.user.userId : req.user.ownerId,
      is_deleted: false,
    });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const customer = await Customer.findOne({
      _id: req.params.id,
      owner_id,
      is_deleted: false,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        owner_id:
          req.user.role === "Owner" ? req.user.userId : req.user.ownerId,
      },
      { ...req.body, updated_by: req.user.name },
      { new: true },
    );
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateKhataPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const customerId = req.params.id;
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount" });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      owner_id,
      is_deleted: false,
      Partial,
    });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // 1. Log the transaction so the owner can see the details
    customer.khata_transactions.push({
      amount: Number(amount),
      received_by: req.user.name,
    });

    // 2. Reduce the master debt
    customer.total_debt -= Number(amount);
    if (customer.total_debt < 0) customer.total_debt = 0; // Prevent negative debt
    await customer.save();

    // 3. Cascade the payment across unpaid bills (Oldest First)
    let remainingAmount = Number(amount);
    const unpaidBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      status: { $in: ["Unpaid", "Partial"] },
      is_estimate: false,
      is_deleted: false,
    }).sort({ createdAt: 1 }); // 1 = Oldest first

    for (let bill of unpaidBills) {
      if (remainingAmount <= 0) break;

      const pendingOnBill = bill.total_amount - (bill.amount_paid || 0);

      if (remainingAmount >= pendingOnBill) {
        // Pay this bill off completely
        bill.amount_paid = bill.total_amount;
        bill.status = "Paid";
        remainingAmount -= pendingOnBill;
      } else {
        // Partially pay this bill
        bill.amount_paiPartial;
        bill.status = "Partial";
        remainingAmount = 0;
      }
      await bill.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment successfully recorded and cascaded.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteCustomer = async (req, res) => {
  try {
    await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        owner_id:
          req.user.role === "Owner" ? req.user.userId : req.user.ownerId,
      },
      {
        is_deleted: true,
        deleted_by: req.user.name,
        deleted_at: new Date(),
      },
    );
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getKhataByCustomerId = async (req, res) => {
  try {
    const owner_id =
      req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
    const customerId = req.params.id;

    const customer = await Customer.findOne({
      _id: customerId,
      owner_id,
      is_deleted: false,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Unpaid bills (Used for cascading payments and the WhatsApp reminder logic)
    const unpaidBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      is_deleted: false,
      is_estimate: false,
      status: { $in: ["Unpaid", "Partial"] },
    }).sort({ createdAt: 1 }); // Oldest first

    // ALL Bills (Used to show the complete customer history)
    const allBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      is_deleted: false,
      is_estimate: false,
    }).sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      customer,
      khata: {
        unpaidBills,
        allBills,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
