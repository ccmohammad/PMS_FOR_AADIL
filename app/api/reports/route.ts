import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const searchParams = req.nextUrl.searchParams;
    
    // Default start date is 30 days ago
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    defaultStartDate.setHours(0, 0, 0, 0);
    const startDate = searchParams.get('startDate') || defaultStartDate.toISOString();
    
    // Default end date is tomorrow at end of day
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 1);
    defaultEndDate.setHours(23, 59, 59, 999);
    const endDate = searchParams.get('endDate') || defaultEndDate.toISOString();

    // Get sales summary
    const salesQuery = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    };

    const sales = await Sale.find(salesQuery)
      .populate('items.product', 'name category')
      .lean();

    // Calculate sales metrics
    const totalSales = sales.length;
    let totalRevenue = 0;
    const productSales: { 
      [key: string]: { 
        name: string; 
        quantity: number; 
        revenue: number;
        batchSales?: { 
          [batchNumber: string]: { 
            quantity: number; 
            revenue: number;
            expiryDate: string;
          } 
        };
      } 
    } = {};

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      
      sale.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
            batchSales: {}
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += (item.unitPrice - (item.discount || 0)) * item.quantity;

        // Track batch sales if available
        if (item.batchDetails) {
          if (!productSales[productId].batchSales![item.batchDetails.batchNumber]) {
            productSales[productId].batchSales![item.batchDetails.batchNumber] = {
              quantity: 0,
              revenue: 0,
              expiryDate: item.batchDetails.expiryDate
            };
          }
          productSales[productId].batchSales![item.batchDetails.batchNumber].quantity += item.quantity;
          productSales[productId].batchSales![item.batchDetails.batchNumber].revenue += 
            (item.unitPrice - (item.discount || 0)) * item.quantity;
        }
      });
    });

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get top selling products with batch information
    const topSellingProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
        batchSales: data.batchSales ? Object.entries(data.batchSales).map(([batchNumber, batchData]) => ({
          batchNumber,
          ...batchData
        })) : []
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get inventory summary
    const totalProducts = await Product.countDocuments();
    const totalStockValue = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$quantity', '$product.price'] }
          }
        }
      }
    ]);

    const lowStockItems = await Inventory.countDocuments({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    
    const expiringSoonItems = await Inventory.countDocuments({
      expiryDate: {
        $exists: true,
        $ne: null,
        $lte: ninetyDaysFromNow,
        $gte: new Date()
      }
    });

    return NextResponse.json({
      salesSummary: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        topSellingProducts
      },
      inventorySummary: {
        totalProducts,
        totalStockValue: totalStockValue[0]?.totalValue || 0,
        lowStockItems,
        expiringSoonItems
      }
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
} 