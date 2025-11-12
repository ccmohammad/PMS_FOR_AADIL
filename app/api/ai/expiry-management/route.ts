import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
import Inventory from '@/models/Inventory';
import AISettings from '@/models/AISettings';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get AI settings
    const settings = await AISettings.findOne();
    
    if (!settings?.enableExpiryManagement) {
      return NextResponse.json({ alerts: [] });
    }

    if (!settings.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Settings.' },
        { status: 400 }
      );
    }

    // Set the API key for this request
    aiServices.setApiKey(settings.openaiApiKey);

    // Get inventory items with expiry dates (limit to 50 items to stay within token limits)
    const inventory = await Inventory.find({
      expiryDate: { $exists: true, $ne: null }
    })
    .populate('product', 'name genericName category manufacturer')
    .sort({ expiryDate: 1 }) // Sort by expiry date (earliest first)
    .limit(50) // Limit to 50 items to stay within token limits
    .lean();

    const expiryAlerts = await aiServices.analyzeExpiryManagement(inventory);
    
    return NextResponse.json({ alerts: expiryAlerts });
  } catch (error) {
    console.error('Expiry management analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze expiry management' },
      { status: 500 }
    );
  }
}
