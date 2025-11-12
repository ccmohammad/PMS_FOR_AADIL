"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Download
} from "lucide-react";

interface ImportError {
  row: number;
  message: string;
}

interface ImportWarning {
  row: number;
  message: string;
}

interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  warnings: number;
}

interface ImportResultsProps {
  success: boolean;
  message: string;
  summary: ImportSummary;
  errors?: ImportError[];
  warnings?: ImportWarning[];
  onClose: () => void;
}

export function ImportResults({
  success,
  message,
  summary,
  errors = [],
  warnings = [],
  onClose
}: ImportResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const downloadErrorReport = () => {
    const errorData = errors.map(error => ({
      Row: error.row,
      Error: error.message
    }));
    
    const csvContent = [
      "Row,Error",
      ...errorData.map(row => `${row.Row},"${row.Error}"`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_errors.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <h3 className="text-lg font-semibold">{message}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
          <div className="text-sm text-green-600">Successful</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings ({warnings.length})</AlertTitle>
          <AlertDescription>
            {warnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="text-sm">
                Row {warning.row}: {warning.message}
              </div>
            ))}
            {warnings.length > 3 && (
              <div className="text-sm text-gray-500">
                ... and {warnings.length - 3} more warnings
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-red-600">
              Errors ({errors.length})
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Hide" : "Show"} Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadErrorReport}
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>

          {showDetails && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Error Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="destructive">{error.row}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
