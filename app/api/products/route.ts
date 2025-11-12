import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

// POST /api/products - Create a new product
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
    
    const productData = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'manufacturer', 'sku', 'price', 'costPrice'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if product with same SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 409 }
      );
    }
    
    // Create product
    const product = await Product.create(productData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// GET /api/products - Get all products
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
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Add category filter if provided
    if (category) {
      filter = { ...filter, category };
    }
    
    // Add search query filter if provided
    if (query) {
      filter = {
        ...filter,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { genericName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { manufacturer: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
        ],
      };
    }
    
    // Build sort object
    const sortObj: any = {};
    if (sortBy === 'name') {
      sortObj.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sortObj.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'category') {
      sortObj.category = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'manufacturer') {
      sortObj.manufacturer = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    // Get paginated products with lean() for better performance
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      data: products,
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 