'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Database, CheckCircle, AlertCircle, Loader2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MedicineDatabaseSearch from '@/components/medicine/MedicineDatabaseSearch';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

interface MedicineData {
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  sku: string;
  price: number;
  costPrice: number;
  requiresPrescription: boolean;
  expiryDateRequired: boolean;
  description?: string;
  strength?: string;
  dosageForm?: string;
  ndc?: string;
  activeIngredients?: string[];
}

interface EnhancedBulkImportProps {
  onImportComplete?: (result: ImportResult) => void;
  onClose?: () => void;
}

export default function EnhancedBulkImport({ onImportComplete, onClose }: EnhancedBulkImportProps) {
  const [activeTab, setActiveTab] = useState('database');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDatabaseImport = async () => {
    if (selectedMedicines.length === 0) {
      alert('Please select at least one medicine from the database');
      return;
    }

    // Check if all medicines have prices set
    const medicinesWithoutPrices = selectedMedicines.filter(med => !med.price || med.price <= 0);
    if (medicinesWithoutPrices.length > 0) {
      alert(`Please set prices for all medicines. ${medicinesWithoutPrices.length} medicine(s) still need pricing.`);
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const productsToImport = selectedMedicines.map(medicine => {
        // Ensure all required fields have valid values
        const name = medicine.name?.trim() || 'Unknown Medicine';
        const category = medicine.category?.trim() || 'General';
        const manufacturer = medicine.manufacturer?.trim() || 'Unknown Manufacturer';
        const sku = medicine.sku?.trim() || generateSKU(name, manufacturer, medicine.strength);
        
        // Validate required fields
        if (!name || name === 'Unknown Medicine') {
          throw new Error(`Medicine name is required for: ${medicine.name || 'Unknown'}`);
        }
        if (!category || category === 'General') {
          throw new Error(`Category is required for: ${name}`);
        }
        if (!manufacturer || manufacturer === 'Unknown Manufacturer') {
          throw new Error(`Manufacturer is required for: ${name}`);
        }
        
        return {
          name,
          genericName: medicine.genericName?.trim() || '',
          description: medicine.description?.trim() || '',
          category,
          manufacturer,
          sku,
          price: Number(medicine.price) || 0,
          costPrice: Number(medicine.costPrice) || 0,
          requiresPrescription: Boolean(medicine.requiresPrescription),
          expiryDateRequired: medicine.expiryDateRequired !== false,
          strength: medicine.strength?.trim() || '',
          dosageForm: medicine.dosageForm?.trim() || '',
          ndc: medicine.ndc?.trim() || '',
          activeIngredients: Array.isArray(medicine.activeIngredients) ? medicine.activeIngredients : []
        };
      });

      console.log('Importing products:', productsToImport);

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsToImport
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Import error details:', errorData);
        const errorMessage = errorData.details ? 
          `Import failed: ${errorData.error || response.statusText}\nDetails: ${errorData.details.join('\n')}` :
          `Import failed: ${response.status} - ${errorData.error || response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
      
      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: 0,
        failed: selectedMedicines.length,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const handleFileImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('File import failed');
      }

      const data = await response.json();
      setResult(data);
      
      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (error) {
      console.error('File import error:', error);
      setResult({
        success: 0,
        failed: 1,
        errors: [`File import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const generateSKU = (name: string, manufacturer?: string, strength?: string): string => {
    const namePrefix = name.substring(0, 3).toUpperCase();
    const manufacturerPrefix = manufacturer ? manufacturer.substring(0, 2).toUpperCase() : '';
    const strengthSuffix = strength ? strength.replace(/[^0-9]/g, '').substring(0, 3) : '';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${namePrefix}${manufacturerPrefix}${strengthSuffix}-${random}`;
  };

  const handleMedicineSelect = (medicine: any) => {
    console.log('Selected medicine data:', medicine);
    
    const medicineData: MedicineData = {
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      sku: generateSKU(medicine.name, medicine.manufacturer, medicine.strength),
      price: 0, // Will be set by user
      costPrice: 0, // Will be set by user
      requiresPrescription: medicine.requiresPrescription,
      expiryDateRequired: true,
      description: medicine.description,
      strength: medicine.strength,
      dosageForm: medicine.dosageForm,
      ndc: medicine.ndc,
      activeIngredients: medicine.activeIngredients
    };

    console.log('Processed medicine data:', medicineData);
    setSelectedMedicines(prev => [...prev, medicineData]);
  };

  const removeSelectedMedicine = (index: number) => {
    setSelectedMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicineData = (index: number, field: keyof MedicineData, value: any) => {
    setSelectedMedicines(prev => 
      prev.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const downloadTemplate = () => {
    const template = [
      ['name', 'genericName', 'description', 'category', 'manufacturer', 'sku', 'price', 'costPrice', 'requiresPrescription', 'expiryDateRequired'],
      ['Paracetamol 500mg', 'Acetaminophen', 'Pain relief medication', 'Pain Relief', 'Generic Pharma', 'PAR-001', '10.00', '7.50', 'false', 'true'],
      ['Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic medication', 'Antibiotics', 'MedCorp', 'AMO-002', '15.00', '12.00', 'true', 'true']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Bulk Import</h2>
          <p className="text-gray-600">Import products from database or CSV file</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database">Medicine Database</TabsTrigger>
          <TabsTrigger value="file">CSV File</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Search Medicine Database
              </CardTitle>
              <CardDescription>
                Search and select medicines from our comprehensive database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedicineDatabaseSearch
                onMedicineSelect={handleMedicineSelect}
                showAddButton={false}
              />
            </CardContent>
          </Card>

          {selectedMedicines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Medicines ({selectedMedicines.length})</CardTitle>
                <CardDescription>
                  Review and edit the selected medicines before importing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMedicines.map((medicine, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{medicine.name}</h4>
                        {medicine.genericName && (
                          <p className="text-sm text-gray-600">Generic: {medicine.genericName}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSelectedMedicine(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={medicine.price}
                          onChange={(e) => updateMedicineData(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cost Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={medicine.costPrice}
                          onChange={(e) => updateMedicineData(index, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant={medicine.requiresPrescription ? 'destructive' : 'secondary'}>
                        {medicine.requiresPrescription ? 'Prescription Required' : 'OTC'}
                      </Badge>
                      <Badge variant="outline">{medicine.category}</Badge>
                      {medicine.strength && <Badge variant="outline">{medicine.strength}</Badge>}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDatabaseImport}
                    disabled={importing || selectedMedicines.length === 0}
                    className="flex-1"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Import {selectedMedicines.length} Medicines
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="file" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                CSV File Import
              </CardTitle>
              <CardDescription>
                Upload a CSV file with product data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload CSV File</p>
                  <p className="text-gray-600">Drag and drop your file here, or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="flex-1">{file.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  onClick={handleFileImport}
                  disabled={!file || importing}
                  className="flex-1"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Import File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-green-800">Successfully Imported</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Similar Products Found:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-blue-600 mt-2">
                      💡 This is normal! You can have multiple products with the same name from different manufacturers or with different strengths.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
