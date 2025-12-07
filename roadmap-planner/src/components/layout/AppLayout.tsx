// AppLayout - Master layout component combining all panels

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Sidebar } from './Sidebar';
import { NavigatorPanel } from './NavigatorPanel';
import { DetailPanel, useDetailPanel } from './DetailPanel';
import { MainCanvas } from './MainCanvas';

// Keyboard shortcut handler
function useKeyboardShortcuts() {
  const {
    toggleNavigator,
    toggleDetailPanel,
    setActiveView,
    activeView,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;

      if (!isMod) return;

      switch (e.key) {
        case 'b':
        case 'B':
          e.preventDefault();
          toggleNavigator();
          break;
        case '1':
          e.preventDefault();
          setActiveView('timeline');
          break;
        case '2':
          e.preventDefault();
          setActiveView('resources');
          break;
        case '3':
          e.preventDefault();
          setActiveView('cost');
          break;
        case '4':
          e.preventDefault();
          setActiveView('dependencies');
          break;
        case 'd':
        case 'D':
          if (e.shiftKey) {
            e.preventDefault();
            toggleDetailPanel();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleNavigator, toggleDetailPanel, setActiveView, activeView]);
}

// Detail panel content based on selection
function DetailPanelContent() {
  const { selectedSystemId, selectedInitiativeId, selectedCapabilityId } = useDetailPanel();
  const { systems, initiatives, capabilities } = useAppStore();

  if (selectedInitiativeId) {
    const initiative = initiatives.find((i) => i.id === selectedInitiativeId);
    if (initiative) {
      return (
        <DetailPanel title={initiative.name} subtitle="Initiative">
          <div className="p-4">
            <p className="text-sm text-gray-600">
              Initiative details will be shown here with tabbed interface.
            </p>
            {initiative.description && (
              <p className="mt-2 text-sm text-gray-700">{initiative.description}</p>
            )}
          </div>
        </DetailPanel>
      );
    }
  }

  if (selectedSystemId) {
    const system = systems.find((s) => s.id === selectedSystemId);
    if (system) {
      return (
        <DetailPanel title={system.name} subtitle="System">
          <div className="p-4">
            <p className="text-sm text-gray-600">
              System details will be shown here with tabbed interface.
            </p>
            {system.description && (
              <p className="mt-2 text-sm text-gray-700">{system.description}</p>
            )}
          </div>
        </DetailPanel>
      );
    }
  }

  if (selectedCapabilityId) {
    const capability = capabilities.find((c) => c.id === selectedCapabilityId);
    if (capability) {
      return (
        <DetailPanel title={capability.name} subtitle="Capability">
          <div className="p-4">
            <p className="text-sm text-gray-600">
              Capability details will be shown here.
            </p>
            {capability.description && (
              <p className="mt-2 text-sm text-gray-700">{capability.description}</p>
            )}
          </div>
        </DetailPanel>
      );
    }
  }

  return null;
}

export function AppLayout() {
  const { detailPanelDockPosition, detailPanelVisible } = useAppStore();

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  const isDetailRight = detailPanelDockPosition === 'right';

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left sidebar - Navigation */}
      <Sidebar />

      {/* Navigator panel - Capabilities & Resources tree */}
      <NavigatorPanel />

      {/* Main content area with optional detail panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main canvas and right-docked detail panel */}
        <div className="flex-1 flex overflow-hidden">
          <MainCanvas />

          {/* Right-docked detail panel */}
          {detailPanelVisible && isDetailRight && <DetailPanelContent />}
        </div>

        {/* Bottom-docked detail panel */}
        {detailPanelVisible && !isDetailRight && <DetailPanelContent />}
      </div>
    </div>
  );
}
