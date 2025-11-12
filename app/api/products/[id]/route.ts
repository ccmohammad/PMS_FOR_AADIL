import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Inventory from '@/models/Inventory';
import { Types } from 'mongoose';

// GET /api/products/:id - Get a specific product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id - Update a specific product
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const productData = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'manufacturer', 'price', 'costPrice'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Find product first
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Don't allow SKU change
    delete productData.sku;
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: productData },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id - Delete a specific product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product has associated sales
    const salesCount = await Sale.countDocuments({
      'items.product': id
    });
    
    if (salesCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product',
          message: `This product cannot be deleted because it has ${salesCount} associated sale record${salesCount > 1 ? 's' : ''}. Products with sales history must be retained for record-keeping purposes.`,
          salesCount: salesCount
        },
        { status: 400 }
      );
    }
    
    // Check if product has associated inventory
    const inventoryCount = await Inventory.countDocuments({
      product: id
    });
    
    if (inventoryCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product',
          message: `This product cannot be deleted because it has ${inventoryCount} associated inventory record${inventoryCount > 1 ? 's' : ''}. Please remove all inventory records for this product first.`,
          inventoryCount: inventoryCount
        },
        { status: 400 }
      );
    }
    
    // If no associated records, proceed with deletion
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 