// Database access layer using tauri-plugin-sql
// Provides type-safe CRUD operations for all entities
// NOTE: SQLite with tauri-plugin-sql uses $1, $2, $3 syntax (NOT ?)

import Database from '@tauri-apps/plugin-sql';
import { dbLogger as log } from './logger';
import type {
  Capability,
  Constraint,
  FinancialPeriod,
  Initiative,
  InitiativeConstraint,
  InitiativeDependency,
  InitiativeResourceRequirement,
  Resource,
  ResourcePool,
  Scenario,
  Setting,
  System,
  SystemDependency,
  SystemInitiative,
} from './types';

// Database instance (singleton)
let dbInstance: Database | null = null;

// Generate UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get current ISO timestamp
function now(): string {
  return new Date().toISOString();
}

// Convert snake_case to camelCase
function snakeToCamel<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    const value = obj[key];
    // Handle JSON arrays stored as strings
    if (
      typeof value === 'string' &&
      (key === 'technology_stack' || key === 'skills')
    ) {
      try {
        result[camelKey] = JSON.parse(value);
      } catch {
        result[camelKey] = value;
      }
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

// Initialize database connection
export async function initDb(): Promise<Database> {
  log.info('initDb called', { hasExistingInstance: !!dbInstance });
  if (!dbInstance) {
    try {
      log.debug('Loading database...');
      dbInstance = await Database.load('sqlite:roadmap.db');
      log.info('Database loaded successfully');
    } catch (error) {
      log.error('Failed to load database', {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
      });
      throw error;
    }
  }
  return dbInstance;
}

// Get database instance
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    log.debug('No database instance, calling initDb');
    return initDb();
  }
  return dbInstance;
}

// ============================================
// CAPABILITIES
// ============================================

export const capabilities = {
  async getAll(): Promise<Capability[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM capabilities ORDER BY sort_order ASC',
    );
    return rows.map(snakeToCamel) as unknown as Capability[];
  },

  async get(id: string): Promise<Capability | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM capabilities WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Capability)
      : null;
  },

  async create(
    data: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Capability> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO capabilities (id, name, description, type, parent_id, colour, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.type,
        data.parentId ?? null,
        data.colour ?? null,
        data.sortOrder,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Capability | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.parentId !== undefined) {
      fields.push(`parent_id = $${paramIndex++}`);
      values.push(data.parentId);
    }
    if (data.colour !== undefined) {
      fields.push(`colour = $${paramIndex++}`);
      values.push(data.colour);
    }
    if (data.sortOrder !== undefined) {
      fields.push(`sort_order = $${paramIndex++}`);
      values.push(data.sortOrder);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE capabilities SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM capabilities WHERE id = $1', [id]);
  },

  async getChildren(parentId: string): Promise<Capability[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM capabilities WHERE parent_id = $1 ORDER BY sort_order ASC',
      [parentId],
    );
    return rows.map(snakeToCamel) as unknown as Capability[];
  },

  async getRoots(): Promise<Capability[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM capabilities WHERE parent_id IS NULL ORDER BY sort_order ASC',
    );
    return rows.map(snakeToCamel) as unknown as Capability[];
  },
};

// ============================================
// SYSTEMS
// ============================================

