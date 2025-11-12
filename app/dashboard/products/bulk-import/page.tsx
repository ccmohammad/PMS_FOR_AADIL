"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, Download, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setValidationErrors([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must contain at least a header row and one data row");
        return;
      }
      
      const headers = lines[0].split(",").map(h => h.trim());
      const requiredColumns = ['name', 'genericName', 'description', 'category', 'manufacturer', 'sku', 'price', 'costPrice', 'requiresPrescription', 'expiryDateRequired'];
      
      // Validate headers
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        setValidationErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
        return;
      }
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(",").map(v => v.trim());
        const entry: any = {};
        headers.forEach((header, i) => {
          entry[header] = values[i] || '';
        });
        entry._rowNumber = index + 2; // For error reporting
        return entry;
      });
      
      // Validate data
      const errors: string[] = [];
      data.forEach((row, index) => {
        if (!row.name) errors.push(`Row ${row._rowNumber}: Product name is required`);
        if (!row.category) errors.push(`Row ${row._rowNumber}: Category is required`);
        if (!row.manufacturer) errors.push(`Row ${row._rowNumber}: Manufacturer is required`);
        if (!row.sku) errors.push(`Row ${row._rowNumber}: SKU is required`);
        if (!row.price || isNaN(Number(row.price))) errors.push(`Row ${row._rowNumber}: Valid price is required`);
        if (!row.costPrice || isNaN(Number(row.costPrice))) errors.push(`Row ${row._rowNumber}: Valid cost price is required`);
        if (row.requiresPrescription && !['true', 'false'].includes(row.requiresPrescription.toLowerCase())) {
          errors.push(`Row ${row._rowNumber}: requiresPrescription must be true or false`);
        }
        if (row.expiryDateRequired && !['true', 'false'].includes(row.expiryDateRequired.toLowerCase())) {
          errors.push(`Row ${row._rowNumber}: expiryDateRequired must be true or false`);
        }
      });
      
      setValidationErrors(errors);
      setPreview(data.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || validationErrors.length > 0) return;

    try {
      setLoading(true);
      setProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/products/bulk-import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) {
          setValidationErrors(data.details);
          toast.error(`Import failed: ${data.error}`);
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } else {
        setImportResult(data);
        toast.success(`🎉 Successfully imported ${data.count} products!`, {
          description: "All products have been added to your catalog and are ready for use.",
          duration: 5000,
        });
        setFile(null);
        setPreview([]);
        setValidationErrors([]);
      }
    } catch (error: any) {
      toast.error(`Failed to import products: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadSampleCSV = () => {
    const headers = "name,genericName,description,category,manufacturer,sku,price,costPrice,requiresPrescription,expiryDateRequired";
    const sampleData = [
      "Paracetamol 500mg,Acetaminophen,Pain relief and fever reducer,Pain Relief,ABC Pharma,PRC500,5.99,4.79,false,true",
      "Amoxicillin 250mg,Amoxicillin,Antibiotic capsules,Antibiotics,XYZ Pharmaceuticals,AMX250,12.99,10.39,true,true",
      "Ibuprofen 400mg,Ibuprofen,Anti-inflammatory pain relief,Pain Relief,MedCorp,IBU400,8.50,6.80,false,true"
    ].join("\n");
    
    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_products.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    setValidationErrors([]);
    setProgress(0);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bulk Import Products</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>How to Import Products</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>1. Download the sample CSV file to see the correct format</p>
                <p>2. Fill in all required fields: name, category, manufacturer, sku, price, costPrice</p>
                <p>3. Use the exact column names as shown in the sample</p>
                <p>4. Upload your CSV file and review the preview before importing</p>
              </AlertDescription>
            </Alert>
            
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>... and {validationErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {importResult && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">🎉 Import Successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <p className="font-medium">Successfully imported <span className="font-bold text-green-800">{importResult.count}</span> products.</p>
                    <p className="text-sm">All products have been added to your catalog and are ready for use.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={downloadSampleCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
            
            <div className="flex-1 min-w-64">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full"
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!file || loading || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {loading ? "Importing..." : "Import Products"}
              </Button>
              
              {(file || importResult) && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  disabled={loading}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Importing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Data Preview</h2>
                <span className="text-sm text-gray-500">
                  Showing first 5 rows of {preview.length} total rows
                </span>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(preview[0]).filter(key => key !== '_rowNumber').map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, index) => (
                        <TableRow key={index} className={validationErrors.some(e => e.includes(`Row ${row._rowNumber}`)) ? 'bg-red-50' : ''}>
                          {Object.entries(row).filter(([key]) => key !== '_rowNumber').map(([key, value]: [string, any], i) => (
                            <TableCell key={i} className="whitespace-nowrap">
                              {value || '<empty>'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <p>Review the data above before importing</p>
                {validationErrors.length === 0 && (
                  <p className="text-green-600 font-medium">✓ Data validation passed</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 