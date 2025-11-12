'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { FaBarcode, FaPrint, FaDownload } from 'react-icons/fa';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BarcodeGeneratorProps {
  value: string;
  productName?: string;
  price?: number;
  showLabel?: boolean;
  width?: number;
  height?: number;
  format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39';
}

// Helper function to escape HTML
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export function BarcodeGenerator({
  value,
  productName,
  price,
  showLabel = true,
  width = 2,
  height = 100,
  format = 'CODE128'
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const { settings } = useSettings();
  const [printQuantity, setPrintQuantity] = useState(1);
  const [printLayout, setPrintLayout] = useState<'custom' | 'a4-4' | 'a4-8' | 'a4-16' | 'a4-32'>('a4-32');
  const [printerType, setPrinterType] = useState<'laser' | 'barcode'>('laser');
  const [barcodeSize, setBarcodeSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const barcodeSizes = {
    'small': { width: 1.5, height: 60, fontSize: 10, label: 'Small (30mm)' },
    'medium': { width: 2, height: 80, fontSize: 12, label: 'Medium (40mm)' },
    'large': { width: 2.5, height: 100, fontSize: 14, label: 'Large (50mm)' },
    'extra-large': { width: 3, height: 120, fontSize: 16, label: 'Extra Large (60mm)' }
  };

  useEffect(() => {
    if (!value) return;

    try {
      if (canvasRef.current) {
        const size = barcodeSizes[barcodeSize];
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: size.width,
          height: size.height,
          displayValue: showLabel,
          fontSize: size.fontSize,
          margin: 10,
        });
        setError('');
      }
    } catch (err) {
      setError('Invalid barcode format');
      console.error('Barcode generation error:', err);
    }
  }, [value, format, showLabel, barcodeSize]);

  const downloadBarcode = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    const priceDisplay = price !== undefined ? (settings ? formatCurrency(price, settings) : `$${price.toFixed(2)}`) : '';
    const layoutConfig = getLayoutConfig();
    
    // Determine quantity based on layout
    let finalQuantity = printQuantity;
    if (printLayout.startsWith('a4-')) {
      finalQuantity = parseInt(printLayout.split('-')[1]);
    }
    
    // Create a temporary container for PDF generation
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm';
    tempContainer.style.background = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.padding = layoutConfig.pageMargin;
    
    // Apply layout styles
    if (printerType === 'laser') {
      tempContainer.innerHTML = `
        <div style="
          display: grid;
          grid-template-columns: repeat(${layoutConfig.columns}, 1fr);
          gap: ${layoutConfig.gap};
          width: 100%;
        ">
          ${Array.from({ length: finalQuantity }, (_, i) => `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              text-align: center;
              width: ${layoutConfig.labelWidth};
              height: ${layoutConfig.labelHeight};
              border: 1px solid #ddd;
              padding: ${printLayout === 'a4-32' ? '1mm' : printLayout === 'a4-16' ? '2mm' : '3mm'};
              box-sizing: border-box;
              background: white;
            ">
              ${showProductName && productName ? `<div style="font-size: ${printLayout === 'a4-32' ? '6px' : printLayout === 'a4-16' ? '8px' : '10px'}; font-weight: bold; margin-bottom: ${printLayout === 'a4-32' ? '1mm' : '1.5mm'}; line-height: 1.2; height: ${printLayout === 'a4-32' ? '6mm' : printLayout === 'a4-16' ? '8mm' : '12mm'}; overflow: visible; word-wrap: break-word; display: flex; align-items: center; justify-content: center;">${escapeHtml(productName)}</div>` : ''}
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; max-width: 100%; min-height: ${printLayout === 'a4-32' ? '12mm' : printLayout === 'a4-16' ? '20mm' : '30mm'};">
                <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              </div>
              ${showPrice && price !== undefined ? `<div style="font-size: ${printLayout === 'a4-32' ? '6px' : printLayout === 'a4-16' ? '8px' : '10px'}; font-weight: bold; margin-top: ${printLayout === 'a4-32' ? '1mm' : '1.5mm'}; height: ${printLayout === 'a4-32' ? '4mm' : '6mm'}; display: flex; align-items: center; justify-content: center;">${escapeHtml(priceDisplay)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      tempContainer.style.width = '60mm';
      tempContainer.innerHTML = `
        ${Array.from({ length: finalQuantity }, (_, i) => `
          <div style="
            display: block;
            text-align: center;
            width: 60mm;
            margin-bottom: 5mm;
            padding: 2mm;
            border: 1px dashed #ccc;
            background: white;
          ">
            ${showProductName && productName ? `<div style="font-size: 8px; font-weight: bold; margin-bottom: 2mm; line-height: 1.1;">${escapeHtml(productName)}</div>` : ''}
            <img src="${dataUrl}" style="width: 100%; height: auto;" />
            ${showPrice && price !== undefined ? `<div style="font-size: 10px; font-weight: bold; margin-top: 2mm;">${escapeHtml(priceDisplay)}</div>` : ''}
          </div>
        `).join('')}
      `;
    }
    
    document.body.appendChild(tempContainer);
    
    // Generate PDF
    html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then(canvasElement => {
      const imgData = canvasElement.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: printerType === 'laser' ? 'portrait' : 'portrait',
        unit: 'mm',
        format: printerType === 'laser' ? 'a4' : [60, finalQuantity * 30] // Dynamic height for barcode printer
      });
      
      const imgWidth = printerType === 'laser' ? 190 : 56; // A4 width minus margins or barcode printer width
      const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Download PDF
      const fileName = `barcode-labels-${value}-${printLayout === 'custom' ? `${printQuantity}labels` : printLayout}.pdf`;
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(tempContainer);
    }).catch(error => {
      console.error('Error generating PDF:', error);
      document.body.removeChild(tempContainer);
      
      // Fallback to original image download
      const fallbackUrl = canvas.toDataURL('image/png');
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fallbackUrl;
      fallbackLink.download = `barcode-${value}.png`;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    });
  };

  const getLayoutConfig = () => {
    const layouts = {
      'custom': { 
        columns: Math.ceil(Math.sqrt(printQuantity)), 
        labelWidth: '200px', 
        labelHeight: '120px',
        pageMargin: '10mm',
        gap: '5mm'
      },
      'a4-4': { 
        columns: 2, 
        labelWidth: '85mm', 
        labelHeight: '120mm',
        pageMargin: '10mm',
        gap: '5mm'
      },
      'a4-8': { 
        columns: 2, 
        labelWidth: '85mm', 
        labelHeight: '55mm',
        pageMargin: '10mm',
        gap: '3mm'
      },
      'a4-16': { 
        columns: 4, 
        labelWidth: '42mm', 
        labelHeight: '55mm',
        pageMargin: '5mm',
        gap: '2mm'
      },
      'a4-32': { 
        columns: 4, 
        labelWidth: '42mm', 
        labelHeight: '25mm',
        pageMargin: '3mm',
        gap: '2mm'
      }
    };
    return layouts[printLayout];
  };

  const printBarcode = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    const priceDisplay = price !== undefined ? (settings ? formatCurrency(price, settings) : `$${price.toFixed(2)}`) : '';
    const layoutConfig = getLayoutConfig();
    
    // Determine quantity based on layout
    let finalQuantity = printQuantity;
    if (printLayout.startsWith('a4-')) {
      finalQuantity = parseInt(printLayout.split('-')[1]);
    }
    
    // Generate barcode HTML
    let barcodeHTML = '';
    
    for (let i = 0; i < finalQuantity; i++) {
      barcodeHTML += `
        <div class="barcode-label">
          ${showProductName && productName ? `<div class="product-name">${escapeHtml(productName)}</div>` : ''}
          <div class="barcode-image-container">
            <img src="${dataUrl}" class="barcode-image" />
          </div>
          ${showPrice && price !== undefined ? `<div class="price">${escapeHtml(priceDisplay)}</div>` : ''}
        </div>
      `;
    }

    // Different styles for different printer types
    const laserPrinterStyles = `
      body { 
        margin: 0; 
        padding: ${layoutConfig.pageMargin}; 
        font-family: Arial, sans-serif;
        background: white;
      }
      .barcode-container {
        display: grid;
        grid-template-columns: repeat(${layoutConfig.columns}, 1fr);
        gap: ${layoutConfig.gap};
        width: 100%;
      }
      .barcode-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        text-align: center;
        width: ${layoutConfig.labelWidth};
        height: ${layoutConfig.labelHeight};
        border: 1px solid #ddd;
        padding: ${printLayout === 'a4-32' ? '1mm' : printLayout === 'a4-16' ? '2mm' : '3mm'};
        box-sizing: border-box;
        page-break-inside: avoid;
        background: white;
      }
      .product-name {
        font-size: ${printLayout === 'a4-32' ? '6px' : printLayout === 'a4-16' ? '8px' : '10px'};
        font-weight: bold;
        margin-bottom: ${printLayout === 'a4-32' ? '1mm' : '1.5mm'};
        line-height: 1.2;
        height: ${printLayout === 'a4-32' ? '6mm' : printLayout === 'a4-16' ? '8mm' : '12mm'};
        overflow: visible;
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .barcode-image-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        min-height: ${printLayout === 'a4-32' ? '12mm' : printLayout === 'a4-16' ? '20mm' : '30mm'};
      }
      .barcode-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .price {
        font-size: ${printLayout === 'a4-32' ? '6px' : printLayout === 'a4-16' ? '8px' : '10px'};
        font-weight: bold;
        margin-top: ${printLayout === 'a4-32' ? '1mm' : '1.5mm'};
        height: ${printLayout === 'a4-32' ? '4mm' : '6mm'};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media print {
        body { margin: 0; padding: ${layoutConfig.pageMargin}; }
        .barcode-label { border: 1px solid #999; }
      }
    `;

    const barcodePrinterStyles = `
      body { 
        margin: 0; 
        padding: 2mm; 
        font-family: Arial, sans-serif;
        background: white;
      }
      .barcode-container {
        display: block;
      }
      .barcode-label {
        display: block;
        text-align: center;
        width: 60mm;
        margin-bottom: 5mm;
        padding: 2mm;
        border: 1px dashed #ccc;
        page-break-after: always;
        background: white;
      }
      .product-name {
        font-size: 8px;
        font-weight: bold;
        margin-bottom: 2mm;
        line-height: 1.1;
      }
      .barcode-image {
        width: 100%;
        height: auto;
      }
      .price {
        font-size: 10px;
        font-weight: bold;
        margin-top: 2mm;
      }
      @media print {
        body { margin: 0; padding: 0; }
        .barcode-label { 
          border: none; 
          page-break-after: always;
          margin: 0;
          padding: 1mm;
        }
      }
    `;
    
    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Labels</title>
          <style>
            ${printerType === 'laser' ? laserPrinterStyles : barcodePrinterStyles}
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${barcodeHTML}
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(windowContent);
      printWindow.document.close();
    }
  };

  if (!value) {
    return (
      <div className="text-center text-gray-500 py-4">
        <FaBarcode className="text-4xl mx-auto mb-2 opacity-50" />
        <p className="text-sm">No barcode value provided</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="text-center mb-4">
        {showProductName && productName && (
          <h4 className="font-medium text-gray-900 mb-2">{productName}</h4>
        )}
        
        <canvas ref={canvasRef} className="mx-auto" />
        
        {showPrice && price !== undefined && (
          <p className="text-lg font-bold text-gray-900 mt-2">
            {settings ? formatCurrency(price, settings) : `$${price.toFixed(2)}`}
          </p>
        )}
      </div>

      {/* Print Configuration */}
      <div className="space-y-4 border-t pt-4">
        <h5 className="text-sm font-medium text-gray-900">Print Configuration</h5>
        
        {/* Barcode Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Size</label>
          <select
            value={barcodeSize}
            onChange={(e) => setBarcodeSize(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(barcodeSizes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* Printer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Printer Type</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="laser"
                checked={printerType === 'laser'}
                onChange={(e) => setPrinterType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm">Laser/Inkjet Printer</span>
            </label>
            <label className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="barcode"
                checked={printerType === 'barcode'}
                onChange={(e) => setPrinterType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm">Barcode Printer</span>
            </label>
          </div>
        </div>

        {/* Layout Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout Options</label>
          <select
            value={printLayout}
            onChange={(e) => setPrintLayout(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="custom">Custom Quantity</option>
            <option value="a4-4">A4 - 4 Labels per Page</option>
            <option value="a4-8">A4 - 8 Labels per Page</option>
            <option value="a4-16">A4 - 16 Labels per Page</option>
            <option value="a4-32">A4 - 32 Labels per Page</option>
          </select>
        </div>

        {/* Custom Quantity - only show when layout is custom */}
        {printLayout === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Print Quantity</label>
            <select
              value={printQuantity}
              onChange={(e) => setPrintQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30].map(num => (
                <option key={num} value={num}>{num} labels</option>
              ))}
            </select>
          </div>
        )}

        {/* Show/Hide Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Label Content</label>
          <div className="space-y-2">
            <label className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showProductName}
                onChange={(e) => setShowProductName(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Show Product Name</span>
            </label>
            <label className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm">Show Price</span>
            </label>
          </div>
        </div>

        {/* Print Buttons */}
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={printBarcode}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <FaPrint />
            {printLayout === 'custom' 
              ? (printQuantity > 1 ? `Print ${printQuantity} Labels` : 'Print Label')
              : `Print ${printLayout.toUpperCase()}`
            }
          </button>
          <button
            onClick={downloadBarcode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
          >
            <FaDownload />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}