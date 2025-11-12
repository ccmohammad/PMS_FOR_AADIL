import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import Sale from '@/models/Sale';

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const customerId = params.id;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if customer has any sales
    const salesCount = await Sale.countDocuments({ customer: customerId });
    if (salesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete customer. Customer has ${salesCount} associated sales. Please contact administrator if you need to delete this customer.` },
        { status: 400 }
      );
    }
    
    // Delete the customer
    await Customer.findByIdAndDelete(customerId);
    
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const customerId = params.id;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const customerData = await req.json();
    
    // Validate required fields
    if (!customerData.name || !customerData.phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }
    
    // Check if another customer with same phone already exists
    const existingCustomer = await Customer.findOne({ 
      phone: customerData.phone,
      _id: { $ne: customerId }
    });
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Another customer with this phone number already exists' },
        { status: 400 }
      );
    }
    
    // Update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        address: customerData.address || undefined,
      },
      { new: true }
    );
    
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
} 