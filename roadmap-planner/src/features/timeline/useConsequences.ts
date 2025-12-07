// useConsequences - Hook to integrate consequence engine with timeline

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ConsequenceContext,
  type ConsequenceReport,
  evaluateChange,
  evaluateCurrentState,
  getInitiativeViolations,
} from '@/lib/consequenceEngine';
import {
  constraints as constraintsDb,
  initiativeConstraints as constraintLinksDb,
  initiativeDependencies as dependenciesDb,
  initiativeResourceRequirements as requirementsDb,
  initiatives as initiativesDb,
  resourcePools as poolsDb,
} from '@/lib/db';
import type {
  Constraint,
  Initiative,
  InitiativeConstraint,
  InitiativeDependency,
  InitiativeResourceRequirement,
  ResourcePool,
} from '@/lib/types';
import { useAppStore } from '@/stores/appStore';

interface UseConsequencesResult {
  // Data for rendering
  dependencies: InitiativeDependency[];
  constraints: Constraint[];
  constraintLinks: InitiativeConstraint[];
  requirements: InitiativeResourceRequirement[];
  pools: ResourcePool[];

  // Current state analysis
  currentStateReport: ConsequenceReport | null;
  initiativeViolations: Map<
    string,
    ReturnType<typeof getInitiativeViolations>
  >;

  // For evaluating proposed changes
  evaluateProposedChange: (
    initiative: Initiative,
    newStartDate: Date,
    newEndDate: Date,
  ) => ConsequenceReport;

  // Refresh data
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export function useConsequences(
  scenarioId: string,
): UseConsequencesResult {
  const [dependencies, setDependencies] = useState<InitiativeDependency[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [constraintLinks, setConstraintLinks] = useState<InitiativeConstraint[]>([]);
  const [requirements, setRequirements] = useState<InitiativeResourceRequirement[]>([]);
  const [pools, setPools] = useState<ResourcePool[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [constraintsData, poolsData, initsData] = await Promise.all([
        constraintsDb.getAll(),
        poolsDb.getAll(),
        initiativesDb.getByScenario(scenarioId),
      ]);

      // Load relationship data for each initiative
      const allDeps: InitiativeDependency[] = [];
      const allLinks: InitiativeConstraint[] = [];
      const allReqs: InitiativeResourceRequirement[] = [];

      for (const init of initsData) {
        const [deps, links, reqs] = await Promise.all([
          dependenciesDb.getByInitiative(init.id),
          constraintLinksDb.getByInitiative(init.id),
          requirementsDb.getByInitiative(init.id),
        ]);
        allDeps.push(...deps);
        allLinks.push(...links);
        allReqs.push(...reqs);
      }

      // Deduplicate
      const uniqueDeps = Array.from(
        new Map(allDeps.map((d) => [d.id, d])).values(),
      );
      const uniqueLinks = Array.from(
        new Map(allLinks.map((l) => [l.id, l])).values(),
      );
      const uniqueReqs = Array.from(
        new Map(allReqs.map((r) => [r.id, r])).values(),
      );

      setDependencies(uniqueDeps);
      setConstraints(constraintsData);
      setConstraintLinks(uniqueLinks);
      setRequirements(uniqueReqs);
      setPools(poolsData);
      setInitiatives(initsData);
    } catch (error) {
      console.error('Failed to load consequence data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build context object for consequence engine
  const context: ConsequenceContext = useMemo(
    () => ({
      initiatives,
      dependencies,
      constraints,
      constraintLinks,
      requirements,
      pools,
    }),
    [initiatives, dependencies, constraints, constraintLinks, requirements, pools],
  );

  // Evaluate current state
  const currentStateReport = useMemo(() => {
    if (isLoading || initiatives.length === 0) return null;
    return evaluateCurrentState(context);
  }, [context, isLoading, initiatives.length]);

  // Pre-compute violations for each initiative
  const initiativeViolations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getInitiativeViolations>>();
    if (isLoading) return map;

    for (const initiative of initiatives) {
      const violations = getInitiativeViolations(initiative, context);
      map.set(initiative.id, violations);
    }

    return map;
  }, [initiatives, context, isLoading]);

  // Function to evaluate a proposed change
  const evaluateProposedChange = useCallback(
    (initiative: Initiative, newStartDate: Date, newEndDate: Date) => {
      return evaluateChange(initiative, newStartDate, newEndDate, context);
    },
    [context],
  );

  return {
    dependencies,
    constraints,
    constraintLinks,
    requirements,
    pools,
    currentStateReport,
    initiativeViolations,
    evaluateProposedChange,
    refresh: loadData,
    isLoading,
  };
}

// Simplified version just for checking violations during drag
export function useQuickViolationCheck() {
  const couplingMode = useAppStore((state) => state.couplingMode);
  const showDependencyLines = useAppStore((state) => state.showDependencyLines);

  return {
    couplingMode,
    showDependencyLines,
  };
}
