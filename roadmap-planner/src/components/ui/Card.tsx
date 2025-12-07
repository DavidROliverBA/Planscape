import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function CardSection({
  children,
  title,
  className = '',
}: CardSectionProps) {
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      {children}
    </div>
  );
}
