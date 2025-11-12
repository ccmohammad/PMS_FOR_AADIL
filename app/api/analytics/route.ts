import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Sale from "@/models/Sale";
import Inventory from "@/models/Inventory";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get monthly sales data for the last 6 months
    const monthlySales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Calculate total revenue
    const totalRevenue = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate profit margin (assuming we have costPrice in the sales items)
    const profitMargin = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCost: { $sum: { $multiply: ["$items.quantity", "$items.costPrice"] } }
        }
      },
      {
        $project: {
          profitMargin: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$totalRevenue", "$totalCost"] },
                  "$totalRevenue"
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    // Get inventory value
    const inventoryValue = await Inventory.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      // Filter out expired products
      {
        $match: {
          $or: [
            { expiryDate: { $gt: new Date() } },
            { expiryDate: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalCostValue: {
            $sum: { 
              $multiply: ["$quantity", { $ifNull: ["$product.costPrice", 0] }] 
            }
          },
          totalMarketValue: {
            $sum: { 
              $multiply: ["$quantity", { $ifNull: ["$product.price", 0] }] 
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          costValue: "$totalCostValue",
          marketValue: "$totalMarketValue"
        }
      }
    ]);

    // Get quarterly inventory turnover
    const quarters = [
      { start: new Date(now.getFullYear(), 0, 1), label: 'Q1' },
      { start: new Date(now.getFullYear(), 3, 1), label: 'Q2' },
      { start: new Date(now.getFullYear(), 6, 1), label: 'Q3' },
      { start: new Date(now.getFullYear(), 9, 1), label: 'Q4' }
    ];

    const quarterlyTurnover = await Promise.all(
      quarters.map(async (quarter) => {
        const quarterEnd = new Date(quarter.start);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);

        const sales = await Sale.aggregate([
          {
            $match: {
              createdAt: {
                $gte: quarter.start,
                $lt: quarterEnd
              },
              status: 'completed'
            }
          },
          {
            $unwind: "$items"
          },
          {
            $group: {
              _id: null,
              totalSold: { $sum: "$items.quantity" }
            }
          }
        ]);

        const avgInventory = await Inventory.aggregate([
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$quantity" }
            }
          }
        ]);

        const turnover = sales[0]?.totalSold && avgInventory[0]?.totalQuantity
          ? (sales[0].totalSold / avgInventory[0].totalQuantity) * 4 // Annualized
          : 0;

        return {
          label: quarter.label,
          turnover: Number(turnover.toFixed(2))
        };
      })
    );

    // Get top products performance
    const topProducts = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.product",
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          totalQuantity: { $sum: "$items.quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          name: "$product.name",
          revenue: "$totalRevenue",
          margin: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$totalRevenue", { $multiply: ["$totalQuantity", "$product.costPrice"] }] },
                  "$totalRevenue"
                ]
              },
              100
            ]
          },
          turnover: {
            $divide: ["$totalQuantity", { $max: ["$product.quantity", 1] }]
          }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 4
      }
    ]);

    // Format monthly sales data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = {
      labels: monthlySales.map(sale => monthNames[sale._id.month - 1]),
      actual: monthlySales.map(sale => Number(sale.totalRevenue.toFixed(2))),
    };

    return NextResponse.json({
      salesData,
      totalRevenue: totalRevenue[0]?.total || 0,
      profitMargin: profitMargin[0]?.profitMargin || 0,
      inventoryValue: {
        cost: inventoryValue[0]?.costValue || 0,
        market: inventoryValue[0]?.marketValue || 0
      },
      quarterlyTurnover,
      topProducts: topProducts.map(product => ({
        name: product.name,
        revenue: Number(product.revenue.toFixed(2)),
        margin: Number(product.margin.toFixed(2)),
        turnover: Number(product.turnover.toFixed(2))
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 