import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Product from "@/models/Product";

interface StockAlert {
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  location: string;
  type: 'low-stock' | 'expiring' | 'out-of-stock';
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if models are available
    if (!Inventory || !Product) {
      console.error('Models not available');
      return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }, { status: 200 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'type';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const alertType = searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const now = new Date();

    // Build filter for alert types
    let alertFilter = {};
    if (alertType) {
      if (alertType === 'out-of-stock') {
        alertFilter = { quantity: 0 };
      } else if (alertType === 'low-stock') {
        alertFilter = { 
          quantity: { $gt: 0 },
          $expr: { $lte: ['$quantity', '$reorderLevel'] }
        };
      } else if (alertType === 'expiring') {
        alertFilter = {
          expiryDate: { 
            $gte: now,
            $lte: threeMonthsFromNow
          }
        };
      }
    }

    // Get inventory items with alerts using aggregation for better performance
    const pipeline = [
      {
        $match: {
          ...alertFilter,
          product: { $exists: true, $ne: null }
        }
      },
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
        $match: {
          'product.sku': { $exists: true, $ne: null },
          'product.name': { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          alertType: {
            $cond: [
              { $eq: ['$quantity', 0] },
              'out-of-stock',
              {
                $cond: [
                  { $lte: ['$quantity', '$reorderLevel'] },
                  'low-stock',
                  {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$expiryDate', null] },
                          { $gte: ['$expiryDate', now] },
                          { $lte: ['$expiryDate', threeMonthsFromNow] }
                        ]
                      },
                      'expiring',
                      null
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          alertType: { $ne: null },
          ...(alertType && { alertType: alertType })
        }
      },
      {
        $project: {
          sku: '$product.sku',
          name: '$product.name',
          quantity: 1,
          reorderLevel: 1,
          expiryDate: 1,
          location: 1,
          type: '$alertType',
          createdAt: 1
        }
      }
    ];

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Inventory.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add sorting and pagination
    const sortField = sortBy === 'name' ? 'name' : 
                     sortBy === 'quantity' ? 'quantity' :
                     sortBy === 'expiryDate' ? 'expiryDate' :
                     sortBy === 'type' ? 'type' : 'createdAt';
    
    pipeline.push(
      { $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const alerts = await Inventory.aggregate(pipeline);
    
    const totalPages = Math.ceil(total / limit);

    console.log(`Found ${alerts.length} alerts (page ${page}/${totalPages}) from ${total} total alerts`);
    
    return NextResponse.json({
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    
    // Return more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch alerts',
        ...(isDevelopment && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    );
  }
} 