import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import dbConnect from '@/lib/db';
import Sale from '@/models/Sale';
import Inventory from '@/models/Inventory';
import ProductBatch from '@/models/ProductBatch';

// DELETE /api/sales/:id - Delete a sale
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    // Find the sale first to get its items
    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Start a session for transaction
    const mongoSession = await dbConnect().then(m => m.startSession());
    
    try {
      await mongoSession.withTransaction(async () => {
        // For each item in the sale, restore the inventory
        for (const item of sale.items) {
          // Update inventory quantity
          await Inventory.findByIdAndUpdate(
            item.inventory,
            { $inc: { quantity: item.quantity } },
            { session: mongoSession }
          );

          // If item has batch, restore batch quantity
          if (item.batch) {
            await ProductBatch.findByIdAndUpdate(
              item.batch._id,
              { 
                $inc: { quantity: item.quantity },
                $set: { status: 'active' } // Reactivate batch if it was depleted
              },
              { session: mongoSession }
            );
          }
        }

        // Delete the sale
        await Sale.findByIdAndDelete(id, { session: mongoSession });
      });

      return NextResponse.json({ message: 'Sale deleted successfully' });
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
} 