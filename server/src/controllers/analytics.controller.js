import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const owner_id = req.user.role === 'Owner' ? req.user.userId : req.user.ownerId;
    
    // The frontend will send ISO date strings based on the filter (Day, Week, Month, Custom)
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and End dates are required.' });
    }

    // 1. The Master Filter (Applies to all queries)
    const matchStage = {
      owner_id: new mongoose.Types.ObjectId(owner_id),
      is_deleted: false,
      is_estimate: false,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // --- RUNNING 4 PIPELINES IN PARALLEL FOR MAXIMUM SPEED ---
    const [salesAndChart, itemStats, topCustomers, overallTotals] = await Promise.all([
      
      // QUERY 1: Time-Series Chart Data (Grouped by Day)
      Bill.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            dailySales: { $sum: "$total_amount" },
            dailyReceived: { $sum: "$amount_paid" },
            dailyUdhaar: { $sum: { $subtract: ["$total_amount", "$amount_paid"] } }
          }
        },
        { $sort: { "_id": 1 } } // Sort chronologically for the chart
      ]),

      // QUERY 2: Product Insights (Top Selling & Most Profitable)
      Bill.aggregate([
        { $match: matchStage },
        { $unwind: "$items" }, // Break bills down into individual items
        {
          $group: {
            _id: "$items.item_name", // Group by Product Name
            qtySold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.sale_price", "$items.quantity"] } },
            profit: {
              $sum: {
                $multiply: [
                  { $subtract: ["$items.sale_price", { $ifNull: ["$items.purchase_price", 0] }] },
                  "$items.quantity"
                ]
              }
            }
          }
        },
        { $sort: { profit: -1 } } // Sort by highest profit
      ]),

      // QUERY 3: Top Customers (Who brings the most business?)
      Bill.aggregate([
        { $match: { ...matchStage, customer_id: { $ne: null } } },
        {
          $group: {
            _id: "$customer_id",
            totalSpent: { $sum: "$total_amount" },
            billsCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }, // Only get the top 5
        // Lookup the actual customer name from the Customers collection
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customer_details"
          }
        },
        { $unwind: "$customer_details" },
        {
          $project: {
            name: "$customer_details.name",
            phone: "$customer_details.phone",
            totalSpent: 1,
            billsCount: 1
          }
        }
      ]),

      // QUERY 4: Overall Totals (The big numbers at the top of the dashboard)
      Bill.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total_amount" },
            totalReceived: { $sum: "$amount_paid" },
            totalDiscount: { $sum: "$discount" },
            totalBills: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format the response beautifully for the frontend
    const totals = overallTotals[0] || { totalSales: 0, totalReceived: 0, totalDiscount: 0, totalBills: 0 };
    const totalProfit = itemStats.reduce((acc, item) => acc + item.profit, 0);
    const totalUdhaar = totals.totalSales - totals.totalReceived;

    res.status(200).json({
      success: true,
      summary: {
        totalSales: totals.totalSales,
        totalProfit: totalProfit,
        totalUdhaar: totalUdhaar,
        totalReceived: totals.totalReceived,
        totalBills: totals.totalBills
      },
      chartData: salesAndChart, // Feed this directly into react-native-gifted-charts
      topProducts: {
        byProfit: itemStats.slice(0, 5), // Top 5 most profitable
        byQuantity: [...itemStats].sort((a, b) => b.qtySold - a.qtySold).slice(0, 5) // Top 5 highest volume
      },
      topCustomers: topCustomers
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};