// Coupling Mode Selector - Controls how dependencies cascade on timeline changes

import { type CouplingMode, useAppStore } from '../../stores/appStore';

const modes: { value: CouplingMode; label: string; description: string }[] = [
  {
    value: 'locked',
    label: 'Locked',
    description: 'Automatically move dependent initiatives',
  },
  {
    value: 'guided',
    label: 'Guided',
    description: 'Ask before cascading changes',
  },
  {
    value: 'unlocked',
    label: 'Unlocked',
    description: 'Move freely, show violations',
  },
];

export function CouplingModeSelector() {
  const couplingMode = useAppStore((state) => state.couplingMode);
  const setCouplingMode = useAppStore((state) => state.setCouplingMode);

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => setCouplingMode(mode.value)}
          title={mode.description}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            couplingMode === mode.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export function DependencyLinesToggle() {
  const showDependencyLines = useAppStore((state) => state.showDependencyLines);
  const setShowDependencyLines = useAppStore(
    (state) => state.setShowDependencyLines,
  );

  return (
    <button
      type="button"
      onClick={() => setShowDependencyLines(!showDependencyLines)}
      title={
        showDependencyLines ? 'Hide dependency lines' : 'Show dependency lines'
      }
      className={`p-2 rounded-md transition-colors ${
        showDependencyLines
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </button>
  );
}
