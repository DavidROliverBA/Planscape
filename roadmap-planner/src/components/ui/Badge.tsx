import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-indigo-100 text-indigo-700',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  primary: 'bg-blue-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-indigo-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// Predefined badges for common status types
export function StatusBadge({
  status,
}: {
  status: 'Proposed' | 'Planned' | 'InProgress' | 'Complete' | 'Cancelled';
}) {
  const variants: Record<typeof status, BadgeVariant> = {
    Proposed: 'default',
    Planned: 'info',
    InProgress: 'primary',
    Complete: 'success',
    Cancelled: 'danger',
  };

  const labels: Record<typeof status, string> = {
    Proposed: 'Proposed',
    Planned: 'Planned',
    InProgress: 'In Progress',
    Complete: 'Complete',
    Cancelled: 'Cancelled',
  };

  return (
    <Badge variant={variants[status]} dot>
      {labels[status]}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
}: {
  priority: 'Must' | 'Should' | 'Could' | 'Wont';
}) {
  const variants: Record<typeof priority, BadgeVariant> = {
    Must: 'danger',
    Should: 'warning',
    Could: 'info',
    Wont: 'default',
  };

  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

export function CriticalityBadge({
  criticality,
}: {
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
}) {
  const variants: Record<typeof criticality, BadgeVariant> = {
    Critical: 'danger',
    High: 'warning',
    Medium: 'info',
    Low: 'default',
  };

  return <Badge variant={variants[criticality]}>{criticality}</Badge>;
}

export function LifecycleBadge({
  stage,
}: {
  stage: 'Discovery' | 'Development' | 'Production' | 'Sunset' | 'Retired';
}) {
  const variants: Record<typeof stage, BadgeVariant> = {
    Discovery: 'info',
    Development: 'primary',
    Production: 'success',
    Sunset: 'warning',
    Retired: 'default',
  };

  return <Badge variant={variants[stage]}>{stage}</Badge>;
}