export const systems = {
  async getAll(): Promise<System[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM systems ORDER BY name ASC',
    );
    return rows.map(snakeToCamel) as unknown as System[];
  },

  async get(id: string): Promise<System | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM systems WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as System)
      : null;
  },

  async create(
    data: Omit<System, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<System> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO systems (id, name, description, owner, vendor, technology_stack, lifecycle_stage, criticality, support_end_date, extended_support_end_date, capability_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.owner ?? null,
        data.vendor ?? null,
        data.technologyStack ? JSON.stringify(data.technologyStack) : null,
        data.lifecycleStage,
        data.criticality,
        data.supportEndDate ?? null,
        data.extendedSupportEndDate ?? null,
        data.capabilityId ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<System, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<System | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.owner !== undefined) {
      fields.push(`owner = $${paramIndex++}`);
      values.push(data.owner);
    }
    if (data.vendor !== undefined) {
      fields.push(`vendor = $${paramIndex++}`);
      values.push(data.vendor);
    }
    if (data.technologyStack !== undefined) {
      fields.push(`technology_stack = $${paramIndex++}`);
      values.push(JSON.stringify(data.technologyStack));
    }
    if (data.lifecycleStage !== undefined) {
      fields.push(`lifecycle_stage = $${paramIndex++}`);
      values.push(data.lifecycleStage);
    }
    if (data.criticality !== undefined) {
      fields.push(`criticality = $${paramIndex++}`);
      values.push(data.criticality);
    }
    if (data.supportEndDate !== undefined) {
      fields.push(`support_end_date = $${paramIndex++}`);
      values.push(data.supportEndDate);
    }
    if (data.extendedSupportEndDate !== undefined) {
      fields.push(`extended_support_end_date = $${paramIndex++}`);
      values.push(data.extendedSupportEndDate);
    }
    if (data.capabilityId !== undefined) {
      fields.push(`capability_id = $${paramIndex++}`);
      values.push(data.capabilityId);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE systems SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM systems WHERE id = $1', [id]);
  },

  async getByCapability(capabilityId: string): Promise<System[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM systems WHERE capability_id = $1 ORDER BY name ASC',
      [capabilityId],
    );
    return rows.map(snakeToCamel) as unknown as System[];
  },
};

// ============================================
// RESOURCE POOLS
// ============================================

export const resourcePools = {
  async getAll(): Promise<ResourcePool[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM resource_pools ORDER BY name ASC',
    );
    return rows.map(snakeToCamel) as unknown as ResourcePool[];
  },

  async get(id: string): Promise<ResourcePool | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM resource_pools WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as ResourcePool)
      : null;
  },

  async create(
    data: Omit<ResourcePool, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ResourcePool> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO resource_pools (id, name, description, capacity_per_period, capacity_unit, period_type, colour, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.capacityPerPeriod ?? null,
        data.capacityUnit,
        data.periodType,
        data.colour ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<ResourcePool, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ResourcePool | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.capacityPerPeriod !== undefined) {
      fields.push(`capacity_per_period = $${paramIndex++}`);
      values.push(data.capacityPerPeriod);
    }
    if (data.capacityUnit !== undefined) {
      fields.push(`capacity_unit = $${paramIndex++}`);
      values.push(data.capacityUnit);
    }
    if (data.periodType !== undefined) {
      fields.push(`period_type = $${paramIndex++}`);
      values.push(data.periodType);
    }
    if (data.colour !== undefined) {
      fields.push(`colour = $${paramIndex++}`);
      values.push(data.colour);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE resource_pools SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM resource_pools WHERE id = $1', [id]);
  },
};

// ============================================
// RESOURCES
// ============================================

export const resources = {
  async getAll(): Promise<Resource[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM resources ORDER BY name ASC',
    );
    return rows.map(snakeToCamel) as unknown as Resource[];
  },

  async get(id: string): Promise<Resource | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM resources WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Resource)
      : null;
  },

  async create(
    data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Resource> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO resources (id, name, role, skills, availability, resource_pool_id, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        data.name,
        data.role ?? null,
        data.skills ? JSON.stringify(data.skills) : null,
        data.availability,
        data.resourcePoolId ?? null,
        data.startDate ?? null,
        data.endDate ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Resource | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }
    if (data.skills !== undefined) {
      fields.push(`skills = $${paramIndex++}`);
      values.push(JSON.stringify(data.skills));
    }
    if (data.availability !== undefined) {
      fields.push(`availability = $${paramIndex++}`);
      values.push(data.availability);
    }
    if (data.resourcePoolId !== undefined) {
      fields.push(`resource_pool_id = $${paramIndex++}`);
      values.push(data.resourcePoolId);
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE resources SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM resources WHERE id = $1', [id]);
  },

  async getByPool(resourcePoolId: string): Promise<Resource[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM resources WHERE resource_pool_id = $1 ORDER BY name ASC',
      [resourcePoolId],
    );
    return rows.map(snakeToCamel) as unknown as Resource[];
  },
};

// ============================================
// CONSTRAINTS
// ============================================

