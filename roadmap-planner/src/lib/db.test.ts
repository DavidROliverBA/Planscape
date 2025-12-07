import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Database module - must be hoisted before imports
const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
    ),
  },
}));

// Now import after the mock is set up
import {
  capabilities,
  constraints,
  db,
  financialPeriods,
  getDb,
  initDb,
  initiatives,
  resourcePools,
  resources,
  scenarios,
  settings,
  systemDependencies,
  systems,
} from './db';

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({ rowsAffected: 1 });
  });

  describe('initDb and getDb', () => {
    it('should initialize and return database instance', async () => {
      const database = await initDb();
      expect(database).toBeDefined();
    });

    it('should return cached database instance on subsequent calls', async () => {
      const db1 = await getDb();
      const db2 = await getDb();
      expect(db1).toBe(db2);
    });
  });

  describe('db convenience export', () => {
    it('should export all entity modules', () => {
      expect(db.capabilities).toBe(capabilities);
      expect(db.systems).toBe(systems);
      expect(db.resourcePools).toBe(resourcePools);
      expect(db.resources).toBe(resources);
      expect(db.constraints).toBe(constraints);
      expect(db.scenarios).toBe(scenarios);
      expect(db.initiatives).toBe(initiatives);
      expect(db.financialPeriods).toBe(financialPeriods);
      expect(db.settings).toBe(settings);
    });
  });

  describe('capabilities', () => {
    it('should get all capabilities', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'cap-1',
          name: 'Test Cap',
          type: 'Business',
          sort_order: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      const result = await capabilities.getAll();

      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM capabilities ORDER BY sort_order ASC',
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Cap');
      expect(result[0].sortOrder).toBe(0); // snake_case to camelCase
    });

    it('should get capability by id', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'cap-1',
          name: 'Test Cap',
          type: 'Business',
          sort_order: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      const result = await capabilities.get('cap-1');

      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM capabilities WHERE id = ?',
        ['cap-1'],
      );
      expect(result?.id).toBe('cap-1');
    });

    it('should return null when capability not found', async () => {
      mockSelect.mockResolvedValueOnce([]);
      const result = await capabilities.get('non-existent');
      expect(result).toBeNull();
    });

    it('should create capability', async () => {
      const result = await capabilities.create({
        name: 'New Cap',
        type: 'Technical',
        sortOrder: 1,
      });

      expect(mockExecute).toHaveBeenCalled();
      expect(result.name).toBe('New Cap');
      expect(result.type).toBe('Technical');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should update capability', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'cap-1',
          name: 'Updated Cap',
          type: 'Business',
          sort_order: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
      ]);

      const result = await capabilities.update('cap-1', {
        name: 'Updated Cap',
      });

      expect(mockExecute).toHaveBeenCalled();
      expect(result?.name).toBe('Updated Cap');
    });

    it('should delete capability', async () => {
      await capabilities.delete('cap-1');
      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM capabilities WHERE id = ?',
        ['cap-1'],
      );
    });

    it('should get root capabilities', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await capabilities.getRoots();
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM capabilities WHERE parent_id IS NULL ORDER BY sort_order ASC',
      );
    });

    it('should get child capabilities', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await capabilities.getChildren('parent-1');
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM capabilities WHERE parent_id = ? ORDER BY sort_order ASC',
        ['parent-1'],
      );
    });
  });

  describe('systems', () => {
    it('should get all systems', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'sys-1',
          name: 'Test System',
          lifecycle_stage: 'Production',
          criticality: 'High',
          technology_stack: '["React", "Node"]',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      const result = await systems.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test System');
      expect(result[0].technologyStack).toEqual(['React', 'Node']); // JSON parsed
    });

    it('should create system with technology stack', async () => {
      const result = await systems.create({
        name: 'New System',
        lifecycleStage: 'Development',
        criticality: 'Medium',
        technologyStack: ['Python', 'Django'],
      });

      expect(mockExecute).toHaveBeenCalled();
      expect(result.technologyStack).toEqual(['Python', 'Django']);
    });

    it('should get systems by capability', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await systems.getByCapability('cap-1');
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM systems WHERE capability_id = ? ORDER BY name ASC',
        ['cap-1'],
      );
    });
  });

  describe('resourcePools', () => {
    it('should get all resource pools', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'pool-1',
          name: 'Dev Team',
          capacity_unit: 'FTE',
          period_type: 'Month',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      const result = await resourcePools.getAll();
      expect(result[0].capacityUnit).toBe('FTE');
      expect(result[0].periodType).toBe('Month');
    });

    it('should create resource pool', async () => {
      const result = await resourcePools.create({
        name: 'QA Team',
        capacityUnit: 'PersonDays',
        periodType: 'Quarter',
        capacityPerPeriod: 60,
      });

      expect(result.name).toBe('QA Team');
      expect(result.capacityPerPeriod).toBe(60);
    });
  });

  describe('resources', () => {
    it('should create resource with skills array', async () => {
      const result = await resources.create({
        name: 'John Doe',
        role: 'Developer',
        skills: ['TypeScript', 'React'],
        availability: 1.0,
      });

      expect(result.skills).toEqual(['TypeScript', 'React']);
    });

    it('should get resources by pool', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await resources.getByPool('pool-1');
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM resources WHERE resource_pool_id = ? ORDER BY name ASC',
        ['pool-1'],
      );
    });
  });

  describe('constraints', () => {
    it('should create constraint', async () => {
      const result = await constraints.create({
        name: 'Year End Deadline',
        type: 'Deadline',
        hardness: 'Hard',
        effectiveDate: '2024-12-31',
      });

      expect(result.name).toBe('Year End Deadline');
      expect(result.type).toBe('Deadline');
      expect(result.hardness).toBe('Hard');
    });
  });

  describe('scenarios', () => {
    it('should create baseline scenario with fixed id', async () => {
      const result = await scenarios.create({
        name: 'Baseline',
        isBaseline: true,
      });

      expect(result.id).toBe('baseline');
      expect(result.isBaseline).toBe(true);
    });

    it('should create non-baseline scenario with generated id', async () => {
      const result = await scenarios.create({
        name: 'What If',
        isBaseline: false,
      });

      expect(result.id).not.toBe('baseline');
      expect(result.isBaseline).toBe(false);
    });

    it('should get baseline scenario', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'baseline',
          name: 'Baseline',
          is_baseline: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      const result = await scenarios.getBaseline();
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM scenarios WHERE is_baseline = 1',
      );
      expect(result?.isBaseline).toBe(1); // SQLite returns 1/0 for booleans
    });

    it('should throw error when deleting baseline scenario', async () => {
      mockSelect.mockResolvedValueOnce([
        {
          id: 'baseline',
          name: 'Baseline',
          is_baseline: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      await expect(scenarios.delete('baseline')).rejects.toThrow(
        'Cannot delete baseline scenario',
      );
    });
  });

  describe('initiatives', () => {
    it('should get initiatives by scenario', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await initiatives.getByScenario('scenario-1');
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM initiatives WHERE scenario_id = ? ORDER BY priority ASC, name ASC',
        ['scenario-1'],
      );
    });

    it('should create initiative', async () => {
      const result = await initiatives.create({
        name: 'New Feature',
        type: 'New',
        status: 'Proposed',
        priority: 'Should',
        scenarioId: 'baseline',
        effortEstimate: 100,
        effortUncertainty: 'Medium',
      });

      expect(result.name).toBe('New Feature');
      expect(result.effortEstimate).toBe(100);
    });
  });

  describe('financialPeriods', () => {
    it('should create financial period', async () => {
      const result = await financialPeriods.create({
        name: 'FY2024',
        type: 'Year',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budgetAvailable: 1000000,
      });

      expect(result.name).toBe('FY2024');
      expect(result.budgetAvailable).toBe(1000000);
    });
  });

  describe('systemDependencies', () => {
    it('should create system dependency', async () => {
      const result = await systemDependencies.create({
        sourceSystemId: 'sys-1',
        targetSystemId: 'sys-2',
        dependencyType: 'API',
        criticality: 'High',
      });

      expect(result.sourceSystemId).toBe('sys-1');
      expect(result.targetSystemId).toBe('sys-2');
    });

    it('should get dependencies by system', async () => {
      mockSelect.mockResolvedValueOnce([]);
      await systemDependencies.getBySystem('sys-1');
      expect(mockSelect).toHaveBeenCalledWith(
        'SELECT * FROM system_dependencies WHERE source_system_id = ? OR target_system_id = ?',
        ['sys-1', 'sys-1'],
      );
    });
  });

  describe('settings', () => {
    it('should set and get setting', async () => {
      const result = await settings.set('theme', 'dark');
      expect(result.key).toBe('theme');
      expect(result.value).toBe('dark');
    });

    it('should get setting by key', async () => {
      mockSelect.mockResolvedValueOnce([
        { key: 'theme', value: 'dark', updated_at: '2024-01-01' },
      ]);

      const result = await settings.get('theme');
      expect(result?.value).toBe('dark');
    });

    it('should return null for non-existent setting', async () => {
      mockSelect.mockResolvedValueOnce([]);
      const result = await settings.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete setting', async () => {
      await settings.delete('theme');
      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM settings WHERE key = ?',
        ['theme'],
      );
    });
  });
});
