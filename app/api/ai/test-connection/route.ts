import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

// POST /api/ai/test-connection - Test OpenAI API connection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const { apiKey } = await req.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key with a simple request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        max_tokens: 5
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Connection successful' });
    } else {
      const errorData = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          message: 'Connection failed', 
          error: errorData.error?.message || 'Unknown error' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Connection failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
