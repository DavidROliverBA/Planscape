import {
  capabilities as capabilitiesDb,
  constraints as constraintsDb,
  financialPeriods as periodsDb,
  initiatives as initiativesDb,
  resourcePools as poolsDb,
  resources as resourcesDb,
  scenarios as scenariosDb,
  systems as systemsDb,
} from '@/lib/db';
import { storeLogger as log } from '@/lib/logger';
import type {
  Capability,
  Constraint,
  FinancialPeriod,
  Initiative,
  NavigationItem,
  Resource,
  ResourcePool,
  Scenario,
  System,
  ZoomLevel,
} from '@/lib/types';
import { create } from 'zustand';

export type CouplingMode = 'locked' | 'unlocked' | 'guided';
export type ActiveView = 'timeline' | 'resources' | 'cost' | 'dependencies';
export type DetailPanelDock = 'bottom' | 'right';

interface AppState {
  // Entity data
  capabilities: Capability[];
  systems: System[];
  resourcePools: ResourcePool[];
  resources: Resource[];
  constraints: Constraint[];
  scenarios: Scenario[];
  initiatives: Initiative[];
  financialPeriods: FinancialPeriod[];

  // UI state
  activeScenarioId: string;
  selectedSystemId: string | null;
  selectedInitiativeId: string | null;
  selectedCapabilityId: string | null;
  activeNavigation: NavigationItem;
  zoomLevel: ZoomLevel;
  isLoading: boolean;
  isInitialised: boolean;

  // Consequence engine settings
  couplingMode: CouplingMode;
  showDependencyLines: boolean;

  // Panel state (persisted)
  navigatorVisible: boolean;
  navigatorWidth: number;
  detailPanelVisible: boolean;
  detailPanelDockPosition: DetailPanelDock;
  detailPanelSize: number;
  activeView: ActiveView;

  // Actions
  initialise: () => Promise<void>;
  setActiveScenario: (scenarioId: string) => void;
  selectSystem: (systemId: string | null) => void;
  selectInitiative: (initiativeId: string | null) => void;
  selectCapability: (capabilityId: string | null) => void;
  setActiveNavigation: (nav: NavigationItem) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setCouplingMode: (mode: CouplingMode) => void;
  setShowDependencyLines: (show: boolean) => void;

  // Panel actions
  toggleNavigator: () => void;
  setNavigatorWidth: (width: number) => void;
  toggleDetailPanel: () => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  setDetailPanelDock: (position: DetailPanelDock) => void;
  setDetailPanelSize: (size: number) => void;
  setActiveView: (view: ActiveView) => void;

  // Data setters (will be used by data loading in Phase 1)
  setCapabilities: (capabilities: Capability[]) => void;
  setSystems: (systems: System[]) => void;
  setResourcePools: (pools: ResourcePool[]) => void;
  setResources: (resources: Resource[]) => void;
  setConstraints: (constraints: Constraint[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setInitiatives: (initiatives: Initiative[]) => void;
  setFinancialPeriods: (periods: FinancialPeriod[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial entity data
  capabilities: [],
  systems: [],
  resourcePools: [],
  resources: [],
  constraints: [],
  scenarios: [],
  initiatives: [],
  financialPeriods: [],

  // Initial UI state
  activeScenarioId: 'baseline',
  selectedSystemId: null,
  selectedInitiativeId: null,
  selectedCapabilityId: null,
  activeNavigation: 'timeline',
  zoomLevel: 'Year',
  isLoading: false,
  isInitialised: false,

  // Consequence engine settings
  couplingMode: 'guided',
  showDependencyLines: true,

  // Panel state
  navigatorVisible: true,
  navigatorWidth: 280,
  detailPanelVisible: false,
  detailPanelDockPosition: 'right',
  detailPanelSize: 400,
  activeView: 'timeline',

  // Actions
  initialise: async () => {
    log.info('initialise called');
    set({ isLoading: true });

    try {
      // Load all data from SQLite in parallel
      log.debug('Loading all data from SQLite...');
      const [
        capabilities,
        systems,
        resourcePools,
        resources,
        constraints,
        scenarios,
        initiatives,
        financialPeriods,
      ] = await Promise.all([
        capabilitiesDb.getAll(),
        systemsDb.getAll(),
        poolsDb.getAll(),
        resourcesDb.getAll(),
        constraintsDb.getAll(),
        scenariosDb.getAll(),
        initiativesDb.getAll(),
        periodsDb.getAll(),
      ]);

      log.info('Data loaded from SQLite', {
        capabilities: capabilities.length,
        systems: systems.length,
        resourcePools: resourcePools.length,
        resources: resources.length,
        constraints: constraints.length,
        scenarios: scenarios.length,
        initiatives: initiatives.length,
        financialPeriods: financialPeriods.length,
      });

      // Ensure baseline scenario exists
      let loadedScenarios = scenarios;
      if (!loadedScenarios.some((s) => s.isBaseline)) {
        log.info('Creating baseline scenario');
        const baseline = await scenariosDb.create({
          name: 'Baseline',
          description: 'The current known state and committed plans',
          isBaseline: true,
        });
        loadedScenarios = [baseline, ...loadedScenarios];
      }

      const activeScenarioId =
        loadedScenarios.find((s) => s.isBaseline)?.id ?? 'baseline';

      log.debug('Setting store state', { activeScenarioId });

      set({
        capabilities,
        systems,
        resourcePools,
        resources,
        constraints,
        scenarios: loadedScenarios,
        initiatives,
        financialPeriods,
        activeScenarioId,
        isLoading: false,
        isInitialised: true,
      });

      log.info('Store initialised successfully');
    } catch (error) {
      log.error('Failed to initialise app', {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
      });
      // Set minimal state to allow the app to function
      set({
        scenarios: [
          {
            id: 'baseline',
            name: 'Baseline',
            description: 'The current known state and committed plans',
            isBaseline: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
        isInitialised: true,
      });
    }
  },

  setActiveScenario: (scenarioId) => set({ activeScenarioId: scenarioId }),

  selectSystem: (systemId) => set({ selectedSystemId: systemId }),

  selectInitiative: (initiativeId) =>
    set({ selectedInitiativeId: initiativeId }),

  selectCapability: (capabilityId) =>
    set({ selectedCapabilityId: capabilityId }),

  setActiveNavigation: (nav) => set({ activeNavigation: nav }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  setCouplingMode: (mode) => set({ couplingMode: mode }),

  setShowDependencyLines: (show) => set({ showDependencyLines: show }),

  // Panel actions
  toggleNavigator: () =>
    set((state) => ({ navigatorVisible: !state.navigatorVisible })),
  setNavigatorWidth: (width) => set({ navigatorWidth: width }),
  toggleDetailPanel: () =>
    set((state) => ({ detailPanelVisible: !state.detailPanelVisible })),
  openDetailPanel: () => set({ detailPanelVisible: true }),
  closeDetailPanel: () => set({ detailPanelVisible: false }),
  setDetailPanelDock: (position) => set({ detailPanelDockPosition: position }),
  setDetailPanelSize: (size) => set({ detailPanelSize: size }),
  setActiveView: (view) => set({ activeView: view }),

  // Data setters
  setCapabilities: (capabilities) => set({ capabilities }),
  setSystems: (systems) => set({ systems }),
  setResourcePools: (pools) => set({ resourcePools: pools }),
  setResources: (resources) => set({ resources }),
  setConstraints: (constraints) => set({ constraints }),
  setScenarios: (scenarios) => set({ scenarios }),
  setInitiatives: (initiatives) => set({ initiatives }),
  setFinancialPeriods: (periods) => set({ financialPeriods: periods }),
}));
