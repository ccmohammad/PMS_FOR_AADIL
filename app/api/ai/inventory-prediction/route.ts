import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
import Sale from '@/models/Sale';
import Inventory from '@/models/Inventory';
import AISettings from '@/models/AISettings';

export async function GET(req: NextRequest) {
  try {
    console.log('Starting inventory prediction API...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    console.log('Session found, connecting to database...');
    await dbConnect();
    console.log('Database connected');

    // Get AI settings
    console.log('Fetching AI settings...');
    const settings = await AISettings.findOne();
    console.log('AI settings found:', !!settings);
    
    if (!settings?.enableInventoryPredictions) {
      console.log('Inventory predictions disabled');
      return NextResponse.json({ predictions: [] });
    }

    if (!settings.openaiApiKey) {
      console.log('No OpenAI API key configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Settings.' },
        { status: 400 }
      );
    }

    // Set the API key for this request
    console.log('Setting API key...');
    aiServices.setApiKey(settings.openaiApiKey);

    // Get recent sales history (last 30 days) to stay within token limits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesHistory = await Sale.find({
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('items.product', 'name genericName category')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to 100 most recent sales

    // Get current inventory
    const currentInventory = await Inventory.find()
      .populate('product', 'name genericName category manufacturer')
      .lean();

    // Prepare data for AI analysis
    const salesData = salesHistory.map(sale => ({
      date: sale.createdAt,
      items: sale.items.map(item => ({
        productId: item.product._id.toString(),
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }));

    const inventoryData = currentInventory.map(inv => ({
      productId: inv.product._id.toString(),
      productName: inv.product.name,
      currentStock: inv.quantity,
      reorderLevel: inv.reorderLevel,
      category: inv.product.category
    }));

    // If no inventory data, return empty predictions
    if (inventoryData.length === 0) {
      return NextResponse.json({ predictions: [] });
    }

    console.log('Recent sales data count (last 30 days, max 100 records):', salesData.length);
    console.log('Current inventory data count:', inventoryData.length);
    
    const predictions = await aiServices.predictInventoryDemand(salesData, inventoryData);
    
    console.log('Predictions count:', predictions.length);
    
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Inventory prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate inventory predictions' },
      { status: 500 }
    );
  }
}
