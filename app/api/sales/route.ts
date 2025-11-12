import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import dbConnect from '@/lib/db';
import Sale from '@/models/Sale';
import Customer from '@/models/Customer';
import Inventory from '@/models/Inventory';
import ProductBatch from '@/models/ProductBatch';
import { Types } from 'mongoose';

interface InventoryUpdate {
  id: Types.ObjectId;
  newQuantity: number;
}

interface BatchUpdate {
  id: Types.ObjectId;
  newQuantity: number;
}

// POST /api/sales - Create a new sale
export async function POST(req: NextRequest) {
  let requestData;
  let session;
  
  try {
    session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    requestData = await req.json();
    
    // Validate required fields
    if (!requestData.items || !Array.isArray(requestData.items) || requestData.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required for the sale' },
        { status: 400 }
      );
    }
    
    // Check if all item fields are valid
    for (const item of requestData.items) {
      if (!item.product || !item.inventory || !item.quantity || item.unitPrice === undefined) {
        return NextResponse.json(
          { error: 'All item fields (product, inventory, quantity, unitPrice) are required' },
          { status: 400 }
        );
      }
      
      if (!Types.ObjectId.isValid(item.product) || !Types.ObjectId.isValid(item.inventory)) {
        return NextResponse.json(
          { error: 'Invalid product or inventory ID' },
          { status: 400 }
        );
      }
    }

    // Handle customer - either find existing or create new
    let customerId = null;
    if (requestData.customer && requestData.customer.name && requestData.customer.phone) {
      // Try to find existing customer by phone
      let customer = await Customer.findOne({ phone: requestData.customer.phone });
      
      if (!customer) {
        // Create new customer
        customer = new Customer({
          name: requestData.customer.name,
          phone: requestData.customer.phone,
          email: requestData.customer.email || undefined,
        });
        await customer.save();
      } else {
        // Update existing customer info if provided
        if (requestData.customer.name && customer.name !== requestData.customer.name) {
          customer.name = requestData.customer.name;
        }
        if (requestData.customer.email && customer.email !== requestData.customer.email) {
          customer.email = requestData.customer.email;
        }
        await customer.save();
      }
      
      customerId = customer._id;
    }
    
    // Check if all products exist and have sufficient inventory
    const inventoryUpdates: InventoryUpdate[] = [];
    const batchUpdates: BatchUpdate[] = [];
    
    for (const item of requestData.items) {
      const inventory = await Inventory.findById(item.inventory).populate('product');
      
      if (!inventory) {
        return NextResponse.json(
          { error: `Inventory not found for item ${item.product}` },
          { status: 404 }
        );
      }

      // If item has batch information, verify and update batch
      if (item.batch) {
        const batch = await ProductBatch.findById(item.batch._id);
        
        if (!batch) {
          return NextResponse.json(
            { error: `Batch not found for item ${item.product}` },
            { status: 404 }
          );
        }
        
        if (batch.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock in batch ${batch.batchNumber} for item ${item.product}. Available: ${batch.quantity}` },
            { status: 400 }
          );
        }
        
        // Add to batch updates
        batchUpdates.push({
          id: batch._id,
          newQuantity: batch.quantity - item.quantity,
        });
      } else {
        // For non-batch items, check regular inventory
        if (inventory.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for item ${item.product}. Available: ${inventory.quantity}` },
            { status: 400 }
          );
        }
      }
      
      // Add to inventory updates
      inventoryUpdates.push({
        id: inventory._id,
        newQuantity: inventory.quantity - item.quantity,
      });
      
      // Check if prescription is required
      if (inventory.product.requiresPrescription && !requestData.hasPrescription) {
        return NextResponse.json(
          { error: `Prescription is required for product ${inventory.product.name}` },
          { status: 400 }
        );
      }
    }
    
    // Create the sale with all required fields
    const saleData = {
      customer: customerId,
      items: requestData.items.map(item => ({
        ...item,
        batchDetails: item.batch ? {
          batchNumber: item.batch.batchNumber,
          expiryDate: item.batch.expiryDate
        } : null
      })),
      totalAmount: requestData.totalAmount,
      paymentMethod: requestData.paymentMethod || 'cash',
      hasPrescription: requestData.hasPrescription || false,
      prescription: requestData.prescription,
      processedBy: session.user.id,
      status: 'completed',
      createdAt: new Date()
    };
    
    // Start a session for transaction
    const mongoSession = await dbConnect().then(m => m.startSession());
    
    try {
      let response;
      await mongoSession.withTransaction(async () => {
        // Create the sale and immediately populate it
        const sale = await Sale.create([saleData], { session: mongoSession })
          .then(sales => Sale.populate(sales[0], [
            { path: 'processedBy', select: 'name' },
            { path: 'customer', select: 'name phone email' },
            { path: 'items.product', select: 'name sku category' }
          ]));
        
        // Bulk update inventory
        const bulkOps = inventoryUpdates.map(update => ({
          updateOne: {
            filter: { _id: update.id },
            update: { $set: { quantity: update.newQuantity } }
          }
        }));
        
        await Inventory.bulkWrite(bulkOps, { session: mongoSession });

        // Bulk update batches if any
        if (batchUpdates.length > 0) {
          const batchBulkOps = batchUpdates.map(update => ({
            updateOne: {
              filter: { _id: update.id },
              update: { 
                $set: { 
                  quantity: update.newQuantity,
                  status: update.newQuantity === 0 ? 'depleted' : 'active'
                }
              }
            }
          }));
          
          await ProductBatch.bulkWrite(batchBulkOps, { session: mongoSession });
        }
        
        response = NextResponse.json(sale, { status: 201 });
      });
      
      return response;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error('Error creating sale. Details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestData: requestData || 'No request data available',
      sessionInfo: {
        userId: session?.user?.id,
        userEmail: session?.user?.email
      }
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sale' },
      { status: 500 }
    );
  }
}

