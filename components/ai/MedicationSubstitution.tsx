'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaDollarSign, FaPills, FaUserMd } from 'react-icons/fa';

interface GenericAlternative {
  name: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  form: string;
  costSavings: number;
  effectivenessScore: number;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  requiresPrescription: boolean;
}

interface MedicationSubstitution {
  originalMedication: string;
  genericAlternatives: GenericAlternative[];
  totalCostSavings: number;
  substitutionReason: string;
  doctorApprovalRequired: boolean;
  confidence: number;
}

interface CartItem {
  inventory: {
    product: {
      _id: string;
      name: string;
      genericName?: string;
      manufacturer: string;
      price: number;
      category: string;
      requiresPrescription: boolean;
    };
    quantity: number;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface MedicationSubstitutionProps {
  onSubstitutionSelect?: (substitution: GenericAlternative) => void;
  isOpen?: boolean;
  onClose?: () => void;
  cartItems?: CartItem[];
}

export default function MedicationSubstitution({ onSubstitutionSelect, isOpen = false, onClose, cartItems = [] }: MedicationSubstitutionProps) {
  const [medicationName, setMedicationName] = useState('');
  const [substitutions, setSubstitutions] = useState<MedicationSubstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartSubstitutions, setCartSubstitutions] = useState<MedicationSubstitution[]>([]);
  const [showCartAlternatives, setShowCartAlternatives] = useState(true);

  // Find alternatives for cart items when modal opens
  const findCartAlternatives = async () => {
    if (cartItems.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      
      const cartMedications = cartItems.map(item => item.inventory.product.name);
      const substitutions: MedicationSubstitution[] = [];

      // Find alternatives for each cart medication
      for (const medication of cartMedications) {
        try {
          const response = await fetch('/api/ai/medication-substitution', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ medicationName: medication }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.substitutions && data.substitutions.length > 0) {
              substitutions.push(...data.substitutions);
            }
          }
        } catch (err) {
          console.error(`Error finding alternatives for ${medication}:`, err);
        }
      }

      setCartSubstitutions(substitutions);
    } catch (err) {
      console.error('Cart alternatives search error:', err);
      setError('Failed to find alternatives for cart items');
    } finally {
      setLoading(false);
    }
  };

  // Auto-find alternatives when modal opens and cart has items
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      findCartAlternatives();
    }
  }, [isOpen, cartItems]);

  const handleSearch = async () => {
    if (!medicationName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/medication-substitution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicationName: medicationName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find substitutions');
      }

      const data = await response.json();
      setSubstitutions(data.substitutions || []);
    } catch (err) {
      console.error('Substitution search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to find substitutions');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in-stock': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'out-of-stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'in-stock': return <FaCheckCircle className="text-green-500" />;
      case 'limited': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'out-of-stock': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaExclamationTriangle className="text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaPills className="text-blue-500" />
              AI Medication Substitution
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setShowCartAlternatives(true)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showCartAlternatives
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cart Alternatives ({cartItems.length})
            </button>
            <button
              onClick={() => setShowCartAlternatives(false)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showCartAlternatives
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Search
            </button>
          </div>

          {/* Manual Search Section */}
          {!showCartAlternatives && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter medication name to find generic alternatives..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !medicationName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                  {loading ? 'Searching...' : 'Find Substitutes'}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Find cost-effective generic alternatives for medications. Save money while maintaining effectiveness.
              </p>
            </div>
          )}

          {/* Cart Alternatives Section */}
          {showCartAlternatives && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Alternatives for Cart Items
                </h3>
                <button
                  onClick={findCartAlternatives}
                  disabled={loading || cartItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                  {loading ? 'Searching...' : 'Refresh Alternatives'}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Showing generic alternatives for {cartItems.length} medication(s) in your cart. Click to replace with cost-effective alternatives.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <FaExclamationTriangle />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Show cart alternatives or manual search results */}
          {(showCartAlternatives ? cartSubstitutions : substitutions).length > 0 && (
            <div className="space-y-6">
              {(showCartAlternatives ? cartSubstitutions : substitutions).map((substitution, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {substitution.originalMedication}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {substitution.substitutionReason}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${substitution.totalCostSavings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total Savings</div>
                    </div>
                  </div>

                  {substitution.doctorApprovalRequired && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <FaUserMd />
                        <span className="font-medium">Doctor Approval Required</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        This substitution requires doctor approval before dispensing.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {substitution.genericAlternatives.map((alternative, altIndex) => (
                      <div
                        key={altIndex}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onSubstitutionSelect?.(alternative)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {alternative.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {alternative.genericName}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              {getAvailabilityIcon(alternative.availability)}
                              <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(alternative.availability)}`}>
                                {alternative.availability.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Manufacturer:</span>
                            <span className="font-medium">{alternative.manufacturer}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Strength:</span>
                            <span className="font-medium">{alternative.strength}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Form:</span>
                            <span className="font-medium">{alternative.form}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Effectiveness:</span>
                            <span className="font-medium">
                              {Math.round(alternative.effectivenessScore * 100)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cost Savings:</span>
                            <span className="font-medium text-green-600 flex items-center gap-1">
                              <FaDollarSign />
                              {alternative.costSavings.toFixed(2)}
                            </span>
                          </div>
                          {alternative.requiresPrescription && (
                            <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                              Requires Prescription
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubstitutionSelect?.(alternative);
                          }}
                          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Select This Alternative
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(showCartAlternatives ? cartSubstitutions : substitutions).length === 0 && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              <FaPills className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>
                {showCartAlternatives 
                  ? 'No generic alternatives found for cart items' 
                  : 'No generic alternatives found'
                }
              </p>
              <p className="text-sm">
                {showCartAlternatives 
                  ? 'Try refreshing or check if medications have generic alternatives' 
                  : 'Try searching for a different medication name'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
