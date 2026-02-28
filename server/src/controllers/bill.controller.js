import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const createBill = async (req, res) => {
  try {
    const { customer_id, items, is_estimate, price_mode, extra_fare, discount, amount_paid, brand_converted_by } = req.body;
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    const created_by = req.user.name || 'Staff Member'; // Extracted from decoded JWT

    // 1. Calculate totals
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += (item.sale_price * item.quantity);
    });
    const total_amount = itemsTotal + Number(extra_fare) - Number(discount);
    
    // 2. Determine Status
    let status = 'Unpaid';
    if (amount_paid >= total_amount) status = 'Paid';
    else if (amount_paid > 0) status = 'Partially Paid';

    // 3. Create the Bill Snapshot
    const bill = await Bill.create({
      owner_id,
      customer_id,
      bill_number: `INV-${Date.now()}`,
      is_estimate,
      price_mode,
      status,
      items,
      extra_fare,
      discount,
      total_amount,
      amount_paid,
      created_by,
      brand_converted_by
    });

    // 4. Update Khata (Ledger) if it's NOT an estimate
    if (!is_estimate && customer_id && total_amount > amount_paid) {
      const debtAmount = total_amount - amount_paid;
      await Customer.findByIdAndUpdate(customer_id, {
        $inc: { total_debt: debtAmount }
      });
    }

    res.status(201).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all bills for the shop
export const getBills = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    // Fetch bills, sorted by newest first, and populate customer name
    const bills = await Bill.find({ owner_id, is_deleted: false })
      .populate('customer_id', 'name phone')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single bill by ID
export const getBillById = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    const bill = await Bill.findOne({ _id: req.params.id, owner_id, is_deleted: false })
      .populate('customer_id', 'name phone address');
      
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    
    res.status(200).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a bill (e.g., updating amount paid or status)
export const updateBill = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    // 1. Find the original bill to calculate Khata differences
    const originalBill = await Bill.findOne({ _id: req.params.id, owner_id, is_deleted: false });
    if (!originalBill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // 2. Calculate old debt vs new debt
    const oldDebt = originalBill.total_amount - originalBill.amount_paid;
    
    // Assume req.body might contain new totals, otherwise fallback to old ones
    const newTotalAmount = req.body.total_amount !== undefined ? req.body.total_amount : originalBill.total_amount;
    const newAmountPaid = req.body.amount_paid !== undefined ? req.body.amount_paid : originalBill.amount_paid;
    const newDebt = newTotalAmount - newAmountPaid;
    
    const debtDifference = newDebt - oldDebt; // How much the debt changed

    // 3. Update the bill
    const updatedBill = await Bill.findOneAndUpdate(
      { _id: req.params.id, owner_id },
      { 
        ...req.body, 
        updated_by: req.user.name 
      },
      { new: true }
    );

    // 4. Apply the Debt Difference to the Customer's Khata (if it's not an estimate)
    if (!updatedBill.is_estimate && originalBill.customer_id && debtDifference !== 0) {
      await Customer.findByIdAndUpdate(originalBill.customer_id, {
        $inc: { total_debt: debtDifference }
      });
    }

    res.status(200).json({ success: true, bill: updatedBill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user.name;

    const bill = await Bill.findByIdAndUpdate(id, {
      is_deleted: true,
      deleted_by,
      deleted_at: new Date()
    });

    // Optional: Reverse Khata debt if a bill is deleted
    if (!bill.is_estimate && bill.status !== 'Paid' && bill.customer_id) {
      const debtAmount = bill.total_amount - bill.amount_paid;
      await Customer.findByIdAndUpdate(bill.customer_id, {
        $inc: { total_debt: -debtAmount }
      });
    }

    res.status(200).json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// brand wise price conversion
export const convertBillBrand = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    const { target_brand } = req.body; 
    const billId = req.params.id;

    // 1. Fetch the bill
    const bill = await Bill.findOne({ _id: billId, owner_id, is_deleted: false });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Store the old debt to recalculate Khata later
    const oldDebt = bill.total_amount - bill.amount_paid;

    // 2. Fetch all products referenced in this bill in one go (for performance)
    const productIds = bill.items.map(item => item.product_id);
    const products = await Product.find({ _id: { $in: productIds }, owner_id });
    
    // Create a dictionary of products for instant lookup
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    let newItemsTotal = 0;

    // 3. Loop through bill items and apply the Brand Switching Logic
    const updatedItems = bill.items.map(item => {
      const product = productMap[item.product_id.toString()];
      
      // If product was deleted from DB, we keep the item exactly as it was on the bill
      if (!product) {
        newItemsTotal += (item.sale_price * item.quantity);
        return item; 
      }

      // Look for the target brand in the product's alternate_brands array
      const brandData = product.alternate_brands.find(
        b => b.brand_name.toLowerCase() === target_brand.toLowerCase()
      );

      let newSalePrice = item.sale_price;
      let newPurchasePrice = item.purchase_price;
      let isFallback = false;

      if (brandData) {
        // Target Brand Found! Apply its specific prices based on the Bill's price_mode
        newSalePrice = bill.price_mode === 'Wholesale' ? brandData.wholesale_price : brandData.retail_price;
        newPurchasePrice = brandData.purchase_price;
      } else {
        // Missing Price Fallback! Use the product's default prices
        newSalePrice = bill.price_mode === 'Wholesale' ? product.wholesale_price : product.retail_price;
        newPurchasePrice = product.purchase_price;
        isFallback = true;
      }

      newItemsTotal += (newSalePrice * item.quantity);

      // Return the updated item snapshot
      return {
        ...item.toObject(),
        sale_price: newSalePrice,
        purchase_price: newPurchasePrice,
        brand_applied: brandData ? brandData.brand_name : product.default_brand_name,
        is_fallback_price: isFallback
      };
    });

    // 4. Recalculate the Final Bill Total
    const newTotalAmount = newItemsTotal + Number(bill.extra_fare) - Number(bill.discount);
    
    // 5. Update the Bill in the database
    bill.items = updatedItems;
    bill.total_amount = newTotalAmount;
    bill.brand_converted_by = req.user.name; // Audit trail: Who pushed the button?
    
    // Update status if the new total changed how much is owed
    if (bill.amount_paid >= newTotalAmount) bill.status = 'Paid';
    else if (bill.amount_paid > 0) bill.status = 'Partially Paid';
    else bill.status = 'Unpaid';

    await bill.save();

    // 6. Handle Khata Synchronization
    if (!bill.is_estimate && bill.customer_id) {
      const newDebt = newTotalAmount - bill.amount_paid;
      const debtDifference = newDebt - oldDebt;
      
      if (debtDifference !== 0) {
        await Customer.findByIdAndUpdate(bill.customer_id, {
          $inc: { total_debt: debtDifference }
        });
      }
    }

    res.status(200).json({ success: true, message: `Converted to ${target_brand}`, bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};