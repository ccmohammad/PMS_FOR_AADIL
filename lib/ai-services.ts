interface DrugInteraction {
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  description: string;
  recommendation: string;
}

interface InventoryPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  daysUntilStockout: number;
  recommendedReorderQuantity: number;
  confidence: number;
}

interface ProductSearchResult {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  sku: string;
  price: number;
  requiresPrescription: boolean;
  relevanceScore: number;
  searchReason: string;
}

interface ExpiryAlert {
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  suggestedAction: 'use_first' | 'discount' | 'return' | 'dispose';
}

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
  }>;
  isValid: boolean;
  confidence: number;
  warnings: string[];
}

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
  safetyNotes: string;
  doctorApprovalRequired: boolean;
}

interface MedicationSubstitution {
  originalMedication: string;
  identifiedGenericName: string;
  genericAlternatives: GenericAlternative[];
  totalCostSavings: number;
  substitutionReason: string;
  doctorApprovalRequired: boolean;
  confidence: number;
  safetyWarning: string;
}

export class AIServices {
  private static instance: AIServices;
  private openaiApiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private MAX_CACHE_SIZE = 100; // Maximum number of cache entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.startCacheCleanup();
  }

  public static getInstance(): AIServices {
    if (!AIServices.instance) {
      AIServices.instance = new AIServices();
    }
    return AIServices.instance;
  }

  public setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey;
  }

  private startCacheCleanup(): void {
    // Clean up cache every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 2 * 60 * 1000);
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Remove expired entries
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        cleanedCount++;
      });
    }

    if (cleanedCount > 0) {
      console.log(`AI Cache cleaned: ${cleanedCount} entries removed. Current size: ${this.cache.size}`);
    }
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    // Remove expired entry immediately
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    // Check if we need to clean up before adding
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  // 1. Drug Interaction Checker
  async checkDrugInteractions(medications: string[]): Promise<DrugInteraction[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check cache first
    const cacheKey = `interactions:${medications.sort().join(',')}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a pharmaceutical expert. Analyze drug interactions and provide detailed information about potential interactions between medications. Return only valid JSON with this structure:
              [
                {
                  "severity": "minor|moderate|major|severe",
                  "description": "Detailed description of the interaction",
                  "recommendation": "Specific recommendation for the pharmacist"
                }
              ]`
            },
            {
              role: 'user',
              content: `Check for drug interactions between these medications: ${medications.join(', ')}. Focus on clinically significant interactions that a pharmacist should be aware of.`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Drug interaction check failed:', error);
      return [];
    }
  }

  // 2. Smart Inventory Prediction
  async predictInventoryDemand(salesData: any[], inventoryData: any[]): Promise<InventoryPrediction[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // If no sales data, return empty predictions
      if (!salesData || salesData.length === 0) {
        return inventoryData.map(inv => ({
          productId: inv.productId,
          productName: inv.productName,
          currentStock: inv.currentStock,
          predictedDemand: 0,
          daysUntilStockout: 999,
          recommendedReorderQuantity: inv.reorderLevel || 10,
          confidence: 0.1
        }));
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a pharmacy inventory management expert. Analyze recent sales data (last 30 days) and predict future demand for medications. Consider recent trends, weekly patterns, and current stock levels. Return only valid JSON with this structure:
              [
                {
                  "productId": "string",
                  "productName": "string", 
                  "currentStock": number,
                  "predictedDemand": number,
                  "daysUntilStockout": number,
                  "recommendedReorderQuantity": number,
                  "confidence": number (0-1)
                }
              ]`
            },
            {
              role: 'user',
              content: `Analyze this recent sales data (last 30 days) and current inventory to predict demand:
              
              Recent Sales Data (${salesData.length} records): ${JSON.stringify(salesData.slice(0, 50))}
              Current Inventory: ${JSON.stringify(inventoryData.slice(0, 30))}
              
              Predict demand for the next 30 days and provide reorder recommendations. Focus on products that are likely to run out of stock. Consider recent sales patterns and trends for accurate predictions.`
            }
          ],
          temperature: 0.1,
          max_tokens: 800
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      if (!data.choices || !data.choices[0]) {
        console.error('No choices in OpenAI response:', data);
        throw new Error('No response choices from OpenAI');
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenAI response:', data);
        throw new Error('No response content from OpenAI');
      }

      console.log('OpenAI response content:', content.substring(0, 200) + '...');

      let predictions;
      try {
        predictions = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      // Ensure all predictions have required fields
      return predictions.map((pred: any) => ({
        productId: pred.productId || '',
        productName: pred.productName || '',
        currentStock: pred.currentStock || 0,
        predictedDemand: pred.predictedDemand || 0,
        daysUntilStockout: pred.daysUntilStockout || 999,
        recommendedReorderQuantity: pred.recommendedReorderQuantity || 10,
        confidence: Math.min(Math.max(pred.confidence || 0.5, 0), 1)
      }));
    } catch (error) {
      console.error('Inventory prediction failed:', error);
      // Return fallback predictions for all inventory items
      return inventoryData.map(inv => ({
        productId: inv.productId,
        productName: inv.productName,
        currentStock: inv.currentStock,
        predictedDemand: 0,
        daysUntilStockout: 999,
        recommendedReorderQuantity: inv.reorderLevel || 10,
        confidence: 0.1
      }));
    }
  }

  // 3. AI Product Search
  async searchProducts(query: string, products: any[]): Promise<ProductSearchResult[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check cache first
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a pharmacy search expert. Match user queries to appropriate medications based on symptoms, generic names, brand names, and medical conditions. Return only valid JSON with this structure:
              [
                {
                  "_id": "string",
                  "name": "string",
                  "genericName": "string",
                  "category": "string", 
                  "manufacturer": "string",
                  "sku": "string",
                  "price": number,
                  "requiresPrescription": boolean,
                  "relevanceScore": number (0-1),
                  "searchReason": "string explaining why this product matches"
                }
              ]`
            },
            {
              role: 'user',
              content: `Search for products matching this query: "${query}"
              
              Available products: ${JSON.stringify(products.slice(0, 20).map(p => ({
                name: p.name,
                genericName: p.genericName,
                category: p.category,
                price: p.price
              })))}
              
              Match based on symptoms, medical conditions, generic names, or direct product names. Rank by relevance.`
            }
          ],
          temperature: 0.1,
          max_tokens: 600
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('AI product search failed:', error);
      return [];
    }
  }

  // 4. Smart Expiry Management
  async analyzeExpiryManagement(inventory: any[]): Promise<ExpiryAlert[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a pharmacy inventory optimization expert. Analyze medication expiry dates and provide smart management recommendations. Return only valid JSON with this structure:
              [
                {
                  "productId": "string",
                  "productName": "string",
                  "batchNumber": "string",
                  "expiryDate": "ISO date string",
                  "daysUntilExpiry": number,
                  "priority": "low|medium|high|critical",
                  "recommendation": "string",
                  "suggestedAction": "use_first|discount|return|dispose"
                }
              ]`
            },
            {
              role: 'user',
              content: `Analyze these inventory items for expiry management:
              
              ${JSON.stringify(inventory)}
              
              Provide recommendations for each item based on expiry date, stock levels, and pharmaceutical best practices.`
            }
          ],
          temperature: 0.1,
          max_tokens: 600
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Expiry management analysis failed:', error);
      return [];
    }
  }

  // 5. Medication Substitution & Generic Recommendations
  async findMedicationSubstitutions(medicationName: string, currentProducts: any[]): Promise<MedicationSubstitution[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `Find safe generic alternatives for medications. Return ONLY valid JSON:

[{"originalMedication":"string","identifiedGenericName":"string","genericAlternatives":[{"name":"string","genericName":"string","manufacturer":"string","strength":"string","form":"string","costSavings":0,"effectivenessScore":0.8,"availability":"in-stock","requiresPrescription":true,"safetyNotes":"Doctor approval required","doctorApprovalRequired":true}],"totalCostSavings":0,"substitutionReason":"Generic equivalent","doctorApprovalRequired":true,"confidence":0.8,"safetyWarning":"Doctor approval required"}]

Rules: Only suggest EXACT generic equivalents. Always require doctor approval. Be conservative.`
            },
            {
              role: 'user',
              content: `Find generic alternatives for: "${medicationName}"

Inventory: ${JSON.stringify(currentProducts.slice(0, 15).map(p => ({
  name: p.name,
  genericName: p.genericName,
  price: p.price
})))}

Find products with same generic name. Only suggest if 100% safe.`
            }
          ],
          temperature: 0.1,
          max_tokens: 400
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      if (!data.choices || !data.choices[0]) {
        console.error('No choices in OpenAI response:', data);
        throw new Error('No response choices from OpenAI');
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenAI response:', data);
        throw new Error('No response content from OpenAI');
      }

      console.log('OpenAI substitution response:', content.substring(0, 500) + '...');

      let substitutions;
      try {
        substitutions = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      return substitutions.map((sub: any) => ({
        originalMedication: sub.originalMedication || medicationName,
        identifiedGenericName: sub.identifiedGenericName || '',
        genericAlternatives: (sub.genericAlternatives || []).map((alt: any) => ({
          name: alt.name || '',
          genericName: alt.genericName || '',
          manufacturer: alt.manufacturer || '',
          strength: alt.strength || '',
          form: alt.form || '',
          costSavings: Math.max(0, alt.costSavings || 0),
          effectivenessScore: Math.min(Math.max(alt.effectivenessScore || 0.8, 0), 1),
          availability: alt.availability || 'in-stock',
          requiresPrescription: alt.requiresPrescription || true,
          safetyNotes: alt.safetyNotes || 'Doctor approval required',
          doctorApprovalRequired: alt.doctorApprovalRequired || true
        })),
        totalCostSavings: Math.max(0, sub.totalCostSavings || 0),
        substitutionReason: sub.substitutionReason || 'Generic equivalent available',
        doctorApprovalRequired: sub.doctorApprovalRequired || true,
        confidence: Math.min(Math.max(sub.confidence || 0.8, 0), 1),
        safetyWarning: sub.safetyWarning || 'All substitutions require doctor approval'
      }));

    } catch (error) {
      console.error('Medication substitution failed:', error);
      throw error;
    }
  }

  // 6. Intelligent Prescription Processing
  async processPrescription(imageBase64: string): Promise<PrescriptionData> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a pharmaceutical expert with excellent handwriting recognition skills. Extract prescription information from images with high accuracy.

CRITICAL: You must respond with ONLY valid JSON. Do not include any text, explanations, or formatting outside the JSON object.

IMPORTANT EXTRACTION GUIDELINES:
- Read the EXACT text as written in the prescription
- Pay special attention to frequency (e.g., "twice daily", "TID", "BID", "once daily", "OD", "BD", "TDS", "QID")
- Extract dosage exactly as written (e.g., "500mg", "1 tablet", "5ml")
- Read duration precisely (e.g., "7 days", "2 weeks", "1 month")
- Capture all instructions exactly as written
- If text is unclear, make your best interpretation but note it in warnings

Return exactly this JSON structure:
{
  "doctorName": "string",
  "patientName": "string", 
  "prescriptionDate": "ISO date string",
  "medications": [
    {
      "name": "string",
      "genericName": "string",
      "dosage": "string",
      "frequency": "string", 
      "duration": "string",
      "instructions": "string"
    }
  ],
  "isValid": true,
  "confidence": 0.8,
  "warnings": []
}

If you cannot read the prescription clearly, set isValid to false and add warnings explaining what could not be read.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all prescription information from this image with high accuracy. Pay special attention to:\n\n1. Medication names (exact spelling)\n2. Generic names (identify the generic name for each medication)\n3. Dosages (exact amounts and units)\n4. Frequency (exact text as written - e.g., "twice daily", "TID", "BID", "once daily", "OD", "BD", "TDS", "QID")\n5. Duration (exact time period)\n6. Instructions (exact text as written)\n7. Doctor name and patient name\n8. Prescription date\n\nFor each medication:\n- Extract the exact name as written\n- Identify the generic name (active ingredient)\n- If the medication name is already generic, use the same name for both fields\n- If it\'s a brand name, identify its generic equivalent\n\nRead the handwriting carefully and extract the EXACT text as written in the prescription. If any text is unclear, make your best interpretation but note it in the warnings field.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      if (!data.choices || !data.choices[0]) {
        console.error('No choices in OpenAI response:', data);
        throw new Error('No response choices from OpenAI');
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenAI response:', data);
        throw new Error('No response content from OpenAI');
      }

      console.log('OpenAI prescription response:', content.substring(0, 500) + '...');

      let prescriptionData;
      let jsonContent = content.trim();
      
      try {
        // Try to extract JSON from the response if it's wrapped in text
        // Look for JSON object in the response
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        // If the response starts with ```json, extract the content
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        
        // If the response starts with ```, extract the content
        if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing whitespace and newlines
        jsonContent = jsonContent.trim();
        
        console.log('Extracted JSON content:', jsonContent.substring(0, 200) + '...');
        
        prescriptionData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError);
        console.error('Raw content:', content);
        console.error('Extracted content:', jsonContent);
        
        // Try to create a fallback response
        prescriptionData = {
          doctorName: '',
          patientName: '',
          prescriptionDate: '',
          medications: [],
          isValid: false,
          confidence: 0,
          warnings: ['Unable to parse prescription data. Please try with a clearer image.']
        };
      }

      // Ensure all required fields exist and add field-level confidence
      const processedMedications = (prescriptionData.medications || []).map((med: any) => ({
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.instructions || '',
        // Add confidence indicators for unclear fields
        _confidence: {
          name: med.name ? 'high' : 'low',
          dosage: med.dosage ? 'high' : 'low',
          frequency: med.frequency ? 'high' : 'low',
          duration: med.duration ? 'high' : 'low',
          instructions: med.instructions ? 'high' : 'low'
        }
      }));

      return {
        doctorName: prescriptionData.doctorName || '',
        patientName: prescriptionData.patientName || '',
        prescriptionDate: prescriptionData.prescriptionDate || '',
        medications: processedMedications,
        isValid: prescriptionData.isValid || false,
        confidence: Math.min(Math.max(prescriptionData.confidence || 0, 0), 1),
        warnings: prescriptionData.warnings || []
      };
    } catch (error) {
      console.error('Prescription processing failed:', error);
      return {
        doctorName: '',
        patientName: '',
        prescriptionDate: '',
        medications: [],
        isValid: false,
        confidence: 0,
        warnings: [`Failed to process prescription image: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

export const aiServices = AIServices.getInstance();
