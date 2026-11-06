import React from 'react';
import { Check } from 'lucide-react';

export interface ToastProps {
  message: string;
  isVisible: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--color-bg-surface-elevated)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-success)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 18px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        zIndex: 9999,
        animation: 'toastSlide 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <Check size={16} color="var(--color-success)" />
      <span>{message}</span>
    </div>
  );
};
