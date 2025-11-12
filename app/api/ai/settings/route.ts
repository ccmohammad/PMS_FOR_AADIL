import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import dbConnect from '@/lib/db';
import AISettings from '@/models/AISettings';

// GET /api/ai/settings - Get AI settings
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

    let settings = await AISettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await AISettings.create({
        openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        enableDrugInteractions: true,
        enableInventoryPredictions: true,
        enableProductSearch: true,
        enableExpiryManagement: true,
        enablePrescriptionProcessing: true,
        enableMedicationSubstitution: false,
        interactionSeverityThreshold: 'moderate'
      });
    } else {
      // Force update all fields to ensure they're properly set
      let needsUpdate = false;
      
      console.log('AI Settings GET: Current settings before migration:', settings);
      console.log('AI Settings GET: enableMedicationSubstitution before migration:', settings.enableMedicationSubstitution);
      console.log('AI Settings GET: enableMedicationSubstitution type:', typeof settings.enableMedicationSubstitution);
      
      // Always ensure enableMedicationSubstitution is true (force migration)
      if (settings.enableMedicationSubstitution !== true) {
        console.log('AI Settings GET: Forcing enableMedicationSubstitution to true (was:', settings.enableMedicationSubstitution, ')');
        settings.enableMedicationSubstitution = true;
        needsUpdate = true;
      }
      
      if (typeof settings.enableMedicationSubstitution !== 'boolean') {
        console.log('AI Settings GET: Fixing enableMedicationSubstitution field type');
        settings.enableMedicationSubstitution = true;
        needsUpdate = true;
      }
      
      // Force add the field if it doesn't exist at all
      if (!('enableMedicationSubstitution' in settings)) {
        console.log('AI Settings GET: Field does not exist, adding it');
        settings.enableMedicationSubstitution = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('AI Settings GET: Saving updated settings...');
        await settings.save();
        console.log('AI Settings GET: Updated settings:', settings);
      } else {
        // Force update using MongoDB $set to ensure field exists
        console.log('AI Settings GET: Force updating with MongoDB $set...');
        await AISettings.updateOne(
          { _id: settings._id },
          { $set: { enableMedicationSubstitution: true } }
        );
        settings.enableMedicationSubstitution = true;
        console.log('AI Settings GET: Force updated settings:', settings);
      }
    }
    
    // Ensure the field is always present in the response
    if (settings.enableMedicationSubstitution === undefined) {
      console.log('AI Settings GET: Field still undefined, forcing to true in response');
      settings.enableMedicationSubstitution = true;
    }
    
    console.log('AI Settings GET: Returning settings:', settings);
    console.log('AI Settings GET: enableMedicationSubstitution value:', settings.enableMedicationSubstitution);
    console.log('AI Settings GET: enableMedicationSubstitution type:', typeof settings.enableMedicationSubstitution);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

// POST /api/ai/settings - Update AI settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const settingsData = await req.json();
    
    console.log('AI Settings POST: Received data:', settingsData);
    console.log('AI Settings POST: enableMedicationSubstitution value:', settingsData.enableMedicationSubstitution);
    
    await dbConnect();

    // Update or create settings with explicit field mapping
    const updateData = {
      openaiApiKey: settingsData.openaiApiKey || '',
      enableDrugInteractions: Boolean(settingsData.enableDrugInteractions),
      enableInventoryPredictions: Boolean(settingsData.enableInventoryPredictions),
      enableProductSearch: Boolean(settingsData.enableProductSearch),
      enableExpiryManagement: Boolean(settingsData.enableExpiryManagement),
      enablePrescriptionProcessing: Boolean(settingsData.enablePrescriptionProcessing),
      enableMedicationSubstitution: Boolean(settingsData.enableMedicationSubstitution),
      interactionSeverityThreshold: settingsData.interactionSeverityThreshold || 'moderate'
    };
    
    console.log('AI Settings POST: Processed update data:', updateData);
    
    const settings = await AISettings.findOneAndUpdate(
      {},
      updateData,
      { upsert: true, new: true }
    );
    
    console.log('AI Settings POST: Saved settings:', settings);
    console.log('AI Settings POST: enableMedicationSubstitution in saved data:', settings.enableMedicationSubstitution);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}
