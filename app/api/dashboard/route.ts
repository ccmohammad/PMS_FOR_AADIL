import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import { Product, Inventory, Sale, User } from '@/lib/models';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get current date in user's timezone
    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    console.log('Today date string:', todayDateString);

    // Get today's sales using date string matching
    const todaySales = await Sale.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              todayDateString
            ]
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Today\'s sales query result:', todaySales);

    // Get monthly revenue
    const monthlyRevenue = await Sale.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$createdAt" }, now.getMonth() + 1] },
              { $eq: [{ $year: "$createdAt" }, now.getFullYear()] }
            ]
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get sales trend for the past 7 days
    const salesTrend = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo,
            $lte: now
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt"
            }
          },
          totalSales: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Get low stock items count
    const lowStockItems = await Inventory.countDocuments({
      $expr: {
        $lte: ['$quantity', '$reorderLevel']
      }
    });

    // Get expiring soon items count (within next 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const expiringSoonItems = await Inventory.countDocuments({
      expiryDate: {
        $exists: true,
        $ne: null,
        $lte: threeMonthsFromNow,
        $gt: now
      }
    });

    // Get recent sales with product details
    const recentSales = await Sale.find({
      status: 'completed'
    })
      .populate({
        path: 'items.product',
        select: 'name genericName'
      })
      .populate({
        path: 'processedBy',
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get inventory alerts
    const inventoryAlerts = await Inventory.find({
      $or: [
        { $expr: { $lte: ['$quantity', '$reorderLevel'] } },
        {
          expiryDate: {
            $exists: true,
            $ne: null,
            $lte: threeMonthsFromNow,
          }
        }
      ]
    })
    .populate({
      path: 'product',
      select: 'name genericName'
    })
    .limit(10)
    .sort({ expiryDate: 1 }); // Sort by expiry date to show most urgent first

    // Count expired items
    const expiredItems = await Inventory.countDocuments({
      expiryDate: {
        $exists: true,
        $ne: null,
        $lt: now
      }
    });

    return NextResponse.json({
      stats: {
        todaySales: todaySales[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        lowStockItems,
        expiringSoonItems,
        expiredItems
      },
      salesTrend,
      recentSales,
      inventoryAlerts
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 