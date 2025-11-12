import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { aiServices } from '@/lib/ai-services';
import dbConnect from '@/lib/db';
import AISettings from '@/models/AISettings';
import Inventory from '@/models/Inventory';
import Product from '@/models/Product';

// Function to enhance prescription data with availability and alternatives
async function enhancePrescriptionWithAvailability(prescriptionData: any, settings: any) {
  try {
    console.log('Enhancing prescription with availability data...');
    
    // Get all products for matching
    const allProducts = await Product.find()
      .select('name genericName manufacturer price category requiresPrescription')
      .lean();
    
    // Get all inventory items
    const inventoryItems = await Inventory.find()
      .populate('product', 'name genericName manufacturer price category requiresPrescription')
      .lean();
    
    console.log(`Found ${inventoryItems.length} inventory items:`, 
      inventoryItems.map(inv => ({
        name: inv.product.name,
        genericName: inv.product.genericName,
        quantity: inv.quantity
      }))
    );
    
    console.log(`Processing ${prescriptionData.medications.length} medications:`, 
      prescriptionData.medications.map(med => ({
        name: med.name,
        genericName: med.genericName
      }))
    );
    
    // Enhance each medication with availability and alternatives
    const enhancedMedications = await Promise.all(
      prescriptionData.medications.map(async (medication: any) => {
        console.log(`Processing medication: ${medication.name}`);
        
        // Find exact match in inventory - try multiple matching strategies
        let exactMatch = inventoryItems.find(inv => 
          inv.product.name.toLowerCase() === medication.name.toLowerCase()
        );
        
        // If no exact match, try generic name match
        if (!exactMatch && medication.genericName) {
          exactMatch = inventoryItems.find(inv => 
            inv.product.genericName?.toLowerCase() === medication.genericName.toLowerCase()
          );
        }
        
        // If still no match, try partial name match
        if (!exactMatch) {
          exactMatch = inventoryItems.find(inv => 
            inv.product.name.toLowerCase().includes(medication.name.toLowerCase()) ||
            medication.name.toLowerCase().includes(inv.product.name.toLowerCase())
          );
        }
        
        console.log(`Matching ${medication.name}:`, {
          found: !!exactMatch,
          matchedProduct: exactMatch?.product?.name,
          quantity: exactMatch?.quantity
        });
        
        // Medication substitution disabled to reduce costs
        let alternatives: any[] = [];
        
        return {
          ...medication,
          availability: {
            inStock: !!exactMatch && (exactMatch.quantity > 0),
            quantity: exactMatch?.quantity || 0,
            price: exactMatch?.product?.price || 0,
            inventoryItem: exactMatch ? {
              id: exactMatch._id,
              productId: exactMatch.product._id,
              productName: exactMatch.product.name,
              genericName: exactMatch.product.genericName,
              manufacturer: exactMatch.product.manufacturer,
              category: exactMatch.product.category,
              requiresPrescription: exactMatch.product.requiresPrescription
            } : null
          },
          alternatives: alternatives.slice(0, 3) // Limit to top 3 alternatives
        };
      })
    );
    
    return {
      ...prescriptionData,
      medications: enhancedMedications
    };
  } catch (error) {
    console.error('Error enhancing prescription with availability:', error);
    return prescriptionData; // Return original data if enhancement fails
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Prescription processing API: Starting...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('Prescription processing API: No session found');
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    console.log('Prescription processing API: Session found');

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      console.log('Prescription processing API: No image provided');
      return NextResponse.json(
        { error: 'Prescription image is required' },
        { status: 400 }
      );
    }

    console.log('Prescription processing API: Image received, length:', imageBase64.length);

    await dbConnect();
    console.log('Prescription processing API: Database connected');

    // Get AI settings
    const settings = await AISettings.findOne();
    console.log('Prescription processing API: AI settings found:', !!settings);
    
    if (!settings?.enablePrescriptionProcessing) {
      console.log('Prescription processing API: Feature disabled');
      return NextResponse.json(
        { error: 'Prescription processing is disabled. Please enable it in AI Settings.' },
        { status: 400 }
      );
    }

    if (!settings.openaiApiKey) {
      console.log('Prescription processing API: No API key');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Settings.' },
        { status: 400 }
      );
    }

    // Set the API key for this request
    console.log('Prescription processing API: Setting API key');
    aiServices.setApiKey(settings.openaiApiKey);

    console.log('Prescription processing API: Calling AI service...');
    const prescriptionData = await aiServices.processPrescription(imageBase64);
    
    console.log('Prescription processing API: AI service completed');
    
    // Get inventory and alternatives for each medication
    const enhancedPrescriptionData = await enhancePrescriptionWithAvailability(prescriptionData, settings);
    
    console.log('Prescription processing API: Enhanced with availability data');
    return NextResponse.json({ prescription: enhancedPrescriptionData });
  } catch (error) {
    console.error('Prescription processing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process prescription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
