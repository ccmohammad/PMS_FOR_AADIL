'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FaTimes } from 'react-icons/fa';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    };

    const scanner = new Html5QrcodeScanner(
      'barcode-scanner',
      config,
      false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        console.log('Scanned:', decodedText);
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (error) => {
        // Error callback - we'll ignore most errors as they're just "no code found"
        if (error && !error.includes('No QR code found')) {
          console.warn('Scan error:', error);
        }
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
              }
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Position the barcode within the frame to scan
          </p>
          
          {/* Scanner container */}
          <div id="barcode-scanner" className="mx-auto"></div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
              }
              onClose();
            }}
            className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 