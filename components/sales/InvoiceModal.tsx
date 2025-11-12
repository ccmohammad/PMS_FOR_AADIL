'use client';

import { FaTimes, FaPrint, FaReceipt } from 'react-icons/fa';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import { ThermalReceiptGenerator } from './ThermalReceiptGenerator';
import { thermalPrinter } from '@/lib/thermal-printer';
import { useState } from 'react';

interface InvoiceModalProps {
  sale: {
    _id: string;
    customer?: {
      name: string;
      phone?: string;
      email?: string;
    };
    items: Array<{
      product: {
        name: string;
        sku: string;
      };
      quantity: number;
      unitPrice: number;
      discount: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    processedBy: {
      name: string;
    };
  };
  onClose: () => void;
}


export default function InvoiceModal({ sale, onClose }: InvoiceModalProps) {
  const { settings, isLoading } = useSettings();
  const [isThermalPrinting, setIsThermalPrinting] = useState(false);

  const handlePrint = () => {
    window.print();
  };


  const handleThermalPrint = async () => {
    setIsThermalPrinting(true);
    try {
      const receiptGenerator = new ThermalReceiptGenerator({
        sale,
        settings: settings!
      });
      const commands = receiptGenerator.generateESCPOSCommands();
      
      const success = await thermalPrinter.printESCPOS(commands, {
        paperWidth: 80,
        autocut: true,
        feedLines: 3
      });

      if (success) {
        console.log('Receipt sent to thermal printer successfully!');
      } else {
        alert('Failed to print receipt. Please check your printer connection.');
      }
    } catch (error) {
      console.error('Thermal printing error:', error);
      alert('Error printing receipt. Please try again.');
    } finally {
      setIsThermalPrinting(false);
    }
  };


  if (isLoading || !settings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:m-0 print:bg-white print:block print:h-auto overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative print:shadow-none print:w-full print:m-0 my-8">
        {/* Print styles */}
        <style type="text/css" media="print">
          {`
            @page {
              size: auto;
              margin: 20mm;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              table {
                width: 100% !important;
                border-collapse: collapse;
              }
              th, td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
              }
            }
          `}
        </style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 print:hidden"
        >
          <FaTimes size={24} />
        </button>

        {/* Invoice content */}
        <div className="p-6 print:p-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-900 font-medium">{settings.business.pharmacyName}</p>
            <p className="text-gray-600">{settings.business.address}</p>
            <p className="text-gray-600">Phone: {settings.business.phone}</p>
            <p className="text-gray-600">Email: {settings.business.email}</p>
          </div>

          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-gray-600 font-medium mb-2">Bill To:</h3>
              <p className="text-gray-900">{sale.customer?.name || 'Walk-in Customer'}</p>
              {sale.customer?.phone && <p className="text-gray-600">{sale.customer.phone}</p>}
              {sale.customer?.email && <p className="text-gray-600">{sale.customer.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-600">Invoice #: {settings.invoice.prefix || ''}{sale._id}</p>
              <p className="text-gray-600">Date: {formatDateTime(sale.createdAt, settings)}</p>
              <p className="text-gray-600">Payment Method: {sale.paymentMethod}</p>
              <p className="text-gray-600">Processed by: {sale.processedBy.name}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto mb-6 print:overflow-visible">
            <table className="w-full print:w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left text-gray-600 print:text-gray-900">Item</th>
                  <th className="py-2 text-right text-gray-600 print:text-gray-900">Qty</th>
                  <th className="py-2 text-right text-gray-600 print:text-gray-900">Unit Price</th>
                  <th className="py-2 text-right text-gray-600 print:text-gray-900">Discount</th>
                  <th className="py-2 text-right text-gray-600 print:text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2">
                      <p className="text-gray-900">{item.product.name}</p>
                      <p className="text-gray-600 text-sm">SKU: {item.product.sku}</p>
                    </td>
                    <td className="py-2 text-right text-gray-900">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-900">
                      {formatCurrency(item.unitPrice, settings)}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {formatCurrency(item.discount, settings)}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {formatCurrency((item.unitPrice - item.discount) * item.quantity, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="py-2 text-right font-bold text-gray-900">Total:</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    {formatCurrency(sale.totalAmount, settings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t">
            <div className="text-center text-gray-600">
              {settings.invoice.footer && (
                <div className="mb-2">{settings.invoice.footer}</div>
              )}
              {settings.invoice.terms && (
                <div className="text-sm">{settings.invoice.terms}</div>
              )}
              {!settings.invoice.footer && !settings.invoice.terms && (
                <>
                  <p>Thank you for your business!</p>
                  <p className="text-sm">For any queries, please contact us at {settings.business.email}</p>
                </>
              )}
            </div>


            {/* Print buttons */}
            <div className="flex justify-center gap-4 mt-6 print:hidden">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <FaPrint /> Print Invoice
              </button>
              <button
                onClick={handleThermalPrint}
                disabled={isThermalPrinting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaReceipt /> {isThermalPrinting ? 'Printing...' : 'Thermal Print'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}