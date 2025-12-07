-- Roadmap Planner Initial Schema
-- Version 1: Core entities and relationships

-- ============================================
-- CORE ENTITY TABLES
-- ============================================

-- Capabilities: Business and technical capabilities (hierarchical)
CREATE TABLE capabilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('Business', 'Technical')),
    parent_id TEXT REFERENCES capabilities(id) ON DELETE SET NULL,
    colour TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_capabilities_parent ON capabilities(parent_id);
CREATE INDEX idx_capabilities_type ON capabilities(type);

-- Systems: IT systems with lifecycle and criticality
CREATE TABLE systems (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    vendor TEXT,
    technology_stack TEXT, -- JSON array
    lifecycle_stage TEXT NOT NULL CHECK (lifecycle_stage IN ('Discovery', 'Development', 'Production', 'Sunset', 'Retired')),
    criticality TEXT NOT NULL CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    support_end_date TEXT,
    extended_support_end_date TEXT,
    capability_id TEXT REFERENCES capabilities(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_systems_capability ON systems(capability_id);
CREATE INDEX idx_systems_lifecycle ON systems(lifecycle_stage);
CREATE INDEX idx_systems_criticality ON systems(criticality);

-- Resource Pools: Groups of resources with capacity
CREATE TABLE resource_pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity_per_period REAL,
    capacity_unit TEXT NOT NULL CHECK (capacity_unit IN ('FTE', 'PersonDays', 'PersonMonths')),
    period_type TEXT NOT NULL CHECK (period_type IN ('Month', 'Quarter', 'Year')),
    colour TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Resources: Individual resources within pools
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    skills TEXT, -- JSON array
    availability REAL DEFAULT 1.0,
    resource_pool_id TEXT REFERENCES resource_pools(id) ON DELETE SET NULL,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_resources_pool ON resources(resource_pool_id);

-- Constraints: Deadline, budget, resource, dependency, compliance constraints
CREATE TABLE constraints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('Deadline', 'Budget', 'Resource', 'Dependency', 'Compliance', 'Other')),
    hardness TEXT NOT NULL CHECK (hardness IN ('Hard', 'Soft')),
    effective_date TEXT,
    expiry_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_constraints_type ON constraints(type);

-- Scenarios: Baseline and what-if scenarios
CREATE TABLE scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('Timing', 'Budget', 'Resource', 'Scope', 'Risk')),
    is_baseline INTEGER NOT NULL DEFAULT 0,
    parent_scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_scenarios_parent ON scenarios(parent_scenario_id);
CREATE INDEX idx_scenarios_baseline ON scenarios(is_baseline);

-- Initiatives: Work items with timeline and resource requirements
CREATE TABLE initiatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('Upgrade', 'Replacement', 'New', 'Decommission', 'Migration')),
    status TEXT NOT NULL CHECK (status IN ('Proposed', 'Planned', 'InProgress', 'Complete', 'Cancelled')),
    start_date TEXT,
    end_date TEXT,
    effort_estimate REAL,
    effort_uncertainty TEXT CHECK (effort_uncertainty IN ('Low', 'Medium', 'High')),
    cost_estimate REAL,
    cost_uncertainty TEXT CHECK (cost_uncertainty IN ('Low', 'Medium', 'High')),
    priority TEXT NOT NULL CHECK (priority IN ('Must', 'Should', 'Could', 'Wont')),
    scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_initiatives_scenario ON initiatives(scenario_id);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_dates ON initiatives(start_date, end_date);

-- Financial Periods: Budgeting periods
CREATE TABLE financial_periods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Year', 'Half', 'Quarter', 'Month')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget_available REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_financial_periods_dates ON financial_periods(start_date, end_date);

-- ============================================
-- RELATIONSHIP TABLES
-- ============================================

-- System Dependencies: Links between systems
CREATE TABLE system_dependencies (
    id TEXT PRIMARY KEY,
    source_system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    target_system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('Data', 'API', 'Authentication', 'Infrastructure', 'Other')),
    criticality TEXT NOT NULL CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source_system_id, target_system_id)
);

CREATE INDEX idx_system_deps_source ON system_dependencies(source_system_id);
CREATE INDEX idx_system_deps_target ON system_dependencies(target_system_id);

-- System Initiatives: Links systems to initiatives
CREATE TABLE system_initiatives (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('Target', 'Affected', 'Replaced', 'Created')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(system_id, initiative_id)
);

CREATE INDEX idx_system_init_system ON system_initiatives(system_id);
CREATE INDEX idx_system_init_initiative ON system_initiatives(initiative_id);

-- Initiative Dependencies: Links between initiatives
CREATE TABLE initiative_dependencies (
    id TEXT PRIMARY KEY,
    predecessor_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    successor_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('FinishToStart', 'StartToStart', 'FinishToFinish', 'StartToFinish')),
    lag_days INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX idx_init_deps_predecessor ON initiative_dependencies(predecessor_id);
CREATE INDEX idx_init_deps_successor ON initiative_dependencies(successor_id);

-- Initiative Resource Requirements: Resource needs per initiative
CREATE TABLE initiative_resource_requirements (
    id TEXT PRIMARY KEY,
    initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    resource_pool_id TEXT NOT NULL REFERENCES resource_pools(id) ON DELETE CASCADE,
    effort_required REAL NOT NULL,
    period_start TEXT,
    period_end TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_init_resources_initiative ON initiative_resource_requirements(initiative_id);
CREATE INDEX idx_init_resources_pool ON initiative_resource_requirements(resource_pool_id);

-- Initiative Constraints: Links initiatives to constraints
CREATE TABLE initiative_constraints (
    id TEXT PRIMARY KEY,
    initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    constraint_id TEXT NOT NULL REFERENCES constraints(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(initiative_id, constraint_id)
);

CREATE INDEX idx_init_constraints_initiative ON initiative_constraints(initiative_id);
CREATE INDEX idx_init_constraints_constraint ON initiative_constraints(constraint_id);

-- Settings: Key-value store for application settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default baseline scenario
INSERT INTO scenarios (id, name, description, is_baseline, type)
VALUES ('baseline', 'Baseline', 'The current known state and committed plans', 1, NULL);
