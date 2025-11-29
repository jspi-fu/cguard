'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'destructive' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-right-full fade-in duration-300
              ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              ${toast.type === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-slate-200 text-slate-800' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {toast.type === 'destructive' && <AlertCircle className="w-4 h-4 text-red-600" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-slate-600" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 text-current opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