export const constraints = {
  async getAll(): Promise<Constraint[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM constraints ORDER BY name ASC',
    );
    return rows.map(snakeToCamel) as unknown as Constraint[];
  },

  async get(id: string): Promise<Constraint | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM constraints WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Constraint)
      : null;
  },

  async create(
    data: Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Constraint> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO constraints (id, name, description, type, hardness, effective_date, expiry_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.type,
        data.hardness,
        data.effectiveDate ?? null,
        data.expiryDate ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Constraint | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.hardness !== undefined) {
      fields.push(`hardness = $${paramIndex++}`);
      values.push(data.hardness);
    }
    if (data.effectiveDate !== undefined) {
      fields.push(`effective_date = $${paramIndex++}`);
      values.push(data.effectiveDate);
    }
    if (data.expiryDate !== undefined) {
      fields.push(`expiry_date = $${paramIndex++}`);
      values.push(data.expiryDate);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE constraints SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM constraints WHERE id = $1', [id]);
  },
};

// ============================================
// SCENARIOS
// ============================================

export const scenarios = {
  async getAll(): Promise<Scenario[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM scenarios ORDER BY is_baseline DESC, name ASC',
    );
    return rows.map(snakeToCamel) as unknown as Scenario[];
  },

  async get(id: string): Promise<Scenario | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM scenarios WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Scenario)
      : null;
  },

  async getBaseline(): Promise<Scenario | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM scenarios WHERE is_baseline = 1',
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Scenario)
      : null;
  },

  async create(
    data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Scenario> {
    const database = await getDb();
    const id = data.isBaseline ? 'baseline' : generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO scenarios (id, name, description, type, is_baseline, parent_scenario_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.type ?? null,
        data.isBaseline ? 1 : 0,
        data.parentScenarioId ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Scenario | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.isBaseline !== undefined) {
      fields.push(`is_baseline = $${paramIndex++}`);
      values.push(data.isBaseline ? 1 : 0);
    }
    if (data.parentScenarioId !== undefined) {
      fields.push(`parent_scenario_id = $${paramIndex++}`);
      values.push(data.parentScenarioId);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE scenarios SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    // Don't allow deleting baseline scenario
    const scenario = await this.get(id);
    if (scenario?.isBaseline) {
      throw new Error('Cannot delete baseline scenario');
    }
    await database.execute('DELETE FROM scenarios WHERE id = $1', [id]);
  },
};

// ============================================
// INITIATIVES
// ============================================

export const initiatives = {
  async getAll(): Promise<Initiative[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiatives ORDER BY priority ASC, name ASC',
    );
    return rows.map(snakeToCamel) as unknown as Initiative[];
  },

  async get(id: string): Promise<Initiative | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiatives WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Initiative)
      : null;
  },

  async getByScenario(scenarioId: string): Promise<Initiative[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiatives WHERE scenario_id = $1 ORDER BY priority ASC, name ASC',
      [scenarioId],
    );
    return rows.map(snakeToCamel) as unknown as Initiative[];
  },

  async create(
    data: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Initiative> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO initiatives (id, name, description, type, status, start_date, end_date, effort_estimate, effort_uncertainty, cost_estimate, cost_uncertainty, priority, scenario_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        data.name,
        data.description ?? null,
        data.type,
        data.status,
        data.startDate ?? null,
        data.endDate ?? null,
        data.effortEstimate ?? null,
        data.effortUncertainty ?? null,
        data.costEstimate ?? null,
        data.costUncertainty ?? null,
        data.priority,
        data.scenarioId,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Initiative | null> {
    log.info('initiatives.update called', { id, data });

    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.effortEstimate !== undefined) {
      fields.push(`effort_estimate = $${paramIndex++}`);
      values.push(data.effortEstimate);
    }
    if (data.effortUncertainty !== undefined) {
      fields.push(`effort_uncertainty = $${paramIndex++}`);
      values.push(data.effortUncertainty);
    }
    if (data.costEstimate !== undefined) {
      fields.push(`cost_estimate = $${paramIndex++}`);
      values.push(data.costEstimate);
    }
    if (data.costUncertainty !== undefined) {
      fields.push(`cost_uncertainty = $${paramIndex++}`);
      values.push(data.costUncertainty);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.scenarioId !== undefined) {
      fields.push(`scenario_id = $${paramIndex++}`);
      values.push(data.scenarioId);
    }

    if (fields.length === 0) {
      log.debug('No fields to update, returning current data');
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    const sql = `UPDATE initiatives SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
    log.debug('Executing SQL', { sql, values, paramIndex });

    try {
      const result = await database.execute(sql, values);
      log.info('SQL executed successfully', { rowsAffected: result.rowsAffected });

      const updated = await this.get(id);
      log.debug('Retrieved updated record', { updated });
      return updated;
    } catch (error) {
      log.error('SQL execution failed', {
        sql,
        values,
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
      });
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM initiatives WHERE id = $1', [id]);
  },
};

// ============================================
// FINANCIAL PERIODS
// ============================================

export const financialPeriods = {
  async getAll(): Promise<FinancialPeriod[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM financial_periods ORDER BY start_date ASC',
    );
    return rows.map(snakeToCamel) as unknown as FinancialPeriod[];
  },

  async get(id: string): Promise<FinancialPeriod | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM financial_periods WHERE id = $1',
      [id],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as FinancialPeriod)
      : null;
  },

  async create(
    data: Omit<FinancialPeriod, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FinancialPeriod> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO financial_periods (id, name, type, start_date, end_date, budget_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        data.name,
        data.type,
        data.startDate,
        data.endDate,
        data.budgetAvailable ?? null,
        timestamp,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp, updatedAt: timestamp };
  },

  async update(
    id: string,
    data: Partial<Omit<FinancialPeriod, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<FinancialPeriod | null> {
    const database = await getDb();
    const timestamp = now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.budgetAvailable !== undefined) {
      fields.push(`budget_available = $${paramIndex++}`);
      values.push(data.budgetAvailable);
    }

    if (fields.length === 0) {
      return this.get(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(timestamp);
    values.push(id);

    await database.execute(
      `UPDATE financial_periods SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    return this.get(id);
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM financial_periods WHERE id = $1', [id]);
  },
};

// ============================================
// RELATIONSHIP TABLES
// ============================================

export const systemDependencies = {
  async getAll(): Promise<SystemDependency[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM system_dependencies',
    );
    return rows.map(snakeToCamel) as unknown as SystemDependency[];
  },

  async getBySystem(systemId: string): Promise<SystemDependency[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM system_dependencies WHERE source_system_id = $1 OR target_system_id = $1',
      [systemId],
    );
    return rows.map(snakeToCamel) as unknown as SystemDependency[];
  },

  async create(
    data: Omit<SystemDependency, 'id' | 'createdAt'>,
  ): Promise<SystemDependency> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO system_dependencies (id, source_system_id, target_system_id, dependency_type, criticality, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.sourceSystemId,
        data.targetSystemId,
        data.dependencyType,
        data.criticality,
        data.description ?? null,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp };
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM system_dependencies WHERE id = $1', [
      id,
    ]);
  },
};

