// Panel - Sliding/docking panel container

import { useCallback, useEffect, useRef, useState } from 'react';

export type PanelPosition = 'left' | 'right' | 'bottom';

interface PanelProps {
  position: PanelPosition;
  size: number;
  minSize?: number;
  maxSize?: number;
  isOpen: boolean;
  onClose: () => void;
  onResize?: (size: number) => void;
  title?: string;
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({
  position,
  size,
  minSize = 200,
  maxSize = 800,
  isOpen,
  onClose,
  onResize,
  title,
  closeOnClickOutside = false,
  showCloseButton = true,
  headerActions,
  children,
  className = '',
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState(size);

  // Update size when prop changes
  useEffect(() => {
    setCurrentSize(size);
  }, [size]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickOutside, isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!onResize) return;

      e.preventDefault();
      setIsResizing(true);

      const startPos = position === 'bottom' ? e.clientY : e.clientX;
      const startSize = currentSize;

      const handleMouseMove = (e: MouseEvent) => {
        let delta: number;

        switch (position) {
          case 'left':
            delta = e.clientX - startPos;
            break;
          case 'right':
            delta = startPos - e.clientX;
            break;
          case 'bottom':
            delta = startPos - e.clientY;
            break;
        }

        const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
        setCurrentSize(newSize);
        onResize(newSize);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [position, currentSize, minSize, maxSize, onResize]
  );

  if (!isOpen) return null;

  const isHorizontal = position === 'bottom';
  const resizeHandlePosition = {
    left: 'right-0 top-0 bottom-0 w-1 cursor-col-resize',
    right: 'left-0 top-0 bottom-0 w-1 cursor-col-resize',
    bottom: 'top-0 left-0 right-0 h-1 cursor-row-resize',
  }[position];

  const panelPosition = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    bottom: 'left-0 right-0 bottom-0',
  }[position];

  const panelStyle = {
    [isHorizontal ? 'height' : 'width']: currentSize,
  };

  return (
    <div
      ref={panelRef}
      className={`
        fixed ${panelPosition} z-40
        bg-white shadow-xl border-gray-200
        ${position === 'left' ? 'border-r' : ''}
        ${position === 'right' ? 'border-l' : ''}
        ${position === 'bottom' ? 'border-t' : ''}
        flex flex-col
        ${className}
      `}
      style={panelStyle}
    >
      {/* Resize handle */}
      {onResize && (
        <div
          className={`
            absolute ${resizeHandlePosition}
            hover:bg-primary-400 transition-colors z-10
            ${isResizing ? 'bg-primary-500' : ''}
          `}
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Header */}
      {(title || showCloseButton || headerActions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {title && (
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          )}
          <div className="flex items-center gap-2">
            {headerActions}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Close (Esc)"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// Backdrop component for modal-like panels
export function PanelBackdrop({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
