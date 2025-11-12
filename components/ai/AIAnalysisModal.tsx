'use client';

import { FaRobot, FaSpinner, FaChartLine, FaClock } from 'react-icons/fa';

interface AIAnalysisModalProps {
  isOpen: boolean;
  analysisType: 'inventory' | 'expiry';
  onClose: () => void;
}

export default function AIAnalysisModal({ isOpen, analysisType, onClose }: AIAnalysisModalProps) {
  if (!isOpen) return null;

  const getAnalysisInfo = () => {
    if (analysisType === 'inventory') {
      return {
        title: 'AI Inventory Analysis',
        description: 'Analyzing sales patterns and predicting future demand...',
        icon: <FaChartLine className="text-4xl text-blue-500" />,
        steps: [
          'Processing sales data',
          'Analyzing demand patterns',
          'Calculating reorder recommendations',
          'Generating predictions'
        ]
      };
    } else {
      return {
        title: 'AI Expiry Management',
        description: 'Analyzing medication expiry dates and generating recommendations...',
        icon: <FaClock className="text-4xl text-orange-500" />,
        steps: [
          'Scanning inventory expiry dates',
          'Analyzing usage patterns',
          'Generating disposal recommendations',
          'Creating action plans'
        ]
      };
    }
  };

  const analysisInfo = getAnalysisInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-8 text-center">
          {/* Main Loader */}
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-lg">
              <FaSpinner className="text-6xl text-blue-600 animate-spin" />
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {analysisInfo.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {analysisInfo.description}
          </p>

          {/* Analysis Steps */}
          <div className="space-y-3 mb-6">
            {analysisInfo.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-pulse shadow-sm" style={{ width: '70%' }}></div>
          </div>

          {/* Status Text */}
          <p className="text-sm text-gray-500">
            This may take a few moments...
          </p>
        </div>
      </div>
    </div>
  );
}
