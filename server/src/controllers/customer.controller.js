import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';

export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      owner_id: req.user.ownerId,
      created_by: req.user.name
    });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ owner_id: req.user.ownerId, is_deleted: false });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    const customer = await Customer.findOne({ _id: req.params.id, owner_id, is_deleted: false });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { ...req.body, updated_by: req.user.name },
      { new: true }
    );
    res.status(200).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Khata Update: When a customer pays off some of their debt
export const updateKhataPayment = async (req, res) => {
  try {
    const { payment_amount } = req.body;
    
    // Decrement the total_debt by the payment_amount
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { $inc: { total_debt: -Math.abs(payment_amount) }, updated_by: req.user.name },
      { new: true }
    );

    // Note: In a full production app, you would also create a "PaymentLog" record here 
    // to track exactly when and how much was paid.

    res.status(200).json({ success: true, message: 'Khata updated successfully', customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteCustomer = async (req, res) => {
  try {
    await Customer.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.ownerId },
      { 
        is_deleted: true, 
        deleted_by: req.user.name,
        deleted_at: new Date()
      }
    );
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Khata details for a specific customer
export const getKhataByCustomerId = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    const customerId = req.params.id;

    // 1. Get the customer details (including their total_debt)
    const customer = await Customer.findOne({ _id: customerId, owner_id, is_deleted: false });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // 2. Get all unpaid or partially paid bills for this specific customer
    const unpaidBills = await Bill.find({
      customer_id: customerId,
      owner_id,
      is_deleted: false,
      is_estimate: false,
      status: { $in: ['Unpaid', 'Partially Paid'] }
    }).sort({ createdAt: 1 }); // Oldest debts first

    // 3. Get recent payment history (fully paid bills) to show on the ledger
    const paymentHistory = await Bill.find({
      customer_id: customerId,
      owner_id,
      is_deleted: false,
      is_estimate: false,
      status: 'Paid'
    }).sort({ updatedAt: -1 }).limit(5); // Last 5 paid transactions

    res.status(200).json({ 
      success: true, 
      customer,
      khata: {
        total_due: customer.total_debt,
        unpaid_bills: unpaidBills,
        recent_payments: paymentHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};