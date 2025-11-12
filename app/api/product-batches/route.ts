import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProductBatch, { IProductBatch } from '@/models/ProductBatch';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/product-batches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    
    const query: any = {};
    if (productId) query.product = productId;
    if (status) query.status = status;

    const batches = await ProductBatch.find(query)
      .sort({ expiryDate: 1 }) // FEFO - First Expiry, First Out
      .populate('product', 'name sku');

    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/product-batches
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const body = await req.json();
    
    // Validate expiry date
    const expiryDate = new Date(body.expiryDate);
    if (expiryDate <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be in the future' },
        { status: 400 }
      );
    }

    // Create new batch
    const batch = await ProductBatch.create(body);
    await batch.populate('product', 'name sku');

    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Batch number already exists for this product' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/product-batches/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const body = await req.json();
    const { id } = params;

    // Find and update batch
    const batch = await ProductBatch.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('product', 'name sku');

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/product-batches/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = params;
    const batch = await ProductBatch.findByIdAndDelete(id);

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 