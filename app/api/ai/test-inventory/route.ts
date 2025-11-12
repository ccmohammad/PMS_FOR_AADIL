import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
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
    
    if (!settings?.enableInventoryPredictions) {
      return NextResponse.json({ 
        error: 'Inventory predictions are disabled',
        enabled: false 
      });
    }

    if (!settings.openaiApiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        hasApiKey: false 
      });
    }

    // Set the API key for this request
    aiServices.setApiKey(settings.openaiApiKey);

    // Test with sample data
    const testSalesData = [
      {
        date: new Date('2024-01-01'),
        items: [
          {
            productId: 'test-product-1',
            productName: 'Test Medicine A',
            quantity: 5,
            unitPrice: 10.50
          }
        ]
      }
    ];

    const testInventoryData = [
      {
        productId: 'test-product-1',
        productName: 'Test Medicine A',
        currentStock: 50,
        reorderLevel: 10,
        category: 'Prescription'
      }
    ];

    console.log('Testing inventory prediction with sample data...');
    
    const predictions = await aiServices.predictInventoryDemand(testSalesData, testInventoryData);
    
    return NextResponse.json({ 
      success: true,
      predictions,
      message: 'Inventory prediction test successful'
    });
  } catch (error) {
    console.error('Inventory prediction test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test inventory predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
