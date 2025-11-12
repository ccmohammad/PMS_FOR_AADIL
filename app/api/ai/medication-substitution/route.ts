import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import AISettings from '@/models/AISettings';

export async function POST(req: NextRequest) {
  // Medication substitution feature disabled to reduce costs
  return NextResponse.json({ 
    substitutions: [],
    message: 'Medication substitution feature has been disabled to reduce costs'
  });
}
