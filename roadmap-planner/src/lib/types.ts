// ============================================
// ENUM TYPES
// ============================================

export type CapabilityType = 'Business' | 'Technical';

export type LifecycleStage =
  | 'Discovery'
  | 'Development'
  | 'Production'
  | 'Sunset'
  | 'Retired';

export type Criticality = 'Critical' | 'High' | 'Medium' | 'Low';

export type CapacityUnit = 'FTE' | 'PersonDays' | 'PersonMonths';

export type PeriodType = 'Month' | 'Quarter' | 'Year';

export type ConstraintType =
  | 'Deadline'
  | 'Budget'
  | 'Resource'
  | 'Dependency'
  | 'Compliance'
  | 'Other';

export type Hardness = 'Hard' | 'Soft';

export type ScenarioType = 'Timing' | 'Budget' | 'Resource' | 'Scope' | 'Risk';

export type InitiativeType =
  | 'Upgrade'
  | 'Replacement'
  | 'New'
  | 'Decommission'
  | 'Migration';

export type InitiativeStatus =
  | 'Proposed'
  | 'Planned'
  | 'InProgress'
  | 'Complete'
  | 'Cancelled';

export type Uncertainty = 'Low' | 'Medium' | 'High';

export type Priority = 'Must' | 'Should' | 'Could' | 'Wont';

export type FinancialPeriodType = 'Year' | 'Half' | 'Quarter' | 'Month';

export type SystemDependencyType =
  | 'Data'
  | 'API'
  | 'Authentication'
  | 'Infrastructure'
  | 'Other';

export type SystemRelationshipType =
  | 'Target'
  | 'Affected'
  | 'Replaced'
  | 'Created';

export type InitiativeDependencyType =
  | 'FinishToStart'
  | 'StartToStart'
  | 'FinishToFinish'
  | 'StartToFinish';

// ============================================
// CORE ENTITY INTERFACES
// ============================================

export interface Capability {
  id: string;
  name: string;
  description?: string;
  type: CapabilityType;
  parentId?: string;
  colour?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface System {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  vendor?: string;
  technologyStack?: string[];
  lifecycleStage: LifecycleStage;
  criticality: Criticality;
  supportEndDate?: string;
  extendedSupportEndDate?: string;
  capabilityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePool {
  id: string;
  name: string;
  description?: string;
  capacityPerPeriod?: number;
  capacityUnit: CapacityUnit;
  periodType: PeriodType;
  colour?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  role?: string;
  skills?: string[];
  availability: number;
  resourcePoolId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Constraint {
  id: string;
  name: string;
  description?: string;
  type: ConstraintType;
  hardness: Hardness;
  effectiveDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  type?: ScenarioType;
  isBaseline: boolean;
  parentScenarioId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Initiative {
  id: string;
  name: string;
  description?: string;
  type: InitiativeType;
  status: InitiativeStatus;
  startDate?: string;
  endDate?: string;
  effortEstimate?: number;
  effortUncertainty?: Uncertainty;
  costEstimate?: number;
  costUncertainty?: Uncertainty;
  priority: Priority;
  scenarioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialPeriod {
  id: string;
  name: string;
  type: FinancialPeriodType;
  startDate: string;
  endDate: string;
  budgetAvailable?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// RELATIONSHIP INTERFACES
// ============================================

export interface SystemDependency {
  id: string;
  sourceSystemId: string;
  targetSystemId: string;
  dependencyType: SystemDependencyType;
  criticality: Criticality;
  description?: string;
  createdAt: string;
}

export interface SystemInitiative {
  id: string;
  systemId: string;
  initiativeId: string;
  relationshipType: SystemRelationshipType;
  createdAt: string;
}

export interface InitiativeDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  dependencyType: InitiativeDependencyType;
  lagDays: number;
  createdAt: string;
}

export interface InitiativeResourceRequirement {
  id: string;
  initiativeId: string;
  resourcePoolId: string;
  effortRequired: number;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

export interface InitiativeConstraint {
  id: string;
  initiativeId: string;
  constraintId: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value?: string;
  updatedAt: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export type ZoomLevel = 'Quarter' | 'HalfYear' | 'Year' | '3Years' | '5Years' | '10Year';

export type NavigationItem =
  | 'timeline'
  | 'systems'
  | 'capabilities'
  | 'initiatives'
  | 'resources'
  | 'scenarios'
  | 'settings';
