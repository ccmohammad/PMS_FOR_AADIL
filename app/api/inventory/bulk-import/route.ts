import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
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

    // Validate the required columns for inventory import
    const requiredColumns = [
      'product_sku',
      'batch',
      'quantity',
      'expiryDate',
      'location',
      'reorderLevel'
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

    // Process records
    const inventoryItems = [];
    const errors = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Find existing product by SKU
        const product = await Product.findOne({
          sku: record.product_sku
        });

        if (!product) {
          errors.push(`Row ${i + 1}: Product with SKU '${record.product_sku}' not found`);
          continue;
        }

        // Validate expiry date
        const expiryDate = record.expiryDate ? new Date(record.expiryDate) : null;
        if (expiryDate && isNaN(expiryDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid expiry date format`);
          continue;
        }

        // Create inventory item
        inventoryItems.push({
          product: product._id,
          batch: record.batch,
          quantity: parseInt(record.quantity),
          expiryDate: expiryDate,
          location: record.location,
          reorderLevel: parseInt(record.reorderLevel),
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation errors found',
          details: errors,
          validCount: inventoryItems.length
        },
        { status: 400 }
      );
    }

    // Check for duplicate batch numbers before inserting
    const batchChecks = inventoryItems.map(item => ({
      product: item.product,
      batch: item.batch
    }));
    
    const existingBatches = await Inventory.find({
      $or: batchChecks
    });
    
    if (existingBatches.length > 0) {
      // Get product names for better error messages
      const productIds = [...new Set(existingBatches.map(batch => batch.product))];
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map(p => [p._id.toString(), p.name]));
      
      const duplicateBatches = existingBatches.map(batch => {
        const productName = productMap.get(batch.product.toString()) || 'Unknown Product';
        return `${productName} - Batch ${batch.batch}`;
      });
      
      return NextResponse.json(
        { 
          error: 'Duplicate batch numbers found',
          details: [`The following product-batch combinations already exist: ${duplicateBatches.join(', ')}`],
          validCount: 0
        },
        { status: 400 }
      );
    }

    await Inventory.insertMany(inventoryItems);

    return NextResponse.json({
      message: 'Inventory items imported successfully',
      count: inventoryItems.length,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process the import' },
      { status: 500 }
    );
  }
} 