// NavigatorPanel - Collapsible left panel with capability/resource tree views

import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import type { Capability, ResourcePool } from '@/lib/types';

interface TreeNodeProps {
  label: string;
  children?: React.ReactNode;
  level: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

function TreeNode({
  label,
  children,
  level,
  isExpanded,
  onToggle,
  onClick,
  isSelected,
  icon,
  badge,
}: TreeNodeProps) {
  const hasChildren = !!children;

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer
          hover:bg-gray-100 transition-colors
          ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        role="treeitem"
        tabIndex={0}
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
        <span className="flex-1 text-sm truncate">{label}</span>
        {badge !== undefined && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
            {badge}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div role="group">{children}</div>
      )}
    </div>
  );
}

interface CapabilityTreeProps {
  capabilities: Capability[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filter: string;
}

function CapabilityTree({ capabilities, selectedId, onSelect, filter }: CapabilityTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredCapabilities = useMemo(() => {
    if (!filter) return capabilities;
    const lowerFilter = filter.toLowerCase();
    return capabilities.filter((c) =>
      c.name.toLowerCase().includes(lowerFilter)
    );
  }, [capabilities, filter]);

  const rootCapabilities = useMemo(
    () => filteredCapabilities.filter((c) => !c.parentId),
    [filteredCapabilities]
  );

  const getChildren = useCallback(
    (parentId: string) => filteredCapabilities.filter((c) => c.parentId === parentId),
    [filteredCapabilities]
  );

  const renderCapability = (capability: Capability, level: number): React.ReactNode => {
    const children = getChildren(capability.id);
    const hasChildren = children.length > 0;

    return (
      <TreeNode
        key={capability.id}
        label={capability.name}
        level={level}
        isExpanded={expandedIds.has(capability.id)}
        onToggle={() => toggleExpanded(capability.id)}
        onClick={() => onSelect(selectedId === capability.id ? null : capability.id)}
        isSelected={selectedId === capability.id}
        icon={
          <span className="text-xs">
            {capability.type === 'Business' ? '🎯' : '⚙️'}
          </span>
        }
      >
        {hasChildren && children.map((child) => renderCapability(child, level + 1))}
      </TreeNode>
    );
  };

  if (rootCapabilities.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-4 py-2">
        {filter ? 'No matching capabilities' : 'No capabilities defined'}
      </p>
    );
  }

  return (
    <div role="tree" aria-label="Capabilities">
      {rootCapabilities.map((cap) => renderCapability(cap, 0))}
    </div>
  );
}

interface ResourcePoolListProps {
  pools: ResourcePool[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filter: string;
}

function ResourcePoolList({ pools, selectedId, onSelect, filter }: ResourcePoolListProps) {
  const filteredPools = useMemo(() => {
    if (!filter) return pools;
    const lowerFilter = filter.toLowerCase();
    return pools.filter((p) =>
      p.name.toLowerCase().includes(lowerFilter)
    );
  }, [pools, filter]);

  if (filteredPools.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-4 py-2">
        {filter ? 'No matching resource pools' : 'No resource pools defined'}
      </p>
    );
  }

  return (
    <div role="list" aria-label="Resource Pools">
      {filteredPools.map((pool) => (
        <div
          key={pool.id}
          className={`
            flex items-center gap-2 py-1.5 px-4 cursor-pointer
            hover:bg-gray-100 transition-colors
            ${selectedId === pool.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
          `}
          onClick={() => onSelect(selectedId === pool.id ? null : pool.id)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(selectedId === pool.id ? null : pool.id)}
          role="listitem"
          tabIndex={0}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: pool.colour ?? '#6B7280' }}
          />
          <span className="text-sm flex-1 truncate">{pool.name}</span>
          <span className="text-xs text-gray-500">
            {pool.capacityPerPeriod ?? 0} {pool.capacityUnit}/{pool.periodType}
          </span>
        </div>
      ))}
    </div>
  );
}

type NavigatorSection = 'capabilities' | 'resources';

export function NavigatorPanel() {
  const {
    capabilities,
    resourcePools,
    selectedCapabilityId,
    selectCapability,
    navigatorVisible,
    navigatorWidth,
    setNavigatorWidth,
    toggleNavigator,
  } = useAppStore();

  const [filter, setFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<NavigatorSection>>(
    new Set(['capabilities', 'resources'])
  );
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const toggleSection = useCallback((section: NavigatorSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = navigatorWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(500, startWidth + delta));
      setNavigatorWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [navigatorWidth, setNavigatorWidth]);

  if (!navigatorVisible) {
    return (
      <button
        type="button"
        onClick={toggleNavigator}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-l-0 border-gray-200 rounded-r-md p-1 hover:bg-gray-50"
        title="Show navigator (Cmd+B)"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="bg-white border-r border-gray-200 flex flex-col h-full relative"
      style={{ width: navigatorWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-700">Navigator</h2>
        <button
          type="button"
          onClick={toggleNavigator}
          className="p-1 hover:bg-gray-100 rounded"
          title="Hide navigator (Cmd+B)"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Filter */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Capabilities Section */}
        <div className="border-b border-gray-200">
          <button
            type="button"
            onClick={() => toggleSection('capabilities')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedSections.has('capabilities') ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Capabilities</span>
            </div>
            <span className="text-xs text-gray-500">{capabilities.length}</span>
          </button>
          {expandedSections.has('capabilities') && (
            <div className="pb-2">
              <CapabilityTree
                capabilities={capabilities}
                selectedId={selectedCapabilityId}
                onSelect={selectCapability}
                filter={filter}
              />
            </div>
          )}
        </div>

        {/* Resource Pools Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('resources')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedSections.has('resources') ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Resource Pools</span>
            </div>
            <span className="text-xs text-gray-500">{resourcePools.length}</span>
          </button>
          {expandedSections.has('resources') && (
            <div className="pb-2">
              <ResourcePoolList
                pools={resourcePools}
                selectedId={selectedPoolId}
                onSelect={setSelectedPoolId}
                filter={filter}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-400 transition-colors ${
          isResizing ? 'bg-primary-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