// GET /api/sales - Get all sales
export async function GET(req: NextRequest) {
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
    
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    const filter: {
      createdAt?: {
        $gte: Date;
        $lte: Date;
      };
      status?: string;
      customer?: Types.ObjectId;
    } = {};
    
    // Add customer filter if provided
    if (customerId && Types.ObjectId.isValid(customerId)) {
      filter.customer = new Types.ObjectId(customerId);
    }
    
    // Set default end date to tomorrow
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 1);
    defaultEndDate.setHours(23, 59, 59, 999);
    
    // Add date range filter (only if no customer filter, or use a wider range for customer history)
    if (customerId) {
      // For customer-specific queries, don't apply date filters to get full history
      // Unless specifically requested
      if (startDate) {
        const endDateTime = endDate ? new Date(endDate) : defaultEndDate;
        endDateTime.setHours(23, 59, 59, 999);
        
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: endDateTime,
        };
      }
    } else {
      // For general sales queries, apply default date range
      if (startDate) {
        // Use provided end date or default to tomorrow
        const endDateTime = endDate ? new Date(endDate) : defaultEndDate;
        endDateTime.setHours(23, 59, 59, 999);
        
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: endDateTime,
        };
      } else {
        // If no start date, use last 30 days to tomorrow
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        filter.createdAt = {
          $gte: defaultStartDate,
          $lte: defaultEndDate,
        };
      }
    }
    
    // Add status filter
    if (status && ['completed', 'returned', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    
    // Build sort object
    const sortObj: any = {};
    if (sortBy === 'createdAt') {
      sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'totalAmount') {
      sortObj.totalAmount = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'status') {
      sortObj.status = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'customer') {
      sortObj['customer.name'] = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Get total count for pagination
    const total = await Sale.countDocuments(filter);
    
    // Get paginated sales with lean() for better performance
    const sales = await Sale.find(filter)
      .populate('processedBy', 'name')
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku category')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      data: sales,
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
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
} 