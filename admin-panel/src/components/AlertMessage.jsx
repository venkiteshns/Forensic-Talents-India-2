import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AlertMessage({ message, type = 'error', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />,
    error: <XCircle className="w-5 h-5 shrink-0 mt-0.5" />,
    info: <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />,
  };

  return (
    <div className={`rounded-md px-4 py-3 flex gap-3 items-start mb-4 animate-in fade-in zoom-in-95 duration-300 ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium pt-0.5">{message}</p>
    </div>
  );
}
