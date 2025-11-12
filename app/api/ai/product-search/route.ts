import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import AISettings from '@/models/AISettings';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const { query } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get AI settings
    const settings = await AISettings.findOne();
    
    if (!settings?.enableProductSearch) {
      return NextResponse.json({ results: [] });
    }

    if (!settings.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Settings.' },
        { status: 400 }
      );
    }

    // Set the API key for this request
    aiServices.setApiKey(settings.openaiApiKey);

    // Get limited products for AI search (most relevant ones)
    const products = await Product.find()
      .select('name genericName category manufacturer price')
      .limit(30)
      .lean();

    const searchResults = await aiServices.searchProducts(query, products);
    
    return NextResponse.json({ results: searchResults });
  } catch (error) {
    console.error('AI product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