export const systemInitiatives = {
  async getBySystem(systemId: string): Promise<SystemInitiative[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM system_initiatives WHERE system_id = $1',
      [systemId],
    );
    return rows.map(snakeToCamel) as unknown as SystemInitiative[];
  },

  async getByInitiative(initiativeId: string): Promise<SystemInitiative[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM system_initiatives WHERE initiative_id = $1',
      [initiativeId],
    );
    return rows.map(snakeToCamel) as unknown as SystemInitiative[];
  },

  async create(
    data: Omit<SystemInitiative, 'id' | 'createdAt'>,
  ): Promise<SystemInitiative> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO system_initiatives (id, system_id, initiative_id, relationship_type, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, data.systemId, data.initiativeId, data.relationshipType, timestamp],
    );
    return { ...data, id, createdAt: timestamp };
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM system_initiatives WHERE id = $1', [
      id,
    ]);
  },
};

export const initiativeDependencies = {
  async getByInitiative(initiativeId: string): Promise<InitiativeDependency[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiative_dependencies WHERE predecessor_id = $1 OR successor_id = $1',
      [initiativeId],
    );
    return rows.map(snakeToCamel) as unknown as InitiativeDependency[];
  },

  async create(
    data: Omit<InitiativeDependency, 'id' | 'createdAt'>,
  ): Promise<InitiativeDependency> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO initiative_dependencies (id, predecessor_id, successor_id, dependency_type, lag_days, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        data.predecessorId,
        data.successorId,
        data.dependencyType,
        data.lagDays,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp };
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute(
      'DELETE FROM initiative_dependencies WHERE id = $1',
      [id],
    );
  },
};

