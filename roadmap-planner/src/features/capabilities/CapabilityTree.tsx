import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  LoadingInline,
  NoCapabilitiesEmptyState,
} from '../../components/ui';
import { capabilities as capabilitiesDb } from '../../lib/db';
import type { Capability } from '../../lib/types';

interface CapabilityTreeProps {
  onSelect: (capability: Capability) => void;
  onAdd: (parentId?: string) => void;
  selectedId?: string | null;
}

interface TreeNode extends Capability {
  children: TreeNode[];
  isExpanded?: boolean;
}

function buildTree(capabilities: Capability[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create all nodes
  for (const cap of capabilities) {
    map.set(cap.id, { ...cap, children: [], isExpanded: true });
  }

  // Second pass: build tree structure
  for (const cap of capabilities) {
    const node = map.get(cap.id);
    if (!node) continue;
    if (cap.parentId) {
      const parent = map.get(cap.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort by sortOrder
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of nodes) {
      sortNodes(node.children);
    }
    return nodes;
  }

  return sortNodes(roots);
}

export function CapabilityTree({
  onSelect,
  onAdd,
  selectedId,
}: CapabilityTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadCapabilities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await capabilitiesDb.getAll();
      const treeData = buildTree(data);
      setTree(treeData);
      // Expand all by default
      const allIds = new Set(data.map((c) => c.id));
      setExpandedIds(allIds);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load capabilities',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return <LoadingInline message="Loading capabilities..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadCapabilities}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (tree.length === 0) {
    return <NoCapabilitiesEmptyState onAdd={() => onAdd()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Capabilities</h2>
        <Button size="sm" onClick={() => onAdd()}>
          Add Capability
        </Button>
      </div>

      <div className="space-y-1">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            selectedId={selectedId}
            onToggle={toggleExpand}
            onSelect={onSelect}
            onAddChild={onAdd}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onSelect: (capability: Capability) => void;
  onAddChild: (parentId: string) => void;
}

function TreeNodeItem({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onAddChild,
}: TreeNodeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <Card
        padding="sm"
        className={`cursor-pointer hover:border-blue-300 transition-colors ${
          isSelected ? 'border-blue-500 ring-1 ring-blue-500' : ''
        }`}
        style={{ marginLeft: `${depth * 1.5}rem` }}
        onClick={() => onSelect(node)}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
          {!hasChildren && <div className="w-5" />}

          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.colour ?? '#6B7280' }}
          />

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate block">
              {node.name}
            </span>
          </div>

          <Badge
            variant={node.type === 'Business' ? 'primary' : 'info'}
            size="sm"
          >
            {node.type}
          </Badge>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Add child capability"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </Card>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
