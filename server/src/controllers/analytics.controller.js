import Bill from '../models/Bill.js';

export const getProfitReport = async (req, res) => {
  try {
    const owner_id = req.user.userId; // Always Owner
    
    // Fetch all valid, non-deleted bills that are NOT estimates
    const bills = await Bill.find({ 
      owner_id, 
      is_deleted: false, 
      is_estimate: false 
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalPendingKhata = 0;

    bills.forEach(bill => {
      // 1. Add up pending debt for Khata tracking
      totalPendingKhata += (bill.total_amount - bill.amount_paid);

      // Only calculate profit for items in bills that have been at least partially paid
      // (Or adjust this based on how you recognize revenue)
      bill.items.forEach(item => {
        totalRevenue += (item.sale_price * item.quantity);
        totalCost += (item.purchase_price * item.quantity);
      });
    });

    const grossProfit = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalCost,
        grossProfit,
        totalPendingKhata,
        totalBillsGenerated: bills.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};