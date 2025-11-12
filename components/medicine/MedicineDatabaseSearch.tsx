'use client';

import React, { useState, useEffect } from 'react';
import { Search, Database, Pill, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DrugInfo {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosageForm: string;
  strength: string;
  ndc: string;
  requiresPrescription: boolean;
  description?: string;
  activeIngredients: string[];
  warnings?: string[];
  interactions?: string[];
}

interface MedicineDatabaseSearchProps {
  onMedicineSelect?: (medicine: DrugInfo) => void;
  onAddToInventory?: (medicine: DrugInfo) => void;
  showAddButton?: boolean;
  className?: string;
}

export default function MedicineDatabaseSearch({
  onMedicineSelect,
  onAddToInventory,
  showAddButton = true,
  className = ''
}: MedicineDatabaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugInfo[]>([]);
  const [popularMedicines, setPopularMedicines] = useState<DrugInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('search');
  const [totalMedicines, setTotalMedicines] = useState<number>(0);
  const [databaseStats, setDatabaseStats] = useState<{local: number, openfda: boolean}>({local: 0, openfda: false});

  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Medicines' },
    { value: 'antibiotics', label: 'Antibiotics' },
    { value: 'pain-relief', label: 'Pain Relief' },
    { value: 'cardiovascular', label: 'Cardiovascular' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'respiratory', label: 'Respiratory' }
  ]);

  // Load database statistics and categories on component mount
  useEffect(() => {
    loadDatabaseStats();
    loadCategories();
    loadPopularMedicines();
  }, []);

  // Load popular medicines when category changes
  useEffect(() => {
    loadPopularMedicines();
  }, [selectedCategory]);

  const loadDatabaseStats = async () => {
    try {
      const [countResponse, cacheResponse] = await Promise.all([
        fetch('/api/medicine-database?action=count'),
        fetch('/api/medicine-database?action=cache-stats')
      ]);
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setTotalMedicines(countData.count || 0);
        setDatabaseStats(prev => ({ ...prev, local: countData.count || 0 }));
      }
      
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        setDatabaseStats(prev => ({ ...prev, openfda: cacheData.cache.size > 0 }));
      }
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/medicine-database?action=categories');
      if (response.ok) {
        const data = await response.json();
        const categoryOptions = [
          { value: 'all', label: 'All Medicines' },
          ...data.categories.map((cat: string) => ({
            value: cat.toLowerCase().replace(/\s+/g, '-'),
            label: cat
          }))
        ];
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPopularMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/medicine-database?action=popular&category=${selectedCategory}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load popular medicines');
      }

      const data = await response.json();
      setPopularMedicines(data.medicines || []);
    } catch (err) {
      console.error('Error loading popular medicines:', err);
      setError('Failed to load popular medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/medicine-database?action=search&query=${encodeURIComponent(searchQuery)}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.medicines || []);
      setActiveTab('search');
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMedicineSelect = (medicine: DrugInfo) => {
    if (onMedicineSelect) {
      onMedicineSelect(medicine);
    }
  };

  const handleAddToInventory = async (medicine: DrugInfo) => {
    if (onAddToInventory) {
      onAddToInventory(medicine);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'prescription': return 'bg-red-100 text-red-800';
      case 'over-the-counter': return 'bg-green-100 text-green-800';
      case 'dietary supplement': return 'bg-blue-100 text-blue-800';
      case 'homeopathic': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrescriptionBadge = (requiresPrescription: boolean) => {
    return requiresPrescription ? (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        Prescription Required
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        OTC
      </Badge>
    );
  };

  const renderMedicineCard = (medicine: DrugInfo, showAddButton: boolean = true) => (
    <Card key={`${medicine.name}-${medicine.ndc}`} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              {medicine.name}
            </CardTitle>
            {medicine.genericName && (
              <CardDescription className="mt-1">
                Generic: {medicine.genericName}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getPrescriptionBadge(medicine.requiresPrescription)}
            <Badge className={getCategoryColor(medicine.category)}>
              {medicine.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Manufacturer:</span>
            <span>{medicine.manufacturer}</span>
          </div>
          
          {medicine.strength && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Strength:</span>
              <span>{medicine.strength}</span>
            </div>
          )}
          
          {medicine.dosageForm && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Form:</span>
              <span>{medicine.dosageForm}</span>
            </div>
          )}
          
          {medicine.ndc && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">NDC:</span>
              <span className="font-mono text-xs">{medicine.ndc}</span>
            </div>
          )}

          {medicine.activeIngredients.length > 0 && (
            <div>
              <span className="font-medium text-sm">Active Ingredients:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {medicine.activeIngredients.slice(0, 3).map((ingredient, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
                {medicine.activeIngredients.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{medicine.activeIngredients.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {medicine.description && (
            <div className="text-sm text-gray-600 mt-2">
              <p className="line-clamp-2">{medicine.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMedicineSelect(medicine)}
            className="flex-1"
          >
            <Database className="w-4 h-4 mr-2" />
            Select
          </Button>
          
          {showAddButton && (
            <Button
              size="sm"
              onClick={() => handleAddToInventory(medicine)}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Add to Inventory
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Database Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Medicine Database</span>
            </div>
            <div className="text-sm text-blue-700">
              <span className="font-medium">{totalMedicines.toLocaleString()}</span> medicines available
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Local Database</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${databaseStats.openfda ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>OpenFDA API</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search medicines by name, generic name, or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Search
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="popular">Popular Medicines</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.map((medicine) => renderMedicineCard(medicine, showAddButton))}
            </div>
          ) : searchQuery && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No medicines found for "{searchQuery}"</p>
              <p className="text-sm">Try searching with different terms or check spelling</p>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="flex gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading popular medicines...</p>
            </div>
          ) : popularMedicines.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Popular {categories.find(c => c.value === selectedCategory)?.label} ({popularMedicines.length})
              </h3>
              {popularMedicines.map((medicine) => renderMedicineCard(medicine, showAddButton))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No popular medicines found for this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
