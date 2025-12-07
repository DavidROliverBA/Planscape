import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      capabilities: [],
      systems: [],
      resourcePools: [],
      resources: [],
      constraints: [],
      scenarios: [],
      initiatives: [],
      financialPeriods: [],
      activeScenarioId: 'baseline',
      selectedSystemId: null,
      selectedInitiativeId: null,
      selectedCapabilityId: null,
      activeNavigation: 'systems',
      zoomLevel: 'Year',
      isLoading: false,
      isInitialised: false,
    });
  });

  describe('initialise', () => {
    it('should set isInitialised to true after initialisation', async () => {
      const { initialise } = useAppStore.getState();

      await act(async () => {
        await initialise();
      });

      const state = useAppStore.getState();
      expect(state.isInitialised).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should create baseline scenario on initialisation', async () => {
      const { initialise } = useAppStore.getState();

      await act(async () => {
        await initialise();
      });

      const state = useAppStore.getState();
      expect(state.scenarios).toHaveLength(1);
      expect(state.scenarios[0].id).toBe('baseline');
      expect(state.scenarios[0].isBaseline).toBe(true);
    });
  });

  describe('setActiveScenario', () => {
    it('should update the active scenario ID', () => {
      const { setActiveScenario } = useAppStore.getState();

      act(() => {
        setActiveScenario('test-scenario-id');
      });

      const state = useAppStore.getState();
      expect(state.activeScenarioId).toBe('test-scenario-id');
    });
  });

  describe('selectSystem', () => {
    it('should set the selected system ID', () => {
      const { selectSystem } = useAppStore.getState();

      act(() => {
        selectSystem('system-123');
      });

      expect(useAppStore.getState().selectedSystemId).toBe('system-123');
    });

    it('should allow clearing the selection with null', () => {
      const { selectSystem } = useAppStore.getState();

      act(() => {
        selectSystem('system-123');
      });
      act(() => {
        selectSystem(null);
      });

      expect(useAppStore.getState().selectedSystemId).toBeNull();
    });
  });

  describe('selectInitiative', () => {
    it('should set the selected initiative ID', () => {
      const { selectInitiative } = useAppStore.getState();

      act(() => {
        selectInitiative('initiative-456');
      });

      expect(useAppStore.getState().selectedInitiativeId).toBe(
        'initiative-456',
      );
    });
  });

  describe('selectCapability', () => {
    it('should set the selected capability ID', () => {
      const { selectCapability } = useAppStore.getState();

      act(() => {
        selectCapability('capability-789');
      });

      expect(useAppStore.getState().selectedCapabilityId).toBe(
        'capability-789',
      );
    });
  });

  describe('setActiveNavigation', () => {
    it('should update the active navigation item', () => {
      const { setActiveNavigation } = useAppStore.getState();

      act(() => {
        setActiveNavigation('initiatives');
      });

      expect(useAppStore.getState().activeNavigation).toBe('initiatives');
    });

    it('should accept all valid navigation items', () => {
      const { setActiveNavigation } = useAppStore.getState();
      const navItems = [
        'systems',
        'capabilities',
        'initiatives',
        'resources',
        'scenarios',
        'settings',
      ] as const;

      for (const nav of navItems) {
        act(() => {
          setActiveNavigation(nav);
        });
        expect(useAppStore.getState().activeNavigation).toBe(nav);
      }
    });
  });

  describe('setZoomLevel', () => {
    it('should update the zoom level', () => {
      const { setZoomLevel } = useAppStore.getState();

      act(() => {
        setZoomLevel('Quarter');
      });

      expect(useAppStore.getState().zoomLevel).toBe('Quarter');
    });

    it('should accept all valid zoom levels', () => {
      const { setZoomLevel } = useAppStore.getState();
      const zoomLevels = [
        'Quarter',
        'HalfYear',
        'Year',
        '3Years',
        '5Years',
      ] as const;

      for (const level of zoomLevels) {
        act(() => {
          setZoomLevel(level);
        });
        expect(useAppStore.getState().zoomLevel).toBe(level);
      }
    });
  });

  describe('data setters', () => {
    it('should set systems array', () => {
      const { setSystems } = useAppStore.getState();
      const mockSystems = [
        {
          id: 'sys-1',
          name: 'Test System',
          lifecycleStage: 'Production' as const,
          criticality: 'High' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        setSystems(mockSystems);
      });

      expect(useAppStore.getState().systems).toEqual(mockSystems);
    });

    it('should set capabilities array', () => {
      const { setCapabilities } = useAppStore.getState();
      const mockCapabilities = [
        {
          id: 'cap-1',
          name: 'Test Capability',
          type: 'Business' as const,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        setCapabilities(mockCapabilities);
      });

      expect(useAppStore.getState().capabilities).toEqual(mockCapabilities);
    });

    it('should set initiatives array', () => {
      const { setInitiatives } = useAppStore.getState();
      const mockInitiatives = [
        {
          id: 'init-1',
          name: 'Test Initiative',
          type: 'New' as const,
          status: 'Proposed' as const,
          priority: 'Should' as const,
          scenarioId: 'baseline',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        setInitiatives(mockInitiatives);
      });

      expect(useAppStore.getState().initiatives).toEqual(mockInitiatives);
    });

    it('should set scenarios array', () => {
      const { setScenarios } = useAppStore.getState();
      const mockScenarios = [
        {
          id: 'scenario-1',
          name: 'What If Scenario',
          isBaseline: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        setScenarios(mockScenarios);
      });

      expect(useAppStore.getState().scenarios).toEqual(mockScenarios);
    });
  });
});
