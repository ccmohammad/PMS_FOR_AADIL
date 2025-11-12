'use client';

import React from 'react';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DuplicateMedicineInfo() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Can I have medicines with the same name?</strong>
          <br />
          Yes! This is completely normal and necessary in pharmacy management.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Allowed - Same Name
            </CardTitle>
            <CardDescription>
              These scenarios are perfectly fine:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Different Manufacturers:</strong>
              <br />
              • "Paracetamol" by Company A
              <br />
              • "Paracetamol" by Company B
            </div>
            <div className="text-sm">
              <strong>Different Strengths:</strong>
              <br />
              • "Paracetamol 500mg"
              <br />
              • "Paracetamol 1000mg"
            </div>
            <div className="text-sm">
              <strong>Different Forms:</strong>
              <br />
              • "Paracetamol Tablets"
              <br />
              • "Paracetamol Syrup"
            </div>
            <div className="text-sm">
              <strong>Brand vs Generic:</strong>
              <br />
              • "Tylenol" (Brand)
              <br />
              • "Paracetamol" (Generic)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Not Allowed - Same SKU
            </CardTitle>
            <CardDescription>
              These will be rejected:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Duplicate SKUs:</strong>
              <br />
              • Two products with SKU "PAR-001"
              <br />
              • Same product imported twice
            </div>
            <div className="text-sm">
              <strong>What makes each product unique:</strong>
              <br />
              • SKU (Stock Keeping Unit)
              <br />
              • Manufacturer + Name + Strength
              <br />
              • NDC Code (if available)
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Pro Tip:</strong> The system will warn you if similar products exist, 
          but it won't prevent you from importing them. This helps you manage your inventory 
          more effectively by having multiple options for the same medicine.
        </AlertDescription>
      </Alert>
    </div>
  );
}
