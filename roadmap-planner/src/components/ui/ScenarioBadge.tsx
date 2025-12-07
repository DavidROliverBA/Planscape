// ScenarioBadge - Shows current scenario context with visual indicator

import { useAppStore } from '@/stores/appStore';

interface ScenarioBadgeProps {
  /** Optional click handler - defaults to navigating to scenarios page */
  onClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the full name or just the indicator */
  compact?: boolean;
}

export function ScenarioBadge({
  onClick,
  size = 'md',
  compact = false,
}: ScenarioBadgeProps) {
  const { scenarios, activeScenarioId, setActiveNavigation } = useAppStore();

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const isBaseline = activeScenario?.isBaseline ?? true;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setActiveNavigation('scenarios');
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  if (isBaseline) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          bg-green-100 text-green-800 hover:bg-green-200
          transition-colors cursor-pointer
          ${sizeClasses[size]}
        `}
        title="Currently viewing baseline scenario"
      >
        <span>📍</span>
        {!compact && <span>Baseline</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        bg-amber-100 text-amber-800 hover:bg-amber-200
        transition-colors cursor-pointer
        ${sizeClasses[size]}
      `}
      title={`Currently viewing scenario: ${activeScenario?.name}`}
    >
      <span>⚡</span>
      {!compact && <span className="max-w-32 truncate">{activeScenario?.name}</span>}
    </button>
  );
}
