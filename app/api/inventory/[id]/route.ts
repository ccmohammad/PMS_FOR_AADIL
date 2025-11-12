import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Inventory from '@/models/Inventory';
import { getServerSession } from 'next-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;

    const deletedInventory = await Inventory.findByIdAndDelete(id);
    
    if (!deletedInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 