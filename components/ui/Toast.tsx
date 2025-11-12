'use client';

import { useState, createContext, useContext } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counter, setCounter] = useState(0);

  const showToast = (message: string, type: ToastType) => {
    // Check if a toast with the same message and type already exists
    setToasts((prevToasts) => {
      const existingToast = prevToasts.find(toast => 
        toast.message === message && toast.type === type
      );
      
      if (existingToast) {
        // If duplicate exists, don't add another one
        return prevToasts;
      }
      
      // Generate a unique ID using timestamp + counter + random number
      const id = `${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 9)}`;
      setCounter(prev => prev + 1);
      
      const newToast = { id, message, type };
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        hideToast(id);
      }, 5000);
      
      return [...prevToasts, newToast];
    });
  };

  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md shadow-lg p-4 flex items-center justify-between animate-slide-up ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
            toast.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
            'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {toast.type === 'success' ? <FaCheckCircle /> : 
               toast.type === 'error' ? <FaExclamationCircle /> : 
               <FaInfoCircle />}
            </span>
            <p>{toast.message}</p>
          </div>
          <button
            onClick={() => hideToast(toast.id)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer; 