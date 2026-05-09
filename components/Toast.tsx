'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const colors: Record<string, string> = {
    success: 'border-l-[#10b981] bg-[#10b981]/10',
    info: 'border-l-[#6366f1] bg-[#6366f1]/10',
    warning: 'border-l-[#f59e0b] bg-[#f59e0b]/10',
    error: 'border-l-[#f43f5e] bg-[#f43f5e]/10',
  };

  const icons: Record<string, string> = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
  };

  const type = toast.type || 'info';
  const colorClass = colors[type];
  const icon = icons[type];

  return (
    <div
      className={`pointer-events-auto ${exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 glass-sm shadow-lg max-w-xs sm:max-w-sm ${colorClass}`}
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <span className="text-sm font-semibold">{icon}</span>
        <p className="text-sm text-[#f0f4ff]">{toast.message}</p>
      </div>
    </div>
  );
}
