import { describe, expect, it } from 'vitest';
import type {
  Capability,
  CapabilityType,
  Criticality,
  Initiative,
  InitiativeStatus,
  InitiativeType,
  LifecycleStage,
  Priority,
  Scenario,
  System,
  ZoomLevel,
} from './types';

describe('TypeScript Types', () => {
  describe('CapabilityType', () => {
    it('should accept valid capability types', () => {
      const business: CapabilityType = 'Business';
      const technical: CapabilityType = 'Technical';
      expect(business).toBe('Business');
      expect(technical).toBe('Technical');
    });
  });

  describe('LifecycleStage', () => {
    it('should accept all valid lifecycle stages', () => {
      const stages: LifecycleStage[] = [
        'Discovery',
        'Development',
        'Production',
        'Sunset',
        'Retired',
      ];
      expect(stages).toHaveLength(5);
    });
  });

  describe('Criticality', () => {
    it('should accept all valid criticality levels', () => {
      const levels: Criticality[] = ['Critical', 'High', 'Medium', 'Low'];
      expect(levels).toHaveLength(4);
    });
  });

  describe('InitiativeType', () => {
    it('should accept all valid initiative types', () => {
      const types: InitiativeType[] = [
        'Upgrade',
        'Replacement',
        'New',
        'Decommission',
        'Migration',
      ];
      expect(types).toHaveLength(5);
    });
  });

  describe('InitiativeStatus', () => {
    it('should accept all valid initiative statuses', () => {
      const statuses: InitiativeStatus[] = [
        'Proposed',
        'Planned',
        'InProgress',
        'Complete',
        'Cancelled',
      ];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('Priority', () => {
    it('should follow MoSCoW prioritisation', () => {
      const priorities: Priority[] = ['Must', 'Should', 'Could', 'Wont'];
      expect(priorities).toHaveLength(4);
      expect(priorities[0]).toBe('Must');
      expect(priorities[3]).toBe('Wont');
    });
  });

  describe('ZoomLevel', () => {
    it('should have all timeline zoom levels', () => {
      const zoomLevels: ZoomLevel[] = [
        'Quarter',
        'HalfYear',
        'Year',
        '3Years',
        '5Years',
      ];
      expect(zoomLevels).toHaveLength(5);
    });
  });

  describe('Entity Interfaces', () => {
    it('should create a valid Capability object', () => {
      const capability: Capability = {
        id: 'cap-123',
        name: 'Customer Management',
        description: 'Handle customer relationships',
        type: 'Business',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      expect(capability.id).toBe('cap-123');
      expect(capability.type).toBe('Business');
    });

    it('should create a valid System object', () => {
      const system: System = {
        id: 'sys-456',
        name: 'CRM System',
        description: 'Customer relationship management',
        owner: 'Sales Team',
        vendor: 'Salesforce',
        technologyStack: ['Cloud', 'SaaS'],
        lifecycleStage: 'Production',
        criticality: 'High',
        supportEndDate: '2026-12-31',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      expect(system.lifecycleStage).toBe('Production');
      expect(system.criticality).toBe('High');
      expect(system.technologyStack).toContain('Cloud');
    });

    it('should create a valid Initiative object', () => {
      const initiative: Initiative = {
        id: 'init-789',
        name: 'CRM Upgrade',
        description: 'Upgrade CRM to latest version',
        type: 'Upgrade',
        status: 'Planned',
        startDate: '2025-03-01',
        endDate: '2025-06-30',
        effortEstimate: 120,
        effortUncertainty: 'Medium',
        costEstimate: 50000,
        costUncertainty: 'High',
        priority: 'Should',
        scenarioId: 'baseline',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      expect(initiative.type).toBe('Upgrade');
      expect(initiative.status).toBe('Planned');
      expect(initiative.priority).toBe('Should');
    });

    it('should create a valid Scenario object', () => {
      const scenario: Scenario = {
        id: 'scenario-baseline',
        name: 'Baseline',
        description: 'Current committed plan',
        type: 'Timing',
        isBaseline: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      expect(scenario.isBaseline).toBe(true);
      expect(scenario.type).toBe('Timing');
    });

    it('should allow optional fields to be undefined', () => {
      const minimalCapability: Capability = {
        id: 'cap-minimal',
        name: 'Minimal Capability',
        type: 'Technical',
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      expect(minimalCapability.description).toBeUndefined();
      expect(minimalCapability.parentId).toBeUndefined();
      expect(minimalCapability.colour).toBeUndefined();
    });
  });
});
