// TabbedPanel - Reusable tabbed container for detail views

import { useCallback, useRef, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

interface TabbedPanelProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  defaultTab?: string;
  className?: string;
  contentClassName?: string;
}

export function TabbedPanel({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  defaultTab,
  className = '',
  contentClassName = '',
}: TabbedPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || ''
  );
  const tabsRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = useCallback(
    (tabId: string) => {
      setInternalActiveTab(tabId);
      onTabChange?.(tabId);
    },
    [onTabChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      handleTabChange(tabs[newIndex].id);

      // Focus the new tab
      const tabElements = tabsRef.current?.querySelectorAll('[role="tab"]');
      if (tabElements?.[newIndex]) {
        (tabElements[newIndex] as HTMLElement).focus();
      }
    },
    [tabs, activeTab, handleTabChange]
  );

  const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tab bar */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Tabs"
        className="flex border-b border-gray-200 bg-gray-50"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                border-b-2 -mb-px transition-colors
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500
                ${isActive
                  ? 'text-primary-700 border-primary-500 bg-white'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {tab.icon && (
                <span className="w-4 h-4 flex items-center justify-center">
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    ml-1 px-1.5 py-0.5 text-xs rounded-full
                    ${isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className={`flex-1 ${contentClassName}`}
      >
        {activeTabContent}
      </div>
    </div>
  );
}

// Utility to create tab configuration
export function createTab(
  id: string,
  label: string,
  content: React.ReactNode,
  options?: { icon?: React.ReactNode; badge?: string | number }
): Tab {
  return {
    id,
    label,
    content,
    icon: options?.icon,
    badge: options?.badge,
  };
}
