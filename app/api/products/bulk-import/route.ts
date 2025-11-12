import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { parse } from 'csv-parse/sync';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Validate the required columns for product import
    const requiredColumns = [
      'name',
      'genericName',
      'description',
      'category',
      'manufacturer',
      'sku',
      'price',
      'costPrice',
      'requiresPrescription',
      'expiryDateRequired'
    ];

    const hasAllColumns = requiredColumns.every((column) =>
      Object.keys(records[0]).includes(column)
    );

    if (!hasAllColumns) {
      return NextResponse.json(
        { error: 'Invalid CSV format. Missing required columns.' },
        { status: 400 }
      );
    }

    // Process and validate records
    const products = [];
    const errors = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields
        if (!record.name) throw new Error(`Row ${i + 2}: Product name is required`);
        if (!record.category) throw new Error(`Row ${i + 2}: Category is required`);
        if (!record.manufacturer) throw new Error(`Row ${i + 2}: Manufacturer is required`);
        if (!record.sku) throw new Error(`Row ${i + 2}: SKU is required`);
        if (!record.price || isNaN(Number(record.price))) throw new Error(`Row ${i + 2}: Valid price is required`);
        if (!record.costPrice || isNaN(Number(record.costPrice))) throw new Error(`Row ${i + 2}: Valid cost price is required`);
        
        // Parse boolean values
        const requiresPrescription = record.requiresPrescription?.toLowerCase() === 'true';
        const expiryDateRequired = record.expiryDateRequired?.toLowerCase() === 'true';
        
        products.push({
          name: record.name.trim(),
          genericName: record.genericName?.trim() || '',
          description: record.description?.trim() || '',
          category: record.category.trim(),
          manufacturer: record.manufacturer.trim(),
          price: parseFloat(record.price),
          costPrice: parseFloat(record.costPrice),
          sku: record.sku.trim(),
          requiresPrescription,
          expiryDateRequired,
        });
      } catch (error: any) {
        errors.push(error.message);
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation errors found',
          details: errors,
          validCount: products.length
        },
        { status: 400 }
      );
    }

    // Check for duplicate SKUs
    const skus = products.map(p => p.sku);
    const existingProducts = await Product.find({ sku: { $in: skus } });
    
    if (existingProducts.length > 0) {
      const duplicateSkus = existingProducts.map(p => p.sku);
      return NextResponse.json(
        { 
          error: 'Duplicate SKUs found',
          details: [`Products with SKUs already exist: ${duplicateSkus.join(', ')}`],
          validCount: 0
        },
        { status: 409 }
      );
    }

    await Product.insertMany(products);

    return NextResponse.json({
      message: 'Products imported successfully',
      count: products.length,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process the import' },
      { status: 500 }
    );
  }
} 