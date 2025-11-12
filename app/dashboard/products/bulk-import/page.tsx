"use client";

import { useState } from "react";
import { toast } from "sonner";
import EnhancedBulkImport from "@/components/products/EnhancedBulkImport";

export default function BulkImportPage() {
  const [showModal, setShowModal] = useState(false);

  const handleImportComplete = (result: any) => {
    if (result.success > 0) {
      toast.success(`🎉 Successfully imported ${result.success} products!`, {
        description: "All products have been added to your catalog and are ready for use.",
        duration: 5000,
      });
    }
    
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} products`, {
        description: result.errors?.slice(0, 3).join(', ') || 'Please check the errors and try again.',
        duration: 5000,
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <EnhancedBulkImport 
        onImportComplete={handleImportComplete}
      />
    </div>
  );
} 