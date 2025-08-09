import { useState, useCallback } from 'react';
import { ToastMessage } from '@/types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    type: ToastMessage['type'],
    title: string,
    message?: string,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => 
    addToast('success', title, message), [addToast]);
  
  const showError = useCallback((title: string, message?: string) => 
    addToast('error', title, message), [addToast]);
  
  const showWarning = useCallback((title: string, message?: string) => 
    addToast('warning', title, message), [addToast]);
  
  const showInfo = useCallback((title: string, message?: string) => 
    addToast('info', title, message), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
