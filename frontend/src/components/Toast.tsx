import React, { useEffect } from 'react';
import '../styles/toast.css';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  durationMs?: number;
};

export default function Toast({ message, type = 'info', onClose, durationMs = 2500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs]);

  return (
    <div className={`toast-root toast-${type}`} role="status" aria-live="polite">
      <span className={`toast-icon ${type}`}>{type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" aria-label="Fechar" onClick={onClose}>×</button>
    </div>
  );
}