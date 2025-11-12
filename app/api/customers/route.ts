import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongoose';
import Customer from '@/models/Customer';

// GET /api/customers - Get customers with pagination and optimization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Add search query filter if provided
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
        ],
      };
    }
    
    // Build sort object
    const sortObj: any = {};
    if (sortBy === 'name') {
      sortObj.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'phone') {
      sortObj.phone = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'email') {
      sortObj.email = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Get total count for pagination
    const total = await Customer.countDocuments(filter);
    
    // Get paginated customers with lean() for better performance
    const customers = await Customer.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      data: customers,
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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const customerData = await req.json();
    
    // Validate required fields
    if (!customerData.name || !customerData.phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }
    
    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone: customerData.phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      );
    }
    
    const customer = new Customer(customerData);
    await customer.save();
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 