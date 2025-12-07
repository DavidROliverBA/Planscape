// DetailPanel - Contextual panel for viewing/editing selected items

import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';

interface DetailPanelProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DetailPanel({ children, title, subtitle }: DetailPanelProps) {
  const {
    detailPanelVisible,
    detailPanelDockPosition,
    detailPanelSize,
    closeDetailPanel,
    setDetailPanelDock,
    setDetailPanelSize,
  } = useAppStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailPanelVisible) {
        closeDetailPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailPanelVisible, closeDetailPanel]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const startPos = detailPanelDockPosition === 'right' ? e.clientX : e.clientY;
      const startSize = detailPanelSize;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        let delta: number;
        if (detailPanelDockPosition === 'right') {
          delta = startPos - e.clientX;
        } else {
          delta = startPos - e.clientY;
        }

        const minSize = 300;
        const maxSize = detailPanelDockPosition === 'right' ? 800 : 600;
        const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
        setDetailPanelSize(newSize);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [detailPanelDockPosition, detailPanelSize, setDetailPanelSize]
  );

  const toggleDockPosition = useCallback(() => {
    setDetailPanelDock(detailPanelDockPosition === 'right' ? 'bottom' : 'right');
  }, [detailPanelDockPosition, setDetailPanelDock]);

  if (!detailPanelVisible) {
    return null;
  }

  const isRight = detailPanelDockPosition === 'right';

  return (
    <div
      ref={panelRef}
      className={`
        bg-white shadow-lg flex flex-col
        ${isRight ? 'border-l border-gray-200' : 'border-t border-gray-200'}
      `}
      style={{
        [isRight ? 'width' : 'height']: detailPanelSize,
        minWidth: isRight ? 300 : undefined,
        minHeight: isRight ? undefined : 200,
      }}
    >
      {/* Resize handle */}
      <div
        className={`
          ${isRight ? 'absolute left-0 top-0 bottom-0 w-1 cursor-col-resize' : 'absolute left-0 right-0 top-0 h-1 cursor-row-resize'}
          hover:bg-primary-400 transition-colors z-10
        `}
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {/* Dock position toggle */}
          <button
            type="button"
            onClick={toggleDockPosition}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title={`Dock ${isRight ? 'bottom' : 'right'}`}
          >
            {isRight ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={closeDetailPanel}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// Hook for managing detail panel content
export function useDetailPanel() {
  const {
    selectedSystemId,
    selectedInitiativeId,
    selectedCapabilityId,
    openDetailPanel,
    closeDetailPanel,
    detailPanelVisible,
  } = useAppStore();

  const hasSelection =
    selectedSystemId !== null ||
    selectedInitiativeId !== null ||
    selectedCapabilityId !== null;

  // Auto-open panel when something is selected
  useEffect(() => {
    if (hasSelection && !detailPanelVisible) {
      openDetailPanel();
    }
  }, [hasSelection, detailPanelVisible, openDetailPanel]);

  return {
    hasSelection,
    selectedSystemId,
    selectedInitiativeId,
    selectedCapabilityId,
    isVisible: detailPanelVisible,
    open: openDetailPanel,
    close: closeDetailPanel,
  };
}
