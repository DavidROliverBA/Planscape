// MainCanvas - Main content area with enhanced header

import { CapabilitiesPage } from '@/features/capabilities';
import { CostProfile } from '@/features/cost';
import { DependencyGraph } from '@/features/dependencies';
import { InitiativesPage } from '@/features/initiatives';
import { ResourcesPage, ResourceHeatmap } from '@/features/resources';
import { ScenariosPage } from '@/features/scenarios';
import { SettingsPage } from '@/features/settings';
import { SystemsPage } from '@/features/systems';
import { Timeline } from '@/features/timeline';
import { CouplingModeSelector, DependencyLinesToggle } from '@/components/ui';
import type { ZoomLevel } from '@/lib/types';
import { useAppStore, type ActiveView } from '@/stores/appStore';

const zoomLevels: { value: ZoomLevel; label: string }[] = [
  { value: 'Quarter', label: 'Quarter' },
  { value: 'HalfYear', label: 'Half Year' },
  { value: 'Year', label: 'Year' },
  { value: '3Years', label: '3 Years' },
  { value: '5Years', label: '5 Years' },
  { value: '10Year', label: '10 Years' },
];

const viewTabs: { id: ActiveView; label: string; icon: string }[] = [
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'resources', label: 'Resources', icon: '👥' },
  { id: 'cost', label: 'Cost', icon: '💰' },
  { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
];

export function MainCanvas() {
  const {
    activeNavigation,
    scenarios,
    activeScenarioId,
    setActiveScenario,
    zoomLevel,
    setZoomLevel,
    activeView,
    setActiveView,
  } = useAppStore();

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const isBaseline = activeScenario?.isBaseline ?? true;

  const renderTimelineView = () => {
    switch (activeView) {
      case 'timeline':
        return <Timeline />;
      case 'resources':
        return <ResourceHeatmap />;
      case 'cost':
        return <CostProfile />;
      case 'dependencies':
        return <DependencyGraph />;
      default:
        return <Timeline />;
    }
  };

  const renderContent = () => {
    switch (activeNavigation) {
      case 'timeline':
        return renderTimelineView();
      case 'systems':
        return <SystemsPage />;
      case 'capabilities':
        return <CapabilitiesPage />;
      case 'initiatives':
        return <InitiativesPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'scenarios':
        return <ScenariosPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Timeline />;
    }
  };

  // Timeline, Settings and Scenarios pages have their own headers
  const showHeader =
    activeNavigation !== 'settings' &&
    activeNavigation !== 'scenarios';

  // Show view tabs only on timeline view
  const showViewTabs = activeNavigation === 'timeline';

  // Show coupling mode on timeline
  const showCouplingMode = activeNavigation === 'timeline';

  const scrollToToday = () => {
    // Dispatch custom event for timeline to handle
    window.dispatchEvent(new CustomEvent('timeline:scrollToToday'));
  };

  return (
    <main className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      {showHeader && (
        <header className="bg-white border-b border-gray-200 px-4 py-2">
          {/* Top row: Scenario selector and controls */}
          <div className="flex items-center justify-between">
            {/* Left side: Scenario selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  id="scenario-select"
                  value={activeScenarioId}
                  onChange={(e) => setActiveScenario(e.target.value)}
                  className={`
                    text-sm py-1.5 px-3 rounded-md border font-medium
                    ${isBaseline
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                  `}
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.isBaseline ? '📍 ' : '⚡ '}{scenario.name}
                    </option>
                  ))}
                </select>

                {!isBaseline && (
                  <button
                    type="button"
                    onClick={() => {
                      const baseline = scenarios.find((s) => s.isBaseline);
                      if (baseline) setActiveScenario(baseline.id);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    Return to Baseline
                  </button>
                )}
              </div>
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center gap-3">
              {/* Coupling mode selector */}
              {showCouplingMode && (
                <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
                  <CouplingModeSelector />
                  <DependencyLinesToggle />
                </div>
              )}

              {/* Today button */}
              {showViewTabs && (
                <button
                  type="button"
                  onClick={scrollToToday}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Today
                </button>
              )}

              {/* Zoom level selector */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="zoom-select"
                  className="text-xs text-gray-500"
                >
                  Zoom:
                </label>
                <select
                  id="zoom-select"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(e.target.value as ZoomLevel)}
                  className="text-sm py-1 px-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {zoomLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export placeholder */}
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Export (coming soon)"
                disabled
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          </div>

          {/* View tabs row (only on timeline) */}
          {showViewTabs && (
            <div className="flex items-center gap-1 mt-2 -mb-2">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md
                    transition-colors border-b-2
                    ${activeView === tab.id
                      ? 'text-primary-700 border-primary-500 bg-primary-50'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </main>
  );
}
