'use client';

import { useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

let globalToasts: Toast[] = [];
let globalSetToasts: ((t: Toast[]) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);
  globalSetToasts = setToasts;

  const dismiss = useCallback((id: string) => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    globalSetToasts?.(globalToasts);
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { id, message, variant };
      globalToasts = [...globalToasts, newToast];
      globalSetToasts?.(globalToasts);

      setTimeout(() => {
        dismiss(id);
      }, 5000);
    },
    [dismiss]
  );

  return { toasts, toast, dismiss };
}

/** Fire-and-forget toast from anywhere */
export function showToast(message: string, variant: ToastVariant = 'info') {
  const id = Math.random().toString(36).slice(2);
  const newToast: Toast = { id, message, variant };
  globalToasts = [...globalToasts, newToast];
  globalSetToasts?.([...globalToasts]);

  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    globalSetToasts?.([...globalToasts]);
  }, 5000);
}
