import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Inventory from '@/models/Inventory';
import Product from '@/models/Product';
import { Types } from 'mongoose';

// POST /api/inventory - Add inventory
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const inventoryData = await req.json();
    
    // Validate required fields
    const requiredFields = ['product', 'batch', 'quantity', 'location', 'reorderLevel'];
    for (const field of requiredFields) {
      if (!inventoryData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if product exists
    if (!Types.ObjectId.isValid(inventoryData.product)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(inventoryData.product);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product requires expiry date
    if (product.expiryDateRequired && !inventoryData.expiryDate) {
      return NextResponse.json(
        { error: 'Expiry date is required for this product' },
        { status: 400 }
      );
    }
    
    // Check if inventory with same product and batch already exists
    const existingInventory = await Inventory.findOne({
      product: inventoryData.product,
      batch: inventoryData.batch,
    });
    
    if (existingInventory) {
      // Update existing inventory
      existingInventory.quantity += inventoryData.quantity;
      await existingInventory.save();
      
      return NextResponse.json(existingInventory);
    }
    
    // Create new inventory
    const inventory = await Inventory.create(inventoryData);
    
    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Error adding inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add inventory' },
      { status: 500 }
    );
  }
}

// GET /api/inventory - Get inventory with pagination and optimization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const searchParams = req.nextUrl.searchParams;
    const lowStock = searchParams.get('lowStock');
    const expiringSoon = searchParams.get('expiringSoon');
    const product = searchParams.get('product');
    const query = searchParams.get('query');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'product.name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const skip = (page - 1) * limit;
    
    let filter: any = {};
    
    // Filter by product if provided
    if (product && Types.ObjectId.isValid(product)) {
      filter.product = product;
    }
    
    // Add search query filter if provided
    if (query) {
      // First get matching products with limit to avoid large queries
      const products = await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { genericName: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      }).limit(100); // Limit product search to prevent large queries
      
      if (products.length > 0) {
        filter.product = { $in: products.map(p => p._id) };
      } else {
        // If no products match, return empty result
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }
    
    // Filter low stock items
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }
    
    // Filter items expiring soon (within 90 days)
    if (expiringSoon === 'true') {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      
      filter.expiryDate = {
        $exists: true,
        $ne: null,
        $lte: ninetyDaysFromNow,
        $gte: new Date(),
      };
    }
    
    // Build sort object
    const sortObj: any = {};
    if (sortBy === 'product.name') {
      sortObj['product.name'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'quantity') {
      sortObj.quantity = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'expiryDate') {
      sortObj.expiryDate = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);
    
    // Get paginated inventory with lean() for better performance
    const inventory = await Inventory.find(filter)
      .populate('product', 'name genericName sku category price requiresPrescription manufacturer')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      data: inventory,
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
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
} 