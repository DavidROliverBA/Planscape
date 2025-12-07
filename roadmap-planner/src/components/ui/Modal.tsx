import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (closeOnEscape) {
          onClose();
        }
        // Prevent default to stop dialog from closing itself
        event.preventDefault();
      }
    },
    [onClose, closeOnEscape],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      dialog.addEventListener('keydown', handleEscape);
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }

    return () => {
      dialog.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDialogElement, MouseEvent>,
  ) => {
    if (closeOnOverlayClick && e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    // Keyboard handling is done via handleEscape in useEffect
    // This handler satisfies the a11y requirement for keyboard events alongside onClick
    if (e.key === 'Enter' || e.key === ' ') {
      // Do nothing - enter/space on dialog shouldn't trigger backdrop close
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent p-4 backdrop:bg-gray-500 backdrop:bg-opacity-75"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex min-h-full items-center justify-center">
        {/* Modal panel */}
        <div
          className={`
            relative bg-white rounded-lg shadow-xl
            transform transition-all
            w-full ${sizeStyles[size]}
          `}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}
