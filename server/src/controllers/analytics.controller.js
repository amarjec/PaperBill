import { Types } from "mongoose";
import Bill from "../models/Bill.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { query, user } = req;
    const owner_id = user.role === "Owner" ? user.userId : user.ownerId;
    const { startDate, endDate } = query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Start and End dates are required." });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      owner_id: new Types.ObjectId(owner_id),
      is_deleted: false,
      is_estimate: false,
      createdAt: { $gte: start, $lte: end },
    };

    const [salesAndChart, itemStats, topCustomers, overallTotals] =
      await Promise.all([
        // Daily sales chart data
        Bill.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              dailySales: { $sum: "$total_amount" },
              dailyReceived: { $sum: "$amount_paid" },
              dailyUdhaar: {
                $sum: { $subtract: ["$total_amount", "$amount_paid"] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Per-item stats — profit at item level (gross, before bill-level adjustments)
        Bill.aggregate([
          { $match: matchStage },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.item_name",
              qtySold: { $sum: "$items.quantity" },
              revenue: {
                $sum: { $multiply: ["$items.sale_price", "$items.quantity"] },
              },
              // Gross item profit — bill-level discount/extra_fare adjusted in summary below
              profit: {
                $sum: {
                  $multiply: [
                    {
                      $subtract: [
                        "$items.sale_price",
                        { $ifNull: ["$items.purchase_price", 0] },
                      ],
                    },
                    "$items.quantity",
                  ],
                },
              },
            },
          },
          { $sort: { profit: -1 } },
        ]),

        // Top 5 customers by spend
        Bill.aggregate([
          { $match: { ...matchStage, customer_id: { $ne: null } } },
          {
            $group: {
              _id: "$customer_id",
              totalSpent: { $sum: "$total_amount" },
              billsCount: { $sum: 1 },
            },
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "customers",
              localField: "_id",
              foreignField: "_id",
              as: "customer_details",
            },
          },
          { $unwind: "$customer_details" },
          {
            $project: {
              name: "$customer_details.name",
              phone: "$customer_details.phone",
              totalSpent: 1,
              billsCount: 1,
            },
          },
        ]),

        // Overall totals — include discount and extra_fare for accurate net profit
        Bill.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$total_amount" },
              totalReceived: { $sum: "$amount_paid" },
              totalDiscount: { $sum: "$discount" },
              totalExtraFare: { $sum: "$extra_fare" },
              totalBills: { $sum: 1 },
            },
          },
        ]),
      ]);

    const totals = overallTotals[0] || {
      totalSales: 0,
      totalReceived: 0,
      totalDiscount: 0,
      totalExtraFare: 0,
      totalBills: 0,
    };

    const grossItemProfit = itemStats.reduce(
      (acc, item) => acc + item.profit,
      0,
    );
    const totalProfit =
      grossItemProfit - totals.totalDiscount;
    const totalUdhaar = totals.totalSales - totals.totalReceived;

    res.status(200).json({
      success: true,
      summary: {
        totalSales: totals.totalSales,
        totalProfit,
        totalUdhaar,
        totalReceived: totals.totalReceived,
        totalDiscount: totals.totalDiscount,
        totalBills: totals.totalBills,
      },
      chartData: salesAndChart,
      topProducts: {
        byProfit: itemStats.slice(0, 5),
        byQuantity: [...itemStats]
          .sort((a, b) => b.qtySold - a.qtySold)
          .slice(0, 5),
      },
      topCustomers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
