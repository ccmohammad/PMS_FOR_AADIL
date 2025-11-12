'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaTrash, FaReceipt, FaPrescription, FaUserInjured, FaCapsules, FaHistory, FaCalculator, FaBarcode, FaEdit, FaFileImport, FaKeyboard, FaRobot, FaExclamationTriangle, FaPills } from 'react-icons/fa';
import { IProduct } from '@/models/Product';
import { IInventory } from '@/models/Inventory';
import { useToast } from '@/components/ui/Toast';
import InvoiceModal from '@/components/sales/InvoiceModal';
import { BatchSelectorModal } from '@/components/sales/BatchSelectorModal';
import AIProductSearch from '@/components/sales/AIProductSearch';
import PrescriptionProcessor from '@/components/sales/PrescriptionProcessor';
// import MedicationSubstitution from '@/components/ai/MedicationSubstitution'; // Disabled to reduce costs
import { CartItemDisplay } from '@/components/sales/CartItem';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import { BarcodeScanner } from '@/components/sales/BarcodeScanner';
import ProductForm from '@/components/products/ProductForm';

interface InventoryItem extends Omit<IInventory, 'product'> {
  product: IProduct;
}

interface CartItem {
  inventory: InventoryItem;
  batch: {
    _id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    sellingPrice: number;
  } | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface CompletedSale {
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
}

interface HeldTransaction {
  id: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  cashReceived: number;
  notes: string;
  heldAt: string;
  totalAmount: number;
}

// Add type for payment method
type PaymentMethod = 'cash' | 'card' | 'mobile' | 'other';

export default function SalesPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', email: '' });
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionDetails, setPrescriptionDetails] = useState({ 
    doctorName: '',
    prescriptionDate: '', 
    details: '' 
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const [customers, setCustomers] = useState<Array<{_id: string, name: string, phone: string, email: string}>>([]);
  const [showAISearch, setShowAISearch] = useState(false);
  const [showPrescriptionProcessor, setShowPrescriptionProcessor] = useState(false);
  // const [showMedicationSubstitution, setShowMedicationSubstitution] = useState(false); // Disabled to reduce costs
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Drug interaction states
  const [drugInteractions, setDrugInteractions] = useState<any[]>([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false);
  const [drugInteractionRef, setDrugInteractionRef] = useState<HTMLDivElement | null>(null);

  // Change calculation states
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showChangeCalculation, setShowChangeCalculation] = useState(false);

  // Product navigation states
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const [isProductNavigationActive, setIsProductNavigationActive] = useState(false);

  // Hold feature states
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [showHeldTransactions, setShowHeldTransactions] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdNotes, setHoldNotes] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        
        const data = await response.json();
        // Handle both old format (array) and new format (paginated object)
        const inventoryData = Array.isArray(data) ? data : data.data || [];
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        showToast('Failed to fetch inventory', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    
    fetchInventory();
    fetchCustomers();
  }, [showToast]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = inventory.filter(item => {
        // Filter out expired items
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const now = new Date();
          if (expiryDate < now) return false;
        }

        // Filter out out-of-stock items
        if (item.quantity <= 0) return false;

        // Apply search filters
        return (
          item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.product.genericName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredInventory(filtered);
    } else {
      // When no search query, still filter out expired and out-of-stock items
      const filtered = inventory.filter(item => {
        // Filter out expired items
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const now = new Date();
          if (expiryDate < now) return false;
        }

        // Filter out out-of-stock items
        if (item.quantity <= 0) return false;

        return true;
      });
      setFilteredInventory(filtered);
    }
  }, [searchQuery, inventory]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // USB Barcode Scanner Support
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // USB barcode scanners typically send Enter after scanning
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      
      // Check if it looks like a barcode (usually alphanumeric, specific length)
      const possibleBarcode = searchQuery.trim();
      
      // Try to find product by exact SKU match first (most likely for barcodes)
      const foundItem = inventory.find(item => 
        item.product.sku === possibleBarcode
      );
      
      if (foundItem) {
        // This looks like a barcode scan - add to cart and clear search
        addToCart(foundItem);
        showToast(`Added "${foundItem.product.name}" to cart`, 'success');
        setSearchQuery(''); // Clear search for next scan
        (e.target as HTMLInputElement).blur(); // Remove focus briefly
        setTimeout(() => {
          (e.target as HTMLInputElement).focus(); // Refocus for next scan
        }, 100);
      } else {
        // Not a direct SKU match, handle as normal search
        // The search filtering will happen automatically via handleSearch
      }
    }
  };

  const addProductToCart = (productData: any) => {
    console.log('addProductToCart called with:', productData);
    
    // If productData has an inventoryItemId, use that specific inventory item
    let inventoryItem;
    
    if (productData.inventoryItemId) {
      inventoryItem = inventory.find(inv => inv._id === productData.inventoryItemId);
      console.log('Using specific inventory item ID:', productData.inventoryItemId, inventoryItem ? 'Found' : 'Not found');
    }
    
    // If no specific inventory item ID, try to find by product ID
    if (!inventoryItem) {
      inventoryItem = inventory.find(inv => 
        inv.product._id === productData.id || inv.product._id === productData._id
      );
      console.log('Product ID matching result:', inventoryItem ? 'Found' : 'Not found');
    }
    
    // If still no match, try exact name match
    if (!inventoryItem) {
      inventoryItem = inventory.find(inv => 
        inv.product.name === productData.name
      );
      console.log('Name matching result:', inventoryItem ? 'Found' : 'Not found');
    }
    
    console.log('Final inventory item:', inventoryItem ? {
      id: inventoryItem._id,
      productId: inventoryItem.product._id,
      productName: inventoryItem.product.name,
      quantity: inventoryItem.quantity,
      expiryDateRequired: inventoryItem.product.expiryDateRequired
    } : 'Not found');
    
    if (!inventoryItem) {
      console.log('Available inventory items:', inventory.map(inv => ({
        id: inv._id,
        productId: inv.product._id,
        productName: inv.product.name
      })));
      showToast(`Product "${productData.name}" not found in inventory`, 'error');
      return;
    }
    
    // Check if product requires batch selection
    if (inventoryItem.product.expiryDateRequired) {
      console.log(`Product ${inventoryItem.product.name} requires batch selection, opening batch selector`);
      setSelectedProduct(inventoryItem);
      setShowBatchSelector(true);
      return;
    }
    
    addToCart(inventoryItem);
  };

  const addToCart = (item: InventoryItem) => {
    console.log('addToCart called with:', {
      id: item._id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    });
    
    // Check if the product is expired
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const now = new Date();
      if (expiryDate < now) {
        console.log('Product expired, not adding to cart');
        showToast('Cannot sell expired product', 'error');
        return;
      }
    }

    if (item.product.expiryDateRequired) {
      console.log('Product requires batch selection, opening batch selector');
      setSelectedProduct(item);
      setShowBatchSelector(true);
      return;
    }

    // For products without batch tracking, proceed as before
    const existingItemIndex = cartItems.findIndex(
      cartItem => cartItem.inventory._id === item._id
    );

    console.log('Existing item index:', existingItemIndex);
    console.log('Current cart items count:', cartItems.length);

    if (existingItemIndex >= 0) {
      console.log('Updating existing cart item');
      setCartItems(prevCartItems => {
        const updatedItems = [...prevCartItems];
        updatedItems[existingItemIndex].quantity += 1;
        
        if (updatedItems[existingItemIndex].quantity > item.quantity) {
          console.log('Not enough stock available');
          showToast('Not enough stock available', 'error');
          return prevCartItems; // Return unchanged state
        }
        
        const unitPrice = item.product.price || 0;
        const discount = updatedItems[existingItemIndex].discount || 0;
        updatedItems[existingItemIndex].unitPrice = unitPrice;
        updatedItems[existingItemIndex].total = 
          updatedItems[existingItemIndex].quantity * (unitPrice - discount);
        
        console.log('Updated cart items:', updatedItems);
        return updatedItems;
      });
    } else {
      console.log('Adding new item to cart');
      const unitPrice = item.product.price || 0;
      const newItem: CartItem = {
        inventory: item,
        batch: null,
        quantity: 1,
        unitPrice: unitPrice,
        discount: 0,
        total: unitPrice * 1,
      };
      
      setCartItems(prevCartItems => {
        const newCartItems = [...prevCartItems, newItem];
        console.log('New cart items:', newCartItems);
        return newCartItems;
      });
    }
    
    const requiresPrescription = cartItems.some(item => item.inventory.product.requiresPrescription) || 
      item.product.requiresPrescription;
    
    if (requiresPrescription) {
      setShowPrescription(true);
    }
  };

  const handleBatchSelect = (batch: any) => {
    if (!selectedProduct || !batch) return;

    const existingItemIndex = cartItems.findIndex(
      cartItem => 
        cartItem.inventory._id === selectedProduct._id && 
        cartItem.batch?._id === batch._id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      
      if (updatedItems[existingItemIndex].quantity > batch.quantity) {
        showToast('Not enough stock available in this batch', 'error');
        return;
      }
      
      updatedItems[existingItemIndex].total = 
        updatedItems[existingItemIndex].quantity * (batch.sellingPrice - updatedItems[existingItemIndex].discount);
      
      setCartItems(updatedItems);
    } else {
      const newItem: CartItem = {
        inventory: selectedProduct,
        batch: {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: batch.quantity,
          sellingPrice: batch.sellingPrice
        },
        quantity: 1,
        unitPrice: batch.sellingPrice,
        discount: 0,
        total: batch.sellingPrice * 1,
      };
      
      setCartItems([...cartItems, newItem]);
    }

    setShowBatchSelector(false);
    setSelectedProduct(null);

    const requiresPrescription = cartItems.some(item => item.inventory.product.requiresPrescription) || 
      selectedProduct.product.requiresPrescription;
    
    if (requiresPrescription) {
      setShowPrescription(true);
    }
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...cartItems];
    const item = updatedItems[index];
    
    // Check if enough inventory is available
    if (quantity > item.inventory.quantity) {
      showToast('Not enough stock available', 'error');
      return;
    }
    
    updatedItems[index].quantity = quantity;
    const unitPrice = item.inventory.product.price || 0;
    const discount = item.discount || 0;
    updatedItems[index].unitPrice = unitPrice;
    updatedItems[index].total = quantity * (unitPrice - discount);
    
    setCartItems(updatedItems);
  };

  const updateCartItemDiscount = (index: number, discount: number) => {
    const updatedItems = [...cartItems];
    const item = updatedItems[index];
    const unitPrice = item.inventory.product.price || 0;
    
    // Make sure discount is not greater than unit price
    if (discount > unitPrice) {
      showToast('Discount cannot be greater than unit price', 'error');
      return;
    }
    
    updatedItems[index].discount = discount;
    updatedItems[index].unitPrice = unitPrice;
    updatedItems[index].total = item.quantity * (unitPrice - discount);
    
    setCartItems(updatedItems);
  };

  const removeFromCart = (index: number) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
    
    // Check if prescription is still required
    const requiresPrescription = updatedItems.some(item => item.inventory.product.requiresPrescription);
    if (!requiresPrescription) {
      setShowPrescription(false);
    }

    // Clear drug interactions if less than 2 items
    if (updatedItems.length < 2) {
      setDrugInteractions([]);
      setHasCheckedInteractions(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleBarcodeScan = (barcode: string) => {
    // Search for the product by SKU/barcode
    const foundItem = inventory.find(item => 
      item.product.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (foundItem) {
      addToCart(foundItem);
      showToast('Product added to cart', 'success');
    } else {
      showToast('Product not found with this barcode', 'error');
    }
  };

  const handlePrescriptionMedications = async (medications: any[]) => {
    try {
      let matchedCount = 0;
      let unmatchedMedications: string[] = [];

      for (const medication of medications) {
        // Try to find matching products in inventory
        const matchingProducts = inventory.filter(item => {
          const productName = item.product.name.toLowerCase();
          const genericName = item.product.genericName?.toLowerCase() || '';
          const medicationName = medication.name.toLowerCase();
          
          // Common medication name variations
          const medicationVariations = [
            medicationName,
            medicationName.replace(/\s+/g, ''), // Remove spaces
            medicationName.replace(/[^a-zA-Z0-9]/g, ''), // Remove special chars
            medicationName.split(' ')[0], // First word only
            medicationName.split(' ').pop() // Last word only
          ];
          
          // Check if any variation matches product name or generic name
          return medicationVariations.some(variation => 
            productName.includes(variation) || 
            genericName.includes(variation) ||
            variation.includes(productName) ||
            variation.includes(genericName) ||
            // Check for common medication mappings
            (medicationName.includes('paracetamol') && (productName.includes('napa') || genericName.includes('paracetamol'))) ||
            (medicationName.includes('acetaminophen') && (productName.includes('napa') || genericName.includes('paracetamol'))) ||
            (medicationName.includes('ibuprofen') && (productName.includes('ibuprofen') || genericName.includes('ibuprofen'))) ||
            (medicationName.includes('aspirin') && (productName.includes('aspirin') || genericName.includes('aspirin')))
          );
        });

        if (matchingProducts.length > 0) {
          // Add the first matching product to cart
          addToCart(matchingProducts[0]);
          matchedCount++;
          console.log(`Matched: ${medication.name} -> ${matchingProducts[0].product.name}`);
        } else {
          unmatchedMedications.push(medication.name);
          console.log(`No match found for: ${medication.name}`);
        }
      }

      // Show results
      if (matchedCount > 0) {
        showToast(`${matchedCount} medication(s) added to cart`, 'success');
      }
      
      if (unmatchedMedications.length > 0) {
        showToast(`Could not find: ${unmatchedMedications.join(', ')}`, 'info');
      }

    } catch (error) {
      console.error('Error processing prescription medications:', error);
      showToast('Error processing prescription medications', 'error');
    }
  };

  const checkDrugInteractions = async () => {
    if (cartItems.length < 2) {
      setDrugInteractions([]);
      setHasCheckedInteractions(false);
      return;
    }

    try {
      setIsCheckingInteractions(true);
      
      // Extract medication names from cart items
      const medications = cartItems.map(item => 
        item.inventory.product.genericName || item.inventory.product.name
      );

      const response = await fetch('/api/ai/drug-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medications }),
      });

      if (response.ok) {
        const data = await response.json();
        setDrugInteractions(data.interactions || []);
        setHasCheckedInteractions(true);
      } else {
        console.error('Failed to check drug interactions');
        setDrugInteractions([]);
        setHasCheckedInteractions(false);
      }
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      setDrugInteractions([]);
      setHasCheckedInteractions(false);
    } finally {
      setIsCheckingInteractions(false);
      
      // Scroll to drug interaction result after a short delay to ensure DOM is updated
      // This happens regardless of whether interactions were found or not
      setTimeout(() => {
        if (drugInteractionRef) {
          drugInteractionRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  };

  const processSale = async () => {
    if (cartItems.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const saleData = {
        customer: customerDetails.name ? {
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email,
        } : undefined,
        items: cartItems.map(item => ({
          product: item.inventory.product._id,
          inventory: item.inventory._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        totalAmount: calculateTotal(),
        paymentMethod,
        hasPrescription: showPrescription,
        prescription: showPrescription ? prescriptionDetails : undefined,
      };
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process sale');
      }
      
      const result = await response.json();
      
      // Show invoice
      setCompletedSale(result);
      
      // Clear form
      setCartItems([]);
      setCustomerDetails({ name: '', phone: '', email: '' });
      setShowPrescription(false);
      setPrescriptionDetails({ 
        doctorName: '',
        prescriptionDate: '', 
        details: '' 
      });
      setCashReceived(0);
      setShowChangeCalculation(false);
      
      showToast('Sale completed successfully!', 'success');
      
      // Refresh inventory
      const inventoryResponse = await fetch('/api/inventory');
      if (inventoryResponse.ok) {
        const data = await inventoryResponse.json();
        // Handle both old format (array) and new format (paginated object)
        const inventoryData = Array.isArray(data) ? data : data.data || [];
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);
      }
    } catch (error: unknown) {
      console.error('Error processing sale:', error);
      showToast(error instanceof Error ? error.message : 'Failed to process sale', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate change
  const calculateChange = () => {
    const total = calculateTotal();
    return cashReceived - total;
  };

  // Hold transaction functions
  const holdTransaction = () => {
    if (cartItems.length === 0) {
      showToast('No items in cart to hold', 'error');
      return;
    }

    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newHold: HeldTransaction = {
      id: holdId,
      customerDetails: customerDetails,
      cartItems: [...cartItems],
      paymentMethod,
      cashReceived,
      notes: holdNotes,
      heldAt: new Date().toISOString(),
      totalAmount: calculateTotal()
    };

    setHeldTransactions(prev => [...prev, newHold]);
    
    // Clear current transaction
    setCartItems([]);
    setCustomerDetails({ name: '', phone: '', email: '' });
    setCustomerSearchQuery('');
    setPaymentMethod('cash');
    setCashReceived(0);
    setHoldNotes('');
    setShowHoldModal(false);
    
    showToast(`Transaction held successfully (ID: ${holdId.substr(-6)})`, 'success');
  };

  const resumeHeldTransaction = (hold: HeldTransaction) => {
    // Check if current cart has items
    if (cartItems.length > 0) {
      if (!confirm('Current cart has items. Resume held transaction anyway? Current items will be lost.')) {
        return;
      }
    }

    // Restore the held transaction
    setCartItems(hold.cartItems);
    setCustomerDetails(hold.customerDetails);
    setCustomerSearchQuery(hold.customerDetails.name);
    setPaymentMethod(hold.paymentMethod);
    setCashReceived(hold.cashReceived);
    
    // Remove from held transactions
    setHeldTransactions(prev => prev.filter(h => h.id !== hold.id));
    setShowHeldTransactions(false);
    
    showToast('Transaction resumed successfully', 'success');
  };

  const deleteHeldTransaction = (holdId: string) => {
    if (confirm('Are you sure you want to delete this held transaction?')) {
      setHeldTransactions(prev => prev.filter(h => h.id !== holdId));
      showToast('Held transaction deleted', 'success');
    }
  };

  // Auto-focus and calculate when payment method changes or cart total changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setShowChangeCalculation(true);
      // Set default cash received to exact total amount
      setCashReceived(calculateTotal());
    } else {
      setShowChangeCalculation(false);
      setCashReceived(0);
    }
  }, [paymentMethod, calculateTotal()]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for specific cases)
      const activeElement = document.activeElement;
      const isInInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      
      // Allow F keys and number keys even when in inputs, but handle them carefully
      if (isInInput && !['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Delete'].includes(e.key)) {
        return;
      }

      // Handle arrow keys for product navigation
      if (isProductNavigationActive && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        const itemsPerRow = window.innerWidth >= 1280 ? 3 : (window.innerWidth >= 1024 ? 2 : (window.innerWidth >= 640 ? 2 : 1));
        const totalItems = filteredInventory.length;

        switch (e.key) {
          case 'ArrowUp':
            setSelectedProductIndex(prev => {
              const newIndex = Math.max(0, prev - itemsPerRow);
              setTimeout(() => {
                const product = document.querySelector(`[data-product-index="${newIndex}"]`);
                if (product) {
                  product.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 10);
              return newIndex;
            });
            break;
          case 'ArrowDown':
            setSelectedProductIndex(prev => {
              const newIndex = Math.min(totalItems - 1, prev + itemsPerRow);
              setTimeout(() => {
                const product = document.querySelector(`[data-product-index="${newIndex}"]`);
                if (product) {
                  product.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 10);
              return newIndex;
            });
            break;
          case 'ArrowLeft':
            setSelectedProductIndex(prev => {
              const newIndex = Math.max(0, prev - 1);
              setTimeout(() => {
                const product = document.querySelector(`[data-product-index="${newIndex}"]`);
                if (product) {
                  product.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 10);
              return newIndex;
            });
            break;
          case 'ArrowRight':
            setSelectedProductIndex(prev => {
              const newIndex = Math.min(totalItems - 1, prev + 1);
              setTimeout(() => {
                const product = document.querySelector(`[data-product-index="${newIndex}"]`);
                if (product) {
                  product.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 10);
              return newIndex;
            });
            break;
          case 'Enter':
            if (selectedProductIndex >= 0 && selectedProductIndex < totalItems) {
              addToCart(filteredInventory[selectedProductIndex]);
            }
            break;
          case 'Escape':
            setIsProductNavigationActive(false);
            setSelectedProductIndex(-1);
            break;
        }
        return;
      }

      // Prevent default for our shortcut keys
      if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'Delete'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case 'Delete':
          // Remove latest (last) cart item
          if (cartItems.length > 0) {
            removeFromCart(cartItems.length - 1);
          }
          break;
        case 'F1':
          // Focus product search
          const productSearchInput = document.querySelector('input[placeholder*="Search products"]') as HTMLInputElement;
          if (productSearchInput) {
            productSearchInput.focus();
            productSearchInput.select();
          }
          break;
        case 'F2':
          // Start product navigation (blur search input if focused)
          console.log('F2 pressed - Starting product navigation');
          console.log('Filtered inventory length:', filteredInventory.length);
          
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLInputElement && activeElement.placeholder.includes('Search products')) {
            console.log('Blurring search input');
            activeElement.blur();
          }
          
          if (filteredInventory.length > 0) {
            console.log('Setting navigation active and index to 0');
            setIsProductNavigationActive(true);
            setSelectedProductIndex(0);
            setTimeout(() => {
              const firstProduct = document.querySelector('[data-product-index="0"]');
              console.log('Looking for first product:', firstProduct);
              if (firstProduct) {
                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }
          break;
        case 'F3':
          // Focus cash received input
          if (paymentMethod === 'cash') {
            const cashInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
            if (cashInput) {
              cashInput.focus();
              cashInput.select();
            }
          } else {
            // Switch to cash and focus input
            setPaymentMethod('cash');
            setTimeout(() => {
              const cashInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
              if (cashInput) {
                cashInput.focus();
                cashInput.select();
              }
            }, 100);
          }
          break;
        case 'F4':
          // Complete sale
          if (cartItems.length > 0 && (paymentMethod !== 'cash' || calculateChange() >= 0)) {
            processSale();
          }
          break;
        case 'F5':
          // Print invoice (will be implemented when invoice is ready)
          if (completedSale) {
            // This would trigger invoice print - placeholder for now
            console.log('Print invoice triggered for sale:', completedSale);
          }
          break;
        case 'F6':
          // Clear cart
          if (cartItems.length > 0) {
            setCartItems([]);
            setCashReceived(0);
            setCustomerDetails({ name: '', phone: '', email: '' });
          }
          break;
        case 'F7':
          // Focus customer field
          const customerInput = document.querySelector('input[placeholder*="Search customer or type name"]') as HTMLInputElement;
          if (customerInput) {
            customerInput.focus();
            customerInput.select();
          }
          break;
        case 'F8':
          // Open barcode scanner
          setShowBarcodeScanner(true);
          break;
        case 'F9':
          // Show keyboard shortcuts help
          setShowKeyboardShortcuts(true);
          break;
        case 'F10':
          // Hold current transaction
          if (cartItems.length > 0) {
            setShowHoldModal(true);
          } else {
            showToast('No items in cart to hold', 'error');
          }
          break;
        case 'F11':
          // Show held transactions
          setShowHeldTransactions(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, paymentMethod, showKeyboardShortcuts, showBarcodeScanner, isProductNavigationActive, selectedProductIndex, filteredInventory, addToCart, heldTransactions, holdTransaction, resumeHeldTransaction, deleteHeldTransaction]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
            <div className="relative mb-6">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
      {/* Left Side - Cart & Payment */}
      <div className="flex flex-col h-full border-r lg:border-r-0 lg:border-b-0 border-b lg:border-r order-2 lg:order-1">
        {/* Header - Mobile Only */}
        <div className="lg:hidden bg-white p-4 border-b">
          <h1 className="text-xl font-bold text-center">Point of Sale</h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block space-y-6 p-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>

        {/* Customer Details */}
        <div className="bg-gray-50 p-3 lg:p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer or type name to create new..."
              value={customerSearchQuery}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value);
                setShowCustomerDropdown(e.target.value.length > 0);
                setIsCreatingNewCustomer(false);
              }}
              onFocus={() => {
                if (customerSearchQuery.length > 0) {
                  setShowCustomerDropdown(true);
                }
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Selected Customer Display */}
            {customerDetails.name && !showCustomerDropdown && (
              <div className="mt-2 p-2 bg-white border rounded-md text-sm">
                <div className="font-medium">{customerDetails.name}</div>
                {customerDetails.phone && (
                  <div className="text-gray-500">{customerDetails.phone}</div>
                )}
            <button 
                  onClick={() => {
                    setCustomerDetails({ name: '', phone: '', email: '' });
                    setCustomerSearchQuery('');
                  }}
                  className="text-xs text-red-600 hover:text-red-700 mt-1"
                >
                  Remove Customer
            </button>
          </div>
            )}

            {/* Dropdown */}
            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {/* Existing customers */}
                {customers
                  .filter(customer => 
                    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    customer.phone.includes(customerSearchQuery)
                  )
                  .slice(0, 5)
                  .map(customer => (
                    <div
                      key={customer._id}
                      onClick={() => {
                        setCustomerDetails({
                          name: customer.name,
                          phone: customer.phone,
                          email: customer.email
                        });
                        setCustomerSearchQuery(customer.name);
                        setShowCustomerDropdown(false);
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.phone}</div>
                    </div>
                  ))
                }
                
                {/* Create new customer option */}
                {customerSearchQuery.length > 0 && (
                  <div
                    onClick={() => {
                      setIsCreatingNewCustomer(true);
                      setShowCustomerDropdown(false);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-t bg-blue-50 text-blue-700"
                  >
                    <div className="text-sm font-medium">+ Create "{customerSearchQuery}"</div>
                    <div className="text-xs">Add as new customer</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Customer Form */}
          {isCreatingNewCustomer && (
            <div className="mt-4 p-3 bg-white border rounded-md">
              <h4 className="text-sm font-medium mb-3">Add New Customer</h4>
              <div className="space-y-2">
              <input
                type="text"
                  placeholder="Customer Name *"
                  value={customerDetails.name || customerSearchQuery}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                  required
              />
              <input
                type="tel"
                  placeholder="Phone Number *"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsCreatingNewCustomer(false);
                      setCustomerDetails({ name: '', phone: '', email: '' });
                      setCustomerSearchQuery('');
                    }}
                    className="flex-1 px-3 py-2 text-gray-600 border rounded-md hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!customerDetails.name || !customerDetails.phone) {
                        showToast('Name and phone are required', 'error');
                        return;
                      }
                      
                      try {
                        const response = await fetch('/api/customers', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(customerDetails),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to save customer');
                        }
                        
                        const newCustomer = await response.json();
                        setCustomers([...customers, newCustomer]);
                        setCustomerSearchQuery(newCustomer.name);
                        setIsCreatingNewCustomer(false);
                        showToast('Customer saved successfully!', 'success');
                      } catch (error) {
                        console.error('Error saving customer:', error);
                        showToast('Failed to save customer', 'error');
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save Customer
                  </button>
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Cart Section - Responsive Height */}
        <div className="flex flex-col h-32 sm:h-40 lg:h-48 xl:h-64">
          {/* Cart Header - Sticky */}
          <div className="sticky top-0 bg-white border-b p-3 lg:p-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-medium">Cart Items ({cartItems.length})</h2>
              <div className="flex gap-2">
                {heldTransactions.length > 0 && (
                  <button 
                    onClick={() => setShowHeldTransactions(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                    title="View Held Transactions (F11)"
                  >
                    📋 Held ({heldTransactions.length})
                  </button>
                )}
                {cartItems.length > 0 && (
                  <button 
                    onClick={() => setShowHoldModal(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 border border-orange-200 rounded hover:bg-orange-50"
                    title="Hold Transaction (F10)"
                  >
                    ⏸️ Hold
                  </button>
                )}
                <button 
                  onClick={() => setShowPrescriptionProcessor(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 px-2 py-1 border border-purple-200 rounded hover:bg-purple-50 flex items-center gap-1"
                  title="Scan and Process Prescription with AI"
                >
                  <FaPrescription className="text-xs" />
                  AI Scan Prescription
                </button>
                <button 
                  onClick={checkDrugInteractions}
                  disabled={cartItems.length < 2 || isCheckingInteractions}
                  className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 border border-orange-200 rounded hover:bg-orange-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Check for drug interactions in cart"
                >
                  {isCheckingInteractions ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                  ) : (
                    <FaExclamationTriangle className="text-xs" />
                  )}
                  {isCheckingInteractions ? 'Checking...' : 'Check Interactions'}
                </button>
                {/* AI Sub button removed to reduce costs */}
                <button 
                  onClick={() => setCartItems([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
          
          {/* Cart Content - Scrollable */}
          <div className="overflow-auto flex-1 p-3 lg:p-4 pt-0">
            {cartItems.length === 0 ? (
              <div className="text-center py-6 lg:py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-8 h-8 lg:w-12 lg:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm lg:text-base">No items in cart</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item, index) => (
                    <CartItemDisplay
                    key={item.inventory._id}
                      item={item}
                      index={index}
                    onQuantityChange={(idx: number, qty: number) => updateCartItemQuantity(idx, qty)}
                    onDiscountChange={(idx: number, disc: number) => updateCartItemDiscount(idx, disc)}
                    onRemove={(idx: number) => removeFromCart(idx)}
                  />
                ))}
                    </div>
                  )}

                {/* Drug Interaction Status */}
                {hasCheckedInteractions && (
                  <div 
                    ref={setDrugInteractionRef}
                    className="mt-3 p-3 rounded-lg border bg-white"
                  >
                    {drugInteractions.length > 0 ? (
                      <div className="bg-yellow-50 border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FaExclamationTriangle className="text-yellow-600" />
                          <h3 className="font-semibold text-yellow-800">Drug Interaction Alert</h3>
                          {isCheckingInteractions && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                          )}
                        </div>
                        {drugInteractions.map((interaction, index) => (
                          <div key={index} className="mb-2 p-2 bg-white rounded border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                interaction.severity === 'severe' ? 'bg-red-100 text-red-800' :
                                interaction.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                                interaction.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {interaction.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{interaction.description}</p>
                            <p className="text-sm font-medium text-gray-900">{interaction.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 border-green-200">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <h3 className="font-semibold text-green-800">Drug Interaction Check Complete</h3>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          ✅ No drug interactions detected. This combination is safe to dispense.
                        </p>
                      </div>
                    )}
                  </div>
                )}
          </div>
        </div>

        {/* Payment Section - Responsive */}
        <div className="border-t bg-white px-3 lg:px-4 pt-3 pb-4 lg:pb-6 sticky bottom-0">
          {/* Payment Method Selection - Responsive Grid */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`px-2 py-1.5 text-xs border rounded ${paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`px-2 py-1.5 text-xs border rounded ${paymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                💳 Card
              </button>
              <button
                onClick={() => setPaymentMethod('mobile')}
                className={`px-2 py-1.5 text-xs border rounded ${paymentMethod === 'mobile' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                📱 Mobile
              </button>
              <button
                onClick={() => setPaymentMethod('other')}
                className={`px-2 py-1.5 text-xs border rounded ${paymentMethod === 'other' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                💼 Other
              </button>
            </div>
          </div>

          {/* Cash Payment - Responsive */}
          {paymentMethod === 'cash' && (
            <div className="mb-3 p-2 bg-gray-50 rounded border">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-gray-700">Cash Received:</label>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-20 lg:w-24 px-2 py-1 text-right border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {/* Quick Amount Buttons - Responsive */}
              <div className="flex flex-wrap gap-1 mb-2">
                {[50, 100, 200, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount)}
                    className="px-1 lg:px-1.5 py-0.5 text-xs bg-white border rounded hover:bg-blue-50 hover:border-blue-300"
                  >
                    {amount}
                  </button>
                ))}
                <button
                  onClick={() => setCashReceived(calculateTotal())}
                  className="px-1 lg:px-1.5 py-0.5 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200"
                >
                  Exact
                </button>
              </div>
              
              {/* Change Display - Responsive */}
              {cashReceived > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-700">Change:</span>
                  <span className={`text-sm font-bold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {settings ? formatCurrency(Math.abs(calculateChange()), settings) : Math.abs(calculateChange()).toFixed(2)}
                    {calculateChange() < 0 && ' (Short)'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Total Amount - Responsive */}
          <div className="flex justify-between items-center mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-base lg:text-lg font-bold text-blue-600">
              {settings ? formatCurrency(calculateTotal(), settings) : calculateTotal()}
                  </span>
                </div>

          {/* Complete Sale Button - Responsive */}
                <button
                  onClick={processSale}
            disabled={isProcessing || cartItems.length === 0 || (paymentMethod === 'cash' && calculateChange() < 0)}
            className="w-full py-3 lg:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>

      {/* Right Side - Product Selection */}
      <div className="h-full overflow-auto order-1 lg:order-2">
        {/* Search and Product Actions - Responsive */}
        <div className="bg-white rounded-none lg:rounded-lg shadow-sm mb-2 lg:mb-4">
          <div className="p-3 lg:p-4">
            {/* Mobile: Stacked Layout */}
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products or scan barcode..."
                    className="w-full pl-10 pr-4 py-2 lg:py-3 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={handleSearch}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
              {/* Mobile: Horizontal Button Layout */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAISearch(true)}
                  className="flex-1 lg:flex-none px-3 lg:px-6 py-2 lg:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-base font-medium"
                  title="AI-Powered Product Search"
                >
                  <FaRobot className="text-sm lg:text-lg" />
                  <span className="hidden sm:inline">AI Search</span>
                </button>
              <button 
                onClick={() => setShowPrescriptionProcessor(true)}
                className="flex-1 lg:flex-none px-3 lg:px-6 py-2 lg:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-base font-medium"
                title="Scan and Process Prescription with AI"
              >
                <FaPrescription className="text-sm lg:text-lg" />
                <span className="hidden sm:inline">AI Scan Prescription</span>
              </button>
              </div>
            </div>
            {/* Barcode Scanning Info - Hide on small screens */}
            <div className="mt-2 hidden lg:flex items-center gap-4 text-xs text-gray-500">
              <span>💡 Scan with USB barcode scanner in search field, use AI Scan Prescription, or check drug interactions</span>
            </div>
          </div>
                    </div>

        {/* Products Grid - Responsive */}
        <div className="flex-1 overflow-y-auto bg-white rounded-none lg:rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-4 p-2 lg:p-4">
            {filteredInventory.map((item, index) => (
              <div
                key={item._id}
                data-product-index={index}
                onClick={() => addToCart(item)}
                className={`bg-white border rounded-lg p-2 lg:p-3 cursor-pointer hover:border-blue-500 transition-colors ${
                  isProductNavigationActive && selectedProductIndex === index 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1 lg:mb-2">
                  <h3 className="text-xs lg:text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</h3>
                  {item.product.requiresPrescription && (
                    <span className="bg-red-50 px-1 lg:px-1.5 py-0.5 rounded text-xs font-medium text-red-500">Rx</span>
                  )}
                  </div>
                {item.product.genericName && (
                  <p className="text-xs text-gray-500 mb-1 lg:mb-2">{item.product.genericName}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-xs lg:text-sm font-semibold text-blue-600">
                    {settings ? formatCurrency(item.product.price || 0, settings) : item.product.price}
                  </p>
                  <span className="text-xs text-gray-500">Stock: {item.quantity}</span>
                </div>
            </div>
            ))}
          </div>
          {filteredInventory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 lg:py-12">
              <p className="text-gray-500 text-sm lg:text-base">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBatchSelector && selectedProduct && (
        <BatchSelectorModal
          product={selectedProduct.product}
          onBatchSelect={handleBatchSelect}
          onClose={() => {
            setShowBatchSelector(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaKeyboard className="text-blue-600" />
                  POS Keyboard Shortcuts
                </h2>
              <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                  ×
              </button>
            </div>
            
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Function Keys F1-F9 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Function Keys (F1-F11)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Focus product search</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F1</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Product navigation focus</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F2</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Focus cash received</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F3</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Complete sale</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F4</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Print invoice</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F5</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Clear cart</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F6</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Focus customer</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F7</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Open barcode scanner</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F8</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Show keyboard shortcuts</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F9</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Hold transaction</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F10</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">View held transactions</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F11</kbd>
                    </div>
                  </div>
                </div>

                {/* Product Navigation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Product Navigation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Start navigation</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">F2</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Move up/down</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">↑</kbd>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">↓</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Move left/right</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">←</kbd>
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">→</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Add selected to cart</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Exit navigation</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Esc</kbd>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Quick Actions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Remove last cart item</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Delete</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Close modal/cancel</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Press F2 or Enter in search to start navigating products with arrow keys</li>
                  <li>• Arrow keys work in grid layout - up/down moves by rows, left/right by columns</li>
                  <li>• Selected product has blue border and background highlight</li>
                  <li>• USB barcode scanners work automatically in the search field</li>
                  <li>• Use F10 to hold transactions when customers need time or assistance</li>
                  <li>• Press Esc to exit product navigation or close modals</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                    <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Got it!
                    </button>
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Transaction Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Hold Transaction</h2>
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Customer: {customerDetails.name || 'Walk-in Customer'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Items: {cartItems.length} | Total: {settings ? formatCurrency(calculateTotal(), settings) : calculateTotal()}
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={holdNotes}
                  onChange={(e) => setHoldNotes(e.target.value)}
                  placeholder="Reason for holding (e.g., waiting for prescription, insurance verification...)"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={holdTransaction}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Hold Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Held Transactions Modal */}
      {showHeldTransactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Held Transactions ({heldTransactions.length})
                </h2>
                <button
                  onClick={() => setShowHeldTransactions(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {heldTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No held transactions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {heldTransactions.map((hold) => (
                    <div key={hold.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {hold.customerDetails.name || 'Walk-in Customer'}
                            </h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              ID: {hold.id.substr(-6)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <div>Items: {hold.cartItems.length}</div>
                            <div>Total: {settings ? formatCurrency(hold.totalAmount, settings) : hold.totalAmount}</div>
                            <div>Held: {new Date(hold.heldAt).toLocaleString()}</div>
                            {hold.notes && <div>Notes: {hold.notes}</div>}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {hold.cartItems.slice(0, 3).map((item, idx) => (
                              <span key={idx}>
                                {item.inventory.product.name} (x{item.quantity})
                                {idx < Math.min(hold.cartItems.length, 3) - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {hold.cartItems.length > 3 && ` +${hold.cartItems.length - 3} more`}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => resumeHeldTransaction(hold)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => deleteHeldTransaction(hold.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Product Search Modal */}
      <AIProductSearch
        isOpen={showAISearch}
        onClose={() => setShowAISearch(false)}
        onProductSelect={(product) => {
          // Find the inventory item for this product
          const inventoryItem = inventory.find(inv => inv.product._id === product._id);
          if (inventoryItem) {
            addToCart(inventoryItem);
            showToast('Product added to cart', 'success');
          } else {
            showToast('Product not found in inventory', 'error');
          }
        }}
      />

      {/* Prescription Processor Modal */}
      <PrescriptionProcessor
        isOpen={showPrescriptionProcessor}
        onClose={() => setShowPrescriptionProcessor(false)}
        onAddToCart={addProductToCart}
        onPrescriptionProcessed={async (data) => {
          setPrescriptionDetails({
            doctorName: data.doctorName,
            prescriptionDate: data.prescriptionDate,
            details: data.medications.map(med => 
              `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}`
            ).join(', ')
          });
          
          // Auto-match prescription medications to inventory - DISABLED
          // await handlePrescriptionMedications(data.medications);
          
          setShowPrescription(true);
          showToast('Prescription processed successfully', 'success');
        }}
      />

      {/* Medication Substitution Modal - Disabled to reduce costs */}

      {/* Floating Help Button */}
      <button
        onClick={() => setShowKeyboardShortcuts(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center group"
        title="Keyboard Shortcuts (F9)"
      >
        <FaKeyboard className="text-lg" />
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Shortcuts (F9)
        </span>
      </button>
    </div>
  );
} 