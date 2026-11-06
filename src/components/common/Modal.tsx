import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '640px'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
        zIndex: 9000,
        animation: 'fadeIn 150ms ease-out'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-surface-elevated)'
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  margin: 0
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px',
                  marginBottom: 0
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              display: 'flex',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          style={{
            padding: 'var(--space-lg)',
            overflowY: 'auto'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
