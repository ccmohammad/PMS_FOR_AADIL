'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUpload, FaCamera, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaStore, FaDollarSign, FaPills, FaTimes, FaArrowRight } from 'react-icons/fa';

interface PrescriptionData {
  doctorName: string;
  patientName: string;
  prescriptionDate: string;
  medications: Array<{
    name: string;
    genericName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    _confidence?: {
      name: 'high' | 'low';
      dosage: 'high' | 'low';
      frequency: 'high' | 'low';
      duration: 'high' | 'low';
      instructions: 'high' | 'low';
    };
    availability?: {
      inStock: boolean;
      quantity: number;
      price: number;
      inventoryItem: {
        id: string;
        productId: string;
        productName: string;
        genericName?: string;
        manufacturer: string;
        category: string;
        requiresPrescription: boolean;
      } | null;
    };
    identifiedGenericName?: string;
    alternatives?: Array<{
      name: string;
      genericName: string;
      manufacturer: string;
      strength: string;
      form: string;
      costSavings: number;
      effectivenessScore: number;
      availability: 'in-stock' | 'out-of-stock' | 'limited';
      requiresPrescription: boolean;
      safetyNotes: string;
      doctorApprovalRequired: boolean;
      actualQuantity?: number;
      actualPrice?: number;
      inventoryItem?: {
        id: string;
        productId: string;
        productName: string;
        genericName?: string;
        manufacturer: string;
        category: string;
        requiresPrescription: boolean;
      } | null;
    }>;
  }>;
  isValid: boolean;
  confidence: number;
  warnings: string[];
}