export const initiativeResourceRequirements = {
  async getByInitiative(
    initiativeId: string,
  ): Promise<InitiativeResourceRequirement[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiative_resource_requirements WHERE initiative_id = $1',
      [initiativeId],
    );
    return rows.map(snakeToCamel) as unknown as InitiativeResourceRequirement[];
  },

  async getByResourcePool(
    resourcePoolId: string,
  ): Promise<InitiativeResourceRequirement[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiative_resource_requirements WHERE resource_pool_id = $1',
      [resourcePoolId],
    );
    return rows.map(snakeToCamel) as unknown as InitiativeResourceRequirement[];
  },

  async create(
    data: Omit<InitiativeResourceRequirement, 'id' | 'createdAt'>,
  ): Promise<InitiativeResourceRequirement> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO initiative_resource_requirements (id, initiative_id, resource_pool_id, effort_required, period_start, period_end, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.initiativeId,
        data.resourcePoolId,
        data.effortRequired,
        data.periodStart ?? null,
        data.periodEnd ?? null,
        timestamp,
      ],
    );
    return { ...data, id, createdAt: timestamp };
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute(
      'DELETE FROM initiative_resource_requirements WHERE id = $1',
      [id],
    );
  },
};

export const initiativeConstraints = {
  async getByInitiative(initiativeId: string): Promise<InitiativeConstraint[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiative_constraints WHERE initiative_id = $1',
      [initiativeId],
    );
    return rows.map(snakeToCamel) as unknown as InitiativeConstraint[];
  },

  async getByConstraint(constraintId: string): Promise<InitiativeConstraint[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM initiative_constraints WHERE constraint_id = $1',
      [constraintId],
    );
    return rows.map(snakeToCamel) as unknown as InitiativeConstraint[];
  },

  async create(
    data: Omit<InitiativeConstraint, 'id' | 'createdAt'>,
  ): Promise<InitiativeConstraint> {
    const database = await getDb();
    const id = generateId();
    const timestamp = now();
    await database.execute(
      `INSERT INTO initiative_constraints (id, initiative_id, constraint_id, created_at)
       VALUES ($1, $2, $3, $4)`,
      [id, data.initiativeId, data.constraintId, timestamp],
    );
    return { ...data, id, createdAt: timestamp };
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM initiative_constraints WHERE id = $1', [
      id,
    ]);
  },
};

// ============================================
// SETTINGS
// ============================================

export const settings = {
  async get(key: string): Promise<Setting | null> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM settings WHERE key = $1',
      [key],
    );
    return rows.length > 0
      ? (snakeToCamel(rows[0]) as unknown as Setting)
      : null;
  },

  async set(key: string, value: string): Promise<Setting> {
    const database = await getDb();
    const timestamp = now();
    await database.execute(
      `INSERT OR REPLACE INTO settings (key, value, updated_at)
       VALUES ($1, $2, $3)`,
      [key, value, timestamp],
    );
    return { key, value, updatedAt: timestamp };
  },

  async delete(key: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM settings WHERE key = $1', [key]);
  },

  async getAll(): Promise<Setting[]> {
    const database = await getDb();
    const rows = await database.select<Record<string, unknown>[]>(
      'SELECT * FROM settings',
    );
    return rows.map(snakeToCamel) as unknown as Setting[];
  },
};

// ============================================
// CONVENIENCE EXPORT
// ============================================

export const db = {
  init: initDb,
  get: getDb,
  capabilities,
  systems,
  resourcePools,
  resources,
  constraints,
  scenarios,
  initiatives,
  financialPeriods,
  systemDependencies,
  systemInitiatives,
  initiativeDependencies,
  initiativeResourceRequirements,
  initiativeConstraints,
  settings,
};

export default db;
