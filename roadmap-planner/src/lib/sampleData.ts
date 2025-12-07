/**
 * Sample data generator for testing the timeline
 */
import type {
  Capability,
  Constraint,
  Initiative,
  ResourcePool,
  System,
} from './types';

const now = new Date();
const year = now.getFullYear();

/**
 * Generate sample capabilities
 */
export function generateSampleCapabilities(): Omit<
  Capability,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return [
    {
      name: 'Customer Management',
      description: 'CRM and customer data capabilities',
      type: 'Business',
      sortOrder: 1,
      colour: '#3B82F6',
    },
    {
      name: 'Order Processing',
      description: 'E-commerce and order fulfilment',
      type: 'Business',
      sortOrder: 2,
      colour: '#10B981',
    },
    {
      name: 'Data & Analytics',
      description: 'Business intelligence and reporting',
      type: 'Technical',
      sortOrder: 3,
      colour: '#8B5CF6',
    },
    {
      name: 'Infrastructure',
      description: 'Cloud and on-premise infrastructure',
      type: 'Technical',
      sortOrder: 4,
      colour: '#F59E0B',
    },
  ];
}

/**
 * Generate sample systems
 */
export function generateSampleSystems(): Omit<
  System,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return [
    {
      name: 'Legacy CRM',
      description: 'On-premise CRM system due for replacement',
      vendor: 'Acme Corp',
      lifecycleStage: 'Sunset',
      criticality: 'High',
      supportEndDate: `${year + 1}-06-30`,
    },
    {
      name: 'Salesforce',
      description: 'Cloud CRM platform',
      vendor: 'Salesforce',
      lifecycleStage: 'Production',
      criticality: 'Critical',
    },
    {
      name: 'E-Commerce Platform',
      description: 'Main online sales channel',
      vendor: 'Shopify',
      lifecycleStage: 'Production',
      criticality: 'Critical',
    },
    {
      name: 'Data Warehouse',
      description: 'Central analytics repository',
      vendor: 'Snowflake',
      lifecycleStage: 'Development',
      criticality: 'High',
    },
    {
      name: 'Legacy Reporting',
      description: 'Old BI tool to be decommissioned',
      vendor: 'Internal',
      lifecycleStage: 'Sunset',
      criticality: 'Medium',
      supportEndDate: `${year}-12-31`,
    },
  ];
}

/**
 * Generate sample initiatives for a given scenario
 */
export function generateSampleInitiatives(
  scenarioId: string,
): Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>[] {
  return [
    {
      name: 'CRM Migration to Salesforce',
      description: 'Migrate customer data from legacy CRM to Salesforce',
      type: 'Migration',
      status: 'InProgress',
      startDate: `${year}-01-15`,
      endDate: `${year}-06-30`,
      effortEstimate: 120,
      effortUncertainty: 'Medium',
      costEstimate: 250000,
      costUncertainty: 'Medium',
      priority: 'Must',
      scenarioId,
    },
    {
      name: 'Legacy CRM Decommission',
      description: 'Shut down legacy CRM after migration',
      type: 'Decommission',
      status: 'Planned',
      startDate: `${year}-07-01`,
      endDate: `${year}-08-31`,
      effortEstimate: 30,
      effortUncertainty: 'Low',
      costEstimate: 50000,
      costUncertainty: 'Low',
      priority: 'Must',
      scenarioId,
    },
    {
      name: 'E-Commerce Platform Upgrade',
      description: 'Upgrade to latest Shopify Plus features',
      type: 'Upgrade',
      status: 'Proposed',
      startDate: `${year}-03-01`,
      endDate: `${year}-05-15`,
      effortEstimate: 60,
      effortUncertainty: 'Low',
      costEstimate: 80000,
      costUncertainty: 'Low',
      priority: 'Should',
      scenarioId,
    },
    {
      name: 'Data Warehouse Implementation',
      description: 'Set up Snowflake data warehouse',
      type: 'New',
      status: 'InProgress',
      startDate: `${year}-02-01`,
      endDate: `${year}-09-30`,
      effortEstimate: 200,
      effortUncertainty: 'High',
      costEstimate: 500000,
      costUncertainty: 'High',
      priority: 'Must',
      scenarioId,
    },
    {
      name: 'Legacy Reporting Decommission',
      description: 'Retire old BI tool once data warehouse is live',
      type: 'Decommission',
      status: 'Planned',
      startDate: `${year}-10-01`,
      endDate: `${year}-11-30`,
      effortEstimate: 20,
      effortUncertainty: 'Low',
      costEstimate: 25000,
      costUncertainty: 'Low',
      priority: 'Should',
      scenarioId,
    },
    {
      name: 'API Gateway Implementation',
      description: 'Implement central API management platform',
      type: 'New',
      status: 'Proposed',
      startDate: `${year}-04-01`,
      endDate: `${year}-07-31`,
      effortEstimate: 80,
      effortUncertainty: 'Medium',
      costEstimate: 150000,
      costUncertainty: 'Medium',
      priority: 'Should',
      scenarioId,
    },
    {
      name: 'Cloud Migration Phase 1',
      description: 'Migrate non-critical workloads to AWS',
      type: 'Migration',
      status: 'Planned',
      startDate: `${year}-05-01`,
      endDate: `${year}-12-31`,
      effortEstimate: 150,
      effortUncertainty: 'High',
      costEstimate: 300000,
      costUncertainty: 'High',
      priority: 'Could',
      scenarioId,
    },
    {
      name: 'Security Compliance Upgrade',
      description: 'Implement SOC2 compliance requirements',
      type: 'Upgrade',
      status: 'InProgress',
      startDate: `${year}-01-01`,
      endDate: `${year}-03-31`,
      effortEstimate: 40,
      effortUncertainty: 'Low',
      costEstimate: 100000,
      costUncertainty: 'Low',
      priority: 'Must',
      scenarioId,
    },
  ];
}

/**
 * Generate sample resource pools
 */
export function generateSampleResourcePools(): Omit<
  ResourcePool,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return [
    {
      name: 'Development Team',
      description: 'Full-stack developers',
      capacityPerPeriod: 8,
      capacityUnit: 'FTE',
      periodType: 'Month',
      colour: '#3B82F6',
    },
    {
      name: 'Infrastructure Team',
      description: 'DevOps and platform engineers',
      capacityPerPeriod: 4,
      capacityUnit: 'FTE',
      periodType: 'Month',
      colour: '#10B981',
    },
    {
      name: 'Data Team',
      description: 'Data engineers and analysts',
      capacityPerPeriod: 3,
      capacityUnit: 'FTE',
      periodType: 'Month',
      colour: '#8B5CF6',
    },
  ];
}

/**
 * Generate sample constraints
 */
export function generateSampleConstraints(): Omit<
  Constraint,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return [
    {
      name: 'Legacy CRM Support End',
      description: 'Vendor support ends for legacy CRM',
      type: 'Deadline',
      hardness: 'Hard',
      effectiveDate: `${year + 1}-06-30`,
    },
    {
      name: 'Q2 Budget Freeze',
      description: 'No new spending commitments in Q2',
      type: 'Budget',
      hardness: 'Soft',
      effectiveDate: `${year}-04-01`,
      expiryDate: `${year}-06-30`,
    },
    {
      name: 'SOC2 Audit Deadline',
      description: 'Must complete SOC2 compliance by end of Q1',
      type: 'Compliance',
      hardness: 'Hard',
      effectiveDate: `${year}-03-31`,
    },
  ];
}
