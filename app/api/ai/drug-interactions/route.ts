import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
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

    const { medications } = await req.json();
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: 'Medications array is required' },
        { status: 400 }
      );
    }

    // Get AI settings
    await dbConnect();
    const settings = await AISettings.findOne();
    
    if (!settings?.enableDrugInteractions) {
      return NextResponse.json({ interactions: [] });
    }

    if (!settings.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Settings.' },
        { status: 400 }
      );
    }

    // Set the API key for this request
    aiServices.setApiKey(settings.openaiApiKey);

    const interactions = await aiServices.checkDrugInteractions(medications);
    
    // Filter interactions based on severity threshold
    const filteredInteractions = interactions.filter(interaction => {
      const severityLevels = { minor: 1, moderate: 2, major: 3, severe: 4 };
      const threshold = severityLevels[settings.interactionSeverityThreshold];
      const interactionLevel = severityLevels[interaction.severity];
      return interactionLevel >= threshold;
    });
    
    return NextResponse.json({ interactions: filteredInteractions });
  } catch (error) {
    console.error('Drug interaction check error:', error);
    return NextResponse.json(
      { error: 'Failed to check drug interactions' },
      { status: 500 }
    );
  }
}
