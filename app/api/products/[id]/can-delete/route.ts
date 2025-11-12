import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Inventory from '@/models/Inventory';
import { Types } from 'mongoose';

// GET /api/products/:id/can-delete - Check if a product can be deleted
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
    
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check for associated sales
    const salesCount = await Sale.countDocuments({
      'items.product': id
    });
    
    // Check for associated inventory
    const inventoryCount = await Inventory.countDocuments({
      product: id
    });
    
    const canDelete = salesCount === 0 && inventoryCount === 0;
    
    const restrictions = [];
    if (salesCount > 0) {
      restrictions.push({
        type: 'sales',
        count: salesCount,
        message: `${salesCount} associated sale record${salesCount > 1 ? 's' : ''}`
      });
    }
    
    if (inventoryCount > 0) {
      restrictions.push({
        type: 'inventory',
        count: inventoryCount,
        message: `${inventoryCount} associated inventory record${inventoryCount > 1 ? 's' : ''}`
      });
    }
    
    return NextResponse.json({
      canDelete,
      restrictions,
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku
      }
    });
  } catch (error) {
    console.error('Error checking product deletion status:', error);
    return NextResponse.json(
      { error: 'Failed to check deletion status' },
      { status: 500 }
    );
  }
} 