interface PrescriptionProcessorProps {
  onPrescriptionProcessed: (data: PrescriptionData) => void;
  onAddToCart: (product: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function PrescriptionProcessor({ onPrescriptionProcessed, onAddToCart, isOpen, onClose }: PrescriptionProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle keyboard events for camera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCapturing) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          capturePhoto();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          stopCamera();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'prescription-photo.jpg', { type: 'image/jpeg' });
            processImage(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setPrescriptionData(null);

    try {
      // Convert image to base64
      const base64 = await convertToBase64(file);
      
      // Store the image for display
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // Send to AI processing
      const response = await fetch('/api/ai/prescription-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptionData(data.prescription);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process prescription');
      }
    } catch (err) {
      console.error('Prescription processing error:', err);
      setError('Error processing prescription image. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUsePrescription = () => {
    if (prescriptionData) {
      let addedCount = 0;
      
      // Add all in-stock medications to cart
      prescriptionData.medications.forEach((med, index) => {
        console.log(`Processing medication ${index + 1}:`, med.name);
        console.log('Availability:', med.availability);
        
        // Add original medication if in stock
        console.log(`Checking ${med.name}:`, {
          inStock: med.availability?.inStock,
          quantity: med.availability?.quantity,
          hasInventoryItem: !!med.availability?.inventoryItem,
          inventoryItem: med.availability?.inventoryItem
        });
        
        if (med.availability?.inStock && med.availability.quantity > 0 && med.availability.inventoryItem) {
          console.log(`✅ Adding original medication: ${med.name}`);
          console.log('Inventory item data:', med.availability.inventoryItem);
          console.log('Product requires batch selection:', med.availability.inventoryItem.expiryDateRequired);
          
          const product = {
            id: med.availability.inventoryItem.productId,
            _id: med.availability.inventoryItem.productId,
            inventoryItemId: med.availability.inventoryItem.id, // Add specific inventory item ID
            name: med.availability.inventoryItem.productName,
            genericName: med.availability.inventoryItem.genericName,
            manufacturer: med.availability.inventoryItem.manufacturer,
            category: med.availability.inventoryItem.category,
            price: med.availability.price,
            requiresPrescription: med.availability.inventoryItem.requiresPrescription,
            expiryDateRequired: med.availability.inventoryItem.expiryDateRequired
          };
          
          console.log('Product data being sent to cart:', product);
          onAddToCart(product);
          addedCount++;
        } else {
          console.log(`❌ Skipping ${med.name} - Reasons:`, {
            inStock: med.availability?.inStock,
            quantity: med.availability?.quantity,
            hasInventoryItem: !!med.availability?.inventoryItem
          });
        }
        
        // Add alternatives if in stock
        if (med.alternatives && med.alternatives.length > 0) {
          console.log(`Found ${med.alternatives.length} alternatives for ${med.name}`);
          med.alternatives.forEach((alt, altIndex) => {
            console.log(`Alternative ${altIndex + 1}:`, alt.name, 'Availability:', alt.availability, 'Quantity:', alt.actualQuantity);
            if (alt.availability === 'in-stock' && alt.actualQuantity && alt.actualQuantity > 0 && alt.inventoryItem) {
              console.log(`Adding alternative: ${alt.name}`);
              console.log('Alternative inventory item data:', alt.inventoryItem);
              
              const product = {
                id: alt.inventoryItem.productId,
                _id: alt.inventoryItem.productId,
                inventoryItemId: alt.inventoryItem.id, // Add specific inventory item ID
                name: alt.inventoryItem.productName,
                genericName: alt.genericName,
                manufacturer: alt.inventoryItem.manufacturer,
                category: alt.inventoryItem.category,
                price: alt.actualPrice || 0,
                requiresPrescription: alt.inventoryItem.requiresPrescription
              };
              
              console.log('Alternative product data being sent to cart:', product);
              onAddToCart(product);
              addedCount++;
            } else {
              console.log(`Skipping alternative ${alt.name} - not in stock or no inventory item`);
            }
          });
        }
      });
      
      if (addedCount > 0) {
        console.log(`Added ${addedCount} items to cart from prescription`);
      } else {
        console.log('No in-stock items found in prescription');
      }
      
      onPrescriptionProcessed(prescriptionData);
      onClose();
    }
  };

  const handleRetake = () => {
    setPrescriptionData(null);
    setError(null);
    setSelectedImage(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleAddToCart = (medication: any, isAlternative = false) => {
    if (isAlternative && medication.inventoryItem) {
      // Add alternative medicine to cart
      const product = {
        id: medication.inventoryItem.productId,
        name: medication.inventoryItem.productName,
        genericName: medication.inventoryItem.genericName,
        manufacturer: medication.inventoryItem.manufacturer,
        price: medication.actualPrice || 0,
        quantity: 1,
        requiresPrescription: medication.inventoryItem.requiresPrescription,
        category: medication.inventoryItem.category
      };
      onAddToCart(product);
    } else if (medication.availability?.inStock && medication.availability?.inventoryItem) {
      // Add original medicine to cart
      const product = {
        id: medication.availability.inventoryItem.productId,
        name: medication.availability.inventoryItem.productName,
        genericName: medication.availability.inventoryItem.genericName,
        manufacturer: medication.availability.inventoryItem.manufacturer,
        price: medication.availability.price || 0,
        quantity: 1,
        requiresPrescription: medication.availability.inventoryItem.requiresPrescription,
        category: medication.availability.inventoryItem.category
      };
      onAddToCart(product);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaCamera className="text-blue-500" />
              AI Prescription Processing
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600">
            Upload or capture a prescription image for AI-powered text extraction and validation
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!prescriptionData && !isProcessing && !error && (
            <div className="space-y-6">
              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                  <p className="text-gray-600 mb-4">Upload a prescription image from your device</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Choose File
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <FaCamera className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Take Photo</h3>
                  <p className="text-gray-600 mb-4">
                    Capture a prescription using your camera
                    <br />
                    <span className="text-sm text-gray-500">
                      (Opens camera directly on mobile devices)
                    </span>
                  </p>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple={false}
                    webkitdirectory="false"
                  />
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Take Photo
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Tips for Best Results:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure good lighting and clear image quality</li>
                  <li>• Position the prescription flat and straight</li>
                  <li>• Avoid shadows and glare on the paper</li>
                  <li>• Make sure all text is clearly visible</li>
                  <li>• "Take Photo" opens camera directly on mobile devices</li>
                  <li>• "Upload Image" allows selecting from gallery/files</li>
                </ul>
              </div>
            </div>
          )}

          {/* Camera Interface */}
          {isCapturing && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-2">
              <div className="bg-white rounded-lg p-2 max-w-6xl w-full h-[90vh] flex flex-col">
                <div className="relative flex-1 min-h-0">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full bg-gray-900 rounded-lg object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute top-4 right-4 flex gap-3">
                    <button
                      onClick={capturePhoto}
                      className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100"
                    >
                      <FaCamera className="text-2xl text-gray-800" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-500 rounded-full p-4 shadow-lg hover:bg-red-600"
                    >
                      <FaTimes className="text-2xl text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-3">
                  <p className="text-center text-gray-700 text-sm font-medium">
                    Position the prescription in the frame and tap the camera button or press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Enter</kbd> or <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Space</kbd> to capture
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-12">
              <FaSpinner className="mx-auto text-4xl text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Prescription</h3>
              <p className="text-gray-600">AI is analyzing the prescription image...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <FaExclamationTriangle className="mx-auto text-4xl text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Processing Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetake}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {prescriptionData && (
            <div className="space-y-6">
              {/* Selected Image Display */}
              {selectedImage && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FaCamera className="text-blue-500" />
                    Selected Prescription Image
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={selectedImage}
                      alt="Prescription"
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-md border border-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* AI Analysis Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {prescriptionData.isValid ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationTriangle className="text-yellow-500" />
                    )}
                    AI Analysis Results
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Confidence:</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${prescriptionData.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(prescriptionData.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Prescription Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                      <p className="text-gray-900">{prescriptionData.doctorName || 'Not detected'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                      <p className="text-gray-900">{prescriptionData.patientName || 'Not detected'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Date</label>
                      <p className="text-gray-900">
                        {prescriptionData.prescriptionDate ? 
                          new Date(prescriptionData.prescriptionDate).toLocaleDateString() : 
                          'Not detected'
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      prescriptionData.isValid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {prescriptionData.isValid ? 'Valid Prescription' : 'Needs Review'}
                    </div>
                  </div>
                </div>

                {/* Medications */}
                {prescriptionData.medications.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">Medications Detected</h4>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Uncertain fields</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {prescriptionData.medications.map((med, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">{med.name}</h5>
                            {/* Availability Status */}
                            <div className="flex items-center gap-2">
                              {med.availability && (
                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                    med.availability.inStock && med.availability.quantity > 0
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    <FaStore className="text-xs" />
                                    {med.availability.inStock && med.availability.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                  </div>
                                  {med.availability.inStock && med.availability.quantity > 0 && (
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Qty: {med.availability.quantity}
                                    </div>
                                  )}
                                </div>
                              )}
                              {med.availability?.inStock && med.availability.quantity > 0 && (
                                <button
                                  onClick={() => handleAddToCart(med)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                                >
                                  <FaArrowRight className="text-xs" />
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">Dosage:</span>
                              <p className={`font-medium ${med._confidence?.dosage === 'low' ? 'text-orange-600' : ''}`}>
                                {med.dosage}
                                {med._confidence?.dosage === 'low' && <span className="text-xs text-orange-500 ml-1">⚠️</span>}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <p className={`font-medium ${med._confidence?.frequency === 'low' ? 'text-orange-600' : ''}`}>
                                {med.frequency}
                                {med._confidence?.frequency === 'low' && <span className="text-xs text-orange-500 ml-1">⚠️</span>}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <p className={`font-medium ${med._confidence?.duration === 'low' ? 'text-orange-600' : ''}`}>
                                {med.duration}
                                {med._confidence?.duration === 'low' && <span className="text-xs text-orange-500 ml-1">⚠️</span>}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Instructions:</span>
                              <p className={`font-medium ${med._confidence?.instructions === 'low' ? 'text-orange-600' : ''}`}>
                                {med.instructions}
                                {med._confidence?.instructions === 'low' && <span className="text-xs text-orange-500 ml-1">⚠️</span>}
                              </p>
                            </div>
                          </div>

                          {/* Generic Name Display */}
                          {(med.genericName || med.identifiedGenericName) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2">
                                <FaPills className="text-green-600 text-sm" />
                                <span className="text-sm font-medium text-green-800">Generic Name:</span>
                                <span className="text-sm text-green-700 font-semibold">{med.genericName || med.identifiedGenericName}</span>
                              </div>
                            </div>
                          )}


                          {/* Generic Alternatives */}
                          {med.alternatives && med.alternatives.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <h6 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FaPills className="text-blue-500" />
                                Generic Alternatives
                              </h6>
                              {med.identifiedGenericName && (
                                <div className="bg-blue-100 border border-blue-200 rounded-lg p-2 mb-3">
                                  <p className="text-sm text-blue-800">
                                    <span className="font-medium">Identified Generic Name:</span> {med.identifiedGenericName}
                                  </p>
                                </div>
                              )}
                              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                  <FaExclamationTriangle className="text-yellow-600 text-sm mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">⚠️ Safety Warning</p>
                                    <p>All generic alternatives require doctor approval before substitution. Please verify with the prescribing physician before dispensing.</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {med.alternatives.map((alt, altIndex) => (
                                  <div key={altIndex} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{alt.name}</p>
                                      <p className="text-sm text-gray-600">{alt.genericName}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs text-gray-500">Effectiveness: {Math.round(alt.effectivenessScore * 100)}%</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          alt.availability === 'in-stock' ? 'bg-green-100 text-green-800' :
                                          alt.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {alt.availability.replace('-', ' ').toUpperCase()}
                                        </span>
                                        {alt.actualQuantity && (
                                          <span className="text-xs text-gray-500">
                                            Qty: {alt.actualQuantity}
                                          </span>
                                        )}
                                      </div>
                                      {alt.inventoryItem && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          <span>Manufacturer: {alt.inventoryItem.manufacturer}</span>
                                          <span className="mx-2">•</span>
                                          <span>Category: {alt.inventoryItem.category}</span>
                                        </div>
                                      )}
                                      {alt.safetyNotes && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                                          <span className="font-medium">⚠️ Safety Note:</span> {alt.safetyNotes}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {alt.actualPrice && (
                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1 mb-1">
                                          <FaDollarSign className="text-xs" />
                                          {alt.actualPrice.toFixed(2)}
                                        </p>
                                      )}
                                      <p className="text-sm font-medium text-green-600 flex items-center gap-1 mb-2">
                                        <FaDollarSign className="text-xs" />
                                        Save {alt.costSavings.toFixed(2)}
                                      </p>
                                      <button
                                        onClick={() => handleAddToCart(alt, true)}
                                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                                          alt.doctorApprovalRequired 
                                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                        title={alt.doctorApprovalRequired ? 'Doctor approval required' : ''}
                                      >
                                        <FaArrowRight className="text-xs" />
                                        {alt.doctorApprovalRequired ? 'Add (Dr. Approval)' : 'Add to Cart'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {prescriptionData.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Warnings</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {prescriptionData.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={handleRetake}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Retake Photo
                </button>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {prescriptionData.medications.filter(med => 
                      (med.availability?.inStock && med.availability.quantity > 0) ||
                      (med.alternatives?.some(alt => alt.availability === 'in-stock' && alt.actualQuantity && alt.actualQuantity > 0))
                    ).length} items will be added to cart
                  </div>
                  <button
                    onClick={handleUsePrescription}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FaCheckCircle className="text-sm" />
                    Add All to Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
