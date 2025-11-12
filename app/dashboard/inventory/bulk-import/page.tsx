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
      const requiredColumns = ['product_sku', 'batch', 'quantity', 'expiryDate', 'location', 'reorderLevel'];
      
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
        if (!row.product_sku) errors.push(`Row ${row._rowNumber}: Product SKU is required`);
        if (!row.batch) errors.push(`Row ${row._rowNumber}: Batch number is required`);
        if (!row.quantity || isNaN(Number(row.quantity))) errors.push(`Row ${row._rowNumber}: Valid quantity is required`);
        if (!row.location) errors.push(`Row ${row._rowNumber}: Location is required`);
        if (!row.reorderLevel || isNaN(Number(row.reorderLevel))) errors.push(`Row ${row._rowNumber}: Valid reorder level is required`);
        if (row.expiryDate && isNaN(Date.parse(row.expiryDate))) errors.push(`Row ${row._rowNumber}: Invalid expiry date format`);
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

      const response = await fetch("/api/inventory/bulk-import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
          toast.error(`Import failed: ${data.error}`);
        } else if (data.error) {
          setValidationErrors([data.error]);
          toast.error(`Import failed: ${data.error}`);
        } else {
          throw new Error("Upload failed");
        }
      } else {
        setImportResult(data);
        toast.success(`🎉 Successfully imported ${data.count} inventory items!`, {
          description: "All inventory batches have been added to your system.",
          duration: 5000,
        });
        setFile(null);
        setPreview([]);
        setValidationErrors([]);
      }
    } catch (error: any) {
      toast.error(`Failed to import inventory: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadSampleCSV = () => {
    const headers = "product_sku,batch,quantity,expiryDate,location,reorderLevel";
    const sampleData = [
      "PRC500,BATCH123,1000,2025-12-31,Warehouse A-1,100",
      "AMX250,BATCH456,500,2024-06-30,Warehouse B-2,50",
      "IBU400,BATCH789,750,2025-03-15,Refrigerator C-3,75"
    ].join("\n");
    
    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_inventory.csv";
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
        <h1 className="text-2xl font-bold">Bulk Import Inventory</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>How to Import Inventory</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>1. Download the sample CSV file to see the correct format</p>
                <p>2. Ensure all products already exist in your product catalog</p>
                <p>3. Use the exact column names: product_sku, batch, quantity, expiryDate, location, reorderLevel</p>
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
                    <p className="font-medium">Successfully imported <span className="font-bold text-green-800">{importResult.count}</span> inventory items.</p>
                    <p className="text-sm">All inventory batches have been added to your system.</p>
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
                {loading ? "Importing..." : "Import Inventory"}
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
                <span>Importing inventory items...</span>
